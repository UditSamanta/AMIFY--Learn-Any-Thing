from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.schema import CreateTable

from app.config import settings
from app.db.database import engine
from app.db.models import Base

# Create FastAPI app
app = FastAPI(title="Autonomous Academic Tutor")

from fastapi import Request
from fastapi.responses import JSONResponse
import logging

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.error(f"Unhandled error on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": str(exc), "type": type(exc).__name__}
    )

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(status_code=400, content={"error": str(exc)})

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    """
    On startup event handler:
    Initialize Database Tables if they do not exist
    """
    Base.metadata.create_all(bind=engine)

@app.get("/health")
def health_check():
    """Health check endpoint to ensure API gets loaded successfully."""
    return {"status": "ok"}

from app.api.routes import router
app.include_router(router, prefix="/api")
