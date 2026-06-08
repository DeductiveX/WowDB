from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.routers import health, connections, explorer, query, docs


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


settings = get_settings()

app = FastAPI(
    title="WowDB API",
    description="AI-native open-source database workbench — read-only MySQL explorer",
    version=settings.version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(connections.router)
app.include_router(explorer.router)
app.include_router(query.router)
app.include_router(docs.router)
