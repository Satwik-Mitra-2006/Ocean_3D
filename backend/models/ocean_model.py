from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class BackendInfoResponse(BaseModel):
    """Schema for root endpoint backend information."""
    name: str = Field(..., description="Backend service name")
    status: str = Field(..., description="Service operational status")
    version: str = Field(..., description="Semantic API version")
    docs_url: str = Field("/docs", description="Interactive OpenAPI documentation URL")


class DatasetMetadata(BaseModel):
    """Metadata schema for Copernicus Marine dataset provenance."""
    source: str = Field("Copernicus Marine", description="Data provider / repository")
    dataset_id: str = Field(
        "cmems_mod_glo_phy_my_0.083deg_P1D-m",
        description="Copernicus dataset product identifier"
    )
    type: str = Field("reanalysis", description="Dataset category (historical reanalysis)")
    variables: List[str] = Field(
        default_factory=lambda: ["thetao", "so", "uo", "vo"],
        description="Physical oceanographic variables extracted"
    )
    variable_descriptions: Dict[str, str] = Field(
        default_factory=lambda: {
            "thetao": "Sea water potential temperature (deg C)",
            "so": "Sea water salinity (PSU)",
            "uo": "Eastward sea water velocity (m/s)",
            "vo": "Northward sea water velocity (m/s)",
            "current_speed": "Magnitude of horizontal velocity vector (m/s)",
        }
    )
    time_range: Optional[Dict[str, str]] = Field(
        None, description="Available time range in ISO 8601 UTC"
    )
    depth_range: Optional[Dict[str, float]] = Field(
        None, description="Available depth range in meters"
    )
    spatial_bounds: Optional[Dict[str, float]] = Field(
        None, description="Spatial bounding box [lat_min, lat_max, lon_min, lon_max]"
    )


class OceanDataResponse(BaseModel):
    """Schema for sample point ocean observation data derived from Copernicus Marine."""
    latitude: float = Field(..., description="Latitude in decimal degrees (-90 to 90)")
    longitude: float = Field(..., description="Longitude in decimal degrees (-180 to 180)")
    depth: float = Field(..., description="Measurement depth in meters (positive downwards)")
    temperature: float = Field(..., description="Sea water potential temperature in °C (thetao)")
    salinity: float = Field(..., description="Practical Salinity Unit in PSU (so)")
    u_current: float = Field(..., description="Zonal current velocity (eastward) in m/s (uo)")
    v_current: float = Field(..., description="Meridional current velocity (northward) in m/s (vo)")
    current_speed: float = Field(..., description="Magnitude of ocean current velocity in m/s")
    timestamp: str = Field(..., description="Historical reanalysis ISO 8601 UTC timestamp")
    data_type: str = Field("reanalysis", description="Data category (historical reanalysis)")
    metadata: Optional[DatasetMetadata] = Field(None, description="Dataset provenance metadata")


class StationResponse(BaseModel):
    """Schema for in-situ ocean observation stations (simulated observation buoys/floats)."""
    id: str = Field(..., description="Unique station identifier")
    code: Optional[str] = Field(None, description="Short buoy telemetry code (e.g. BD08, AD02)")
    name: str = Field(..., description="Descriptive station name")
    latitude: float = Field(..., description="Station latitude in decimal degrees")
    longitude: float = Field(..., description="Station longitude in decimal degrees")
    depth: float = Field(..., description="Observation sensor depth in meters")
    temperature: float = Field(..., description="Water temperature in °C")
    salinity: float = Field(..., description="Salinity in PSU")
    current_speed: float = Field(..., description="Current speed in m/s")
    status: str = Field(..., description="Station operational state (Active, Warning, Offline)")
    timestamp: str = Field(..., description="Observation timestamp")
    region: Optional[str] = Field(None, description="Oceanographic sub-basin or region")
    source: Optional[str] = Field(None, description="Data provider or operating institution")


class OceanGridPoint(BaseModel):
    """Single node in a 3D ocean simulation / observation grid."""
    latitude: float = Field(..., description="Grid cell latitude")
    longitude: float = Field(..., description="Grid cell longitude")
    depth: float = Field(..., description="Depth layer in meters")
    temperature: float = Field(..., description="Potential temperature in °C (thetao)")
    salinity: float = Field(..., description="Salinity in PSU (so)")
    u_current: float = Field(..., description="Eastward current velocity component in m/s (uo)")
    v_current: float = Field(..., description="Northward current velocity component in m/s (vo)")
    current_speed: float = Field(..., description="Resultant current velocity in m/s")


class OceanGridResponse(BaseModel):
    """3D ocean spatial grid payload ready for Three.js / WebGL visualization."""
    description: str = Field(..., description="Grid description and coordinate system details")
    coordinate_system: str = Field("WGS84 / EPSG:4326", description="Spatial reference")
    dimensions: dict = Field(..., description="Dimension counts: {lat_count, lon_count, depth_count, total_points}")
    latitudes: List[float] = Field(..., description="Sample grid latitude slice values")
    longitudes: List[float] = Field(..., description="Sample grid longitude slice values")
    depths: List[float] = Field(..., description="Sample depth layers in meters")
    points: List[OceanGridPoint] = Field(..., description="Array of 3D grid cell values")
    timestamp: str = Field(..., description="Historical reanalysis extraction timestamp")
    metadata: Optional[DatasetMetadata] = Field(None, description="Dataset provenance metadata")


class HealthResponse(BaseModel):
    """Health check response schema."""
    status: str = Field(..., description="API operational health status")
    timestamp: str = Field(..., description="Server UTC time")
    service: str = Field(..., description="Service identifier")
    copernicus_configured: bool = Field(..., description="Whether Copernicus credentials are configured")
    dataset_available: bool = Field(True, description="Whether local NetCDF dataset is loaded and readable")
    metadata: Optional[DatasetMetadata] = Field(None, description="Copernicus Marine dataset provenance")
