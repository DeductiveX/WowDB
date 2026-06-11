from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.auth import require_api_key
from app.config import get_settings
from app.database import init_db
from app.limiter import limiter
from app.routers import (
    health, connections, explorer, query, docs, erd, ai_context, api_keys,
    saved_queries, search, pii,
    webhooks, scheduled, snapshots, quality,
)
from app.services import scheduler_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    scheduler_service.boot_scheduler()
    try:
        yield
    finally:
        scheduler_service.shutdown_scheduler()


settings = get_settings()

app = FastAPI(
    title="WowDB API",
    description="AI-native open-source database workbench — read-only MySQL / PostgreSQL / SQLite explorer",
    version=settings.version,
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Public routes (no API key required)
app.include_router(health.router)

# Protected routes — when API_KEY_REQUIRED=true, X-API-Key is enforced
protected_deps = [Depends(require_api_key)]
app.include_router(connections.router, dependencies=protected_deps)
app.include_router(explorer.router, dependencies=protected_deps)
app.include_router(query.router, dependencies=protected_deps)
app.include_router(docs.router, dependencies=protected_deps)
app.include_router(erd.router, dependencies=protected_deps)
app.include_router(ai_context.router, dependencies=protected_deps)
app.include_router(api_keys.router, dependencies=protected_deps)
app.include_router(saved_queries.router, dependencies=protected_deps)
app.include_router(search.router, dependencies=protected_deps)
app.include_router(pii.router, dependencies=protected_deps)
app.include_router(webhooks.router, dependencies=protected_deps)
app.include_router(scheduled.router, dependencies=protected_deps)
app.include_router(snapshots.router, dependencies=protected_deps)
app.include_router(quality.router, dependencies=protected_deps)
