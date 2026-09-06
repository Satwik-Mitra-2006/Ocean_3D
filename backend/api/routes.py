"""
API Routes
==========
Contains all endpoint definitions for the Ocean3D Visualization Platform.
Keeps route definitions lean and delegates data logic to the service layer.
Exposes historical reanalysis oceanographic variables from Copernicus Marine.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Path, Query, status

from models.ocean_model import (
    AIAgentQueryRequest,
    AIAgentQueryResponse,
    HealthResponse,
    OceanDataResponse,
    OceanGridResponse,
    StationResponse,
    VerticalProfileResponse,
)
from services.ocean_service import ocean_service

router = APIRouter(prefix="/api", tags=["Ocean Data & Monitoring"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Service Health Check",
    description="Returns backend uptime status, current server time, and Copernicus NetCDF dataset status.",
)
async def get_health():
    """Check API health and local NetCDF dataset mounting status."""
    return ocean_service.get_health_status()


@router.get(
    "/ocean",
    response_model=OceanDataResponse,
    summary="Get Ocean Point Observation Data",
    description=(
        "Returns oceanographic physical parameters (temperature, salinity, u/v velocity vectors) "
        "extracted from the Copernicus Marine historical reanalysis NetCDF dataset."
    ),
)
async def get_ocean_data(
    lat: float = Query(15.0, description="Latitude in decimal degrees (0 to 30)"),
    lon: float = Query(72.0, description="Longitude in decimal degrees (40 to 100)"),
    depth: float = Query(0.5, description="Depth level in meters (0 to 11.4)"),
    date: Optional[str] = Query(None, description="Observation date (e.g. '2026-06-17' to '2026-06-23')"),
    time_index: Optional[int] = Query(None, description="Temporal slice index (0 to 6)"),
):
    """Retrieve oceanographic point observation data from Copernicus Marine reanalysis."""
    return ocean_service.get_sample_ocean_data(lat=lat, lon=lon, depth=depth, date=date, time_index=time_index)


@router.get(
    "/ocean/profile",
    response_model=VerticalProfileResponse,
    summary="Get Vertical Ocean Depth Profile",
    description=(
        "Extracts real vertical depth profiles (temperature, salinity, density, current speed) "
        "across all available depth levels down to 2000m from the Copernicus NetCDF dataset."
    ),
)
async def get_vertical_profile(
    lat: float = Query(10.57, description="Latitude in decimal degrees"),
    lon: float = Query(72.63, description="Longitude in decimal degrees"),
    station_id: Optional[str] = Query(None, description="Optional station identifier e.g. 'station-04' or 'CB01'"),
    date: Optional[str] = Query(None, description="Observation date (e.g. '2026-06-17' to '2026-06-23')"),
    time_index: Optional[int] = Query(None, description="Temporal slice index (0 to 6)"),
):
    """Retrieve complete vertical profile across all depth layers for the requested date."""
    return ocean_service.get_vertical_profile(lat=lat, lon=lon, station_id=station_id, date=date, time_index=time_index)


@router.get(
    "/ocean/depths",
    summary="Get Available Real Depths",
    description="Returns the exact real depth levels present in the local Copernicus Marine NetCDF dataset."
)
async def get_real_depths():
    """Get list of real depth levels from Copernicus NetCDF."""
    return ocean_service.get_available_depths()


@router.get(
    "/stations",
    response_model=List[StationResponse],
    summary="List Observation Stations",
    description="Returns registered ocean observation buoys and floats with physical telemetry sampled from Copernicus at the given date.",
)
async def get_stations(
    date: Optional[str] = Query(None, description="Observation date (e.g. '2026-06-17' to '2026-06-23')"),
    time_index: Optional[int] = Query(None, description="Temporal slice index (0 to 6)"),
    depth: Optional[float] = Query(None, description="Depth level in meters (0.49 to 11.40)"),
):
    """Retrieve list of all active ocean monitoring stations sampled at date."""
    return ocean_service.get_all_stations(date=date, time_index=time_index, depth=depth)


@router.get(
    "/stations/{station_id}",
    response_model=StationResponse,
    summary="Get Station Details",
    description="Returns complete details and latest measurements for a specific observation station ID.",
    responses={
        status.HTTP_404_NOT_FOUND: {
            "description": "Station ID does not exist in registry",
            "content": {
                "application/json": {
                    "example": {"detail": "Station with ID 'station-99' was not found"}
                }
            },
        }
    },
)
async def get_station_details(
    station_id: str = Path(..., description="Unique station identifier, e.g., 'station-01'"),
    date: Optional[str] = Query(None, description="Observation date (e.g. '2026-06-17' to '2026-06-23')"),
    time_index: Optional[int] = Query(None, description="Temporal slice index (0 to 6)"),
    depth: Optional[float] = Query(None, description="Depth level in meters (0.49 to 11.40)"),
):
    """Retrieve details of a single observation station or return 404 if not found."""
    station = ocean_service.get_station_by_id(station_id, date=date, time_index=time_index, depth=depth)
    if not station:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Station with ID '{station_id}' was not found",
        )
    return station


@router.get(
    "/ocean/grid",
    response_model=OceanGridResponse,
    summary="Get 3D Ocean Data Grid",
    description=(
        "Returns a downsampled 3D spatial grid (latitude, longitude, depth) from the Copernicus "
        "Marine historical reanalysis NetCDF dataset with thetao, so, uo, vo physical fields "
        "tailored for Three.js WebGL visualization."
    ),
)
async def get_ocean_grid(
    stride: int = Query(15, ge=5, le=100, description="Spatial subsampling stride across lat/lon cells"),
    depth: Optional[float] = Query(None, description="Specific depth slice in meters (None returns 3 multi-depth layers)"),
    time_index: int = Query(-1, description="Time index in historical reanalysis dataset (-1 for latest available date)"),
    date: Optional[str] = Query(None, description="Observation date (e.g. '2026-06-17' to '2026-06-23')"),
    skip_nan: bool = Query(True, description="Skip land / NaN cells to reduce JSON payload size"),
):
    """Retrieve 3D spatial ocean data grid for rendering point-clouds and vector fields at requested date."""
    return ocean_service.get_ocean_grid(
        stride=stride,
        depth=depth,
        time_index=time_index,
        date=date,
        skip_nan=skip_nan,
    )


@router.post(
    "/ai/query",
    response_model=AIAgentQueryResponse,
    summary="Query Ocean AI Agent",
    description="Interactively queries the Oceanographic AI Assistant for what-if scenarios, physical impacts, and marine advisory.",
)
async def query_ai_agent(req: AIAgentQueryRequest):
    """Query Ocean AI Agent with station context and arbitrary user questions."""
    return ocean_service.query_ocean_ai_agent(req)

