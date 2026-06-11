# N8n Templates for WowDB

Ready-to-import N8n workflows that integrate with the WowDB API.

## How to import

1. Open your N8n instance.
2. **Workflows → Import from File** and pick a `.json` from this folder.
3. Edit credentials: set the **WowDB Header Auth** with header `X-API-Key` and your key (generate in WowDB Settings → API Keys).
4. Activate the workflow.

## Templates

| File | What it does |
|------|--------------|
| [`schema-drift-to-slack.json`](schema-drift-to-slack.json) | Receives WowDB `schema.drift` webhook → posts the diff to Slack channel |
| [`daily-csv-export.json`](daily-csv-export.json) | Every day 6am → runs a query on WowDB → writes CSV to local file |
| [`ai-query-on-trigger.json`](ai-query-on-trigger.json) | Webhook → Ask AI → executes generated SQL → returns JSON |
| [`quality-alert-to-discord.json`](quality-alert-to-discord.json) | Receives WowDB `quality.failed` webhook → posts to Discord |
| [`snapshot-to-github.json`](snapshot-to-github.json) | Cron 1×/day → captures schema snapshot → commits Markdown docs to GitHub |

## Wiring webhooks (drift / quality.failed)

In WowDB → `/automations` → Webhooks → New:

- **URL**: copy from N8n Webhook node (e.g. `https://n8n.example.com/webhook/wowdb-drift`)
- **Events**: `schema.drift` (or `quality.failed`, or `*` for all)
- **Secret**: any string — N8n can verify the HMAC `X-WowDB-Signature` header

All payloads ship as JSON with shape:

```json
{
  "event": "schema.drift",
  "delivered_at": "2026-06-10T12:00:00",
  "data": { ... }
}
```
