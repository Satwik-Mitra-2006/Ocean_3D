"""
Ocean3D Visualization Platform — FastAPI Backend
================================================
Main entrypoint for the FastAPI application.
Handles CORS, application lifecycle, root diagnostics, and router attachment.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure backend root is always in Python module search path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Load environment variables from .env file
env_path = backend_dir / ".env"
load_dotenv(dotenv_path=env_path)

from api.routes import router as api_router
from models.ocean_model import BackendInfoResponse

# Application configuration from environment
APP_NAME = os.getenv("APP_NAME", "Ocean3D Visualization Platform Backend")
APP_VERSION = os.getenv("APP_VERSION", "1.0.0")
APP_ENV = os.getenv("APP_ENV", "development")

# Comma-separated CORS origins (defaults to '*' so Vercel frontend connects seamlessly)
raw_origins = os.getenv("CORS_ORIGINS", "*")
allowed_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

# Initialize FastAPI application
app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description=(
        "FastAPI Backend for the Ocean3D Visualization Platform. "
        "Provides oceanographic observation data, monitoring buoy telemetry, "
        "and 3D spatial grids ready for Copernicus Marine NetCDF integration."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure Cross-Origin Resource Sharing (CORS) for React frontend
is_wildcard = "*" in allowed_origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if is_wildcard else allowed_origins,
    allow_credentials=not is_wildcard,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Router
app.include_router(api_router)


@app.get(
    "/",
    response_model=BackendInfoResponse,
    tags=["Root Diagnostics"],
    summary="Root Service Info",
    description="Returns backend name, current running status, and API version.",
)
async def root():
    """Root endpoint for backend connectivity and identity check."""
    return BackendInfoResponse(
        name=APP_NAME,
        status="operational",
        version=APP_VERSION,
        docs_url="/docs",
    )


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))

    print(f"Starting {APP_NAME} on http://{host}:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=True)
