"""
Ocean3D Visualization Platform — FastAPI Backend
================================================
Main entrypoint for the FastAPI application.
Handles CORS, application lifecycle, root diagnostics, and router attachment.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from .env file
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

from api.routes import router as api_router
from models.ocean_model import BackendInfoResponse

# Application configuration from environment
APP_NAME = os.getenv("APP_NAME", "Ocean3D Visualization Platform Backend")
APP_VERSION = os.getenv("APP_VERSION", "1.0.0")
APP_ENV = os.getenv("APP_ENV", "development")

# Comma-separated CORS origins
raw_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000",
)
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
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
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
