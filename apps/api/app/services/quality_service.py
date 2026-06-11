"""Data quality monitor evaluation."""

from datetime import datetime
from sqlalchemy.orm import Session

from app.models.connection import Connection, QualityMonitor
from app.services import db_service, webhook_service


def run_monitor(db: Session, monitor: QualityMonitor, conn: Connection, password: str | None) -> dict:
    """Execute the monitor's query and evaluate its assertion. Updates last_* fields."""
    try:
        result = db_service.execute_query(conn, password, monitor.database, monitor.query_text)
    except Exception as e:
        monitor.last_check_at = datetime.utcnow()
        monitor.last_passed = False
        monitor.last_value = str(e)[:200]
        db.commit()
        webhook_service.emit("quality.failed", {
            "monitor_id": monitor.id,
            "name": monitor.name,
            "reason": "query_error",
            "error": str(e),
        })
        return {"passed": False, "value": str(e), "expected": "(executed)", "message": "Query failed"}

    rows = result.get("rows", [])
    columns = result.get("columns", [])
    expected = monitor.threshold or ""
    value: str
    passed: bool
    message: str

    if monitor.assertion in ("count_gt", "count_eq", "count_lt"):
        value = str(len(rows))
        try:
            threshold_n = float(expected)
        except (ValueError, TypeError):
            threshold_n = 0.0
        n = len(rows)
        if monitor.assertion == "count_gt":
            passed = n > threshold_n
            message = f"{n} rows {'>' if passed else '≤'} {threshold_n}"
        elif monitor.assertion == "count_eq":
            passed = n == threshold_n
            message = f"{n} rows {'==' if passed else '!='} {threshold_n}"
        else:
            passed = n < threshold_n
            message = f"{n} rows {'<' if passed else '≥'} {threshold_n}"
    elif monitor.assertion == "no_nulls":
        col = expected or (columns[0] if columns else None)
        if not col:
            value = "no column"; passed = False; message = "no column to check"
        else:
            null_count = sum(1 for r in rows if r.get(col) is None)
            value = str(null_count)
            passed = null_count == 0
            message = f"{null_count} nulls in column '{col}'"
    elif monitor.assertion in ("value_min", "value_max"):
        col = (columns[0] if columns else None)
        if not col or not rows:
            value = "no value"; passed = False; message = "no value to compare"
        else:
            try:
                v = float(rows[0].get(col))
                threshold_n = float(expected)
                if monitor.assertion == "value_min":
                    passed = v >= threshold_n
                    message = f"{col}={v} {'≥' if passed else '<'} {threshold_n}"
                else:
                    passed = v <= threshold_n
                    message = f"{col}={v} {'≤' if passed else '>'} {threshold_n}"
                value = str(v)
            except (ValueError, TypeError):
                value = str(rows[0].get(col)); passed = False; message = "non-numeric value"
    else:
        value = ""; passed = False; message = f"unknown assertion {monitor.assertion}"

    monitor.last_check_at = datetime.utcnow()
    monitor.last_passed = passed
    monitor.last_value = value
    db.commit()

    if not passed:
        webhook_service.emit("quality.failed", {
            "monitor_id": monitor.id,
            "name": monitor.name,
            "assertion": monitor.assertion,
            "expected": expected,
            "actual": value,
            "message": message,
        })

    return {"passed": passed, "value": value, "expected": expected, "message": message}
