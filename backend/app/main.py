"""
Lumina AI - FastAPI Application Entrypoint
===========================================
Primary entrypoint for the Lumina AI backend service.
Configures CORS, lifespan events, database startup, and mounts API routers.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS, HOST, PORT
from app.models.db import init_db
from app.services.vector_store import vector_store
from app.api.routes import router as api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    print("[Lumina AI] Initializing database schemas...")
    init_db()
    print("[Lumina AI] Loading vector store index into memory...")
    vector_store.load_from_db()
    print(f"[Lumina AI] System online! Ready on {HOST}:{PORT}")
    yield
    # Shutdown actions
    print("[Lumina AI] Shutting down backend gracefully.")


app = FastAPI(
    title="Lumina AI — Multi-Agent RAG Knowledge Retrieval System",
    description="Production-grade Multi-Agent Retrieval-Augmented Generation system with real Gemini API integration, semantic search, Web Speech voice I/O, and transparent citations.",
    version="1.0.0",
    lifespan=lifespan
)

# Proper CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_router, prefix="/api")


@app.get("/", tags=["System"])
def root():
    return {
        "system": "Lumina AI — Multi-Agent RAG Knowledge Retrieval System",
        "version": "1.0.0",
        "status": "online",
        "documentation": "/docs",
        "endpoints": {
            "health": "/api/health",
            "upload": "/api/upload",
            "query": "/api/query",
            "documents": "/api/documents",
            "analytics": "/api/analytics",
            "conversations": "/api/conversations",
            "settings": "/api/settings"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)
