"""
Ocean Data Service Layer
========================
Handles oceanographic data processing, NetCDF historical reanalysis dataset extraction,
spatial grid downsampling, and observation buoy telemetry registry.

All data extracted from the local NetCDF file is historical reanalysis data
from the Copernicus Marine Service (GLORYS12V1 / ARCO).
"""

import logging
import math
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np
import xarray as xr

from models.ocean_model import (
    DatasetMetadata,
    HealthResponse,
    OceanDataResponse,
    OceanGridPoint,
    OceanGridResponse,
    StationResponse,
)

logger = logging.getLogger("ocean3d.service")


class OceanService:
    """Service providing ocean observation, station monitoring, and 3D grid data."""

    def __init__(self):
        # Copernicus configuration (optional credentials for future downloads)
        self.copernicus_user = os.getenv("COPERNICUS_USERNAME", "")
        self.copernicus_pass = os.getenv("COPERNICUS_PASSWORD", "")
        self.dataset_id = os.getenv(
            "COPERNICUS_DATASET_ID", "cmems_mod_glo_phy_my_0.083deg_P1D-m"
        )

        # Baseline sample stations (simulated observation buoys/floats for UI)
        self._sample_stations: List[Dict] = [
            {
                "id": "station-01",
                "code": "BD08",
                "name": "Station 01 — Moored Buoy BD08",
                "latitude": 15.20,
                "longitude": 72.80,
                "depth": 10.0,
                "temperature": 27.4,
                "salinity": 35.2,
                "current_speed": 1.24,
                "status": "Active",
                "region": "Arabian Sea (Central)",
                "source": "MoES / INCOIS National Data Buoy Programme (Simulated)",
            },
            {
                "id": "station-02",
                "code": "AD02",
                "name": "Station 02 — Deep Ocean Buoy AD02",
                "latitude": 18.50,
                "longitude": 67.20,
                "depth": 15.0,
                "temperature": 26.2,
                "salinity": 36.4,
                "current_speed": 0.95,
                "status": "Active",
                "region": "Northern Arabian Sea",
                "source": "INCOIS Ocean Monitoring Network (Simulated)",
            },
            {
                "id": "station-03",
                "code": "ARGO-1844",
                "name": "Station 03 — Argo Float 2901844",
                "latitude": 8.40,
                "longitude": 76.90,
                "depth": 50.0,
                "temperature": 28.8,
                "salinity": 34.8,
                "current_speed": 1.48,
                "status": "Active",
                "region": "South Indian Coastal Shelf",
                "source": "International Argo Project / INCOIS (Simulated)",
            },
            {
                "id": "station-04",
                "code": "CB01",
                "name": "Station 04 — Coastal Radar CB01",
                "latitude": 10.57,
                "longitude": 72.63,
                "depth": 5.0,
                "temperature": 29.1,
                "salinity": 34.2,
                "current_speed": 1.62,
                "status": "Warning",
                "region": "Lakshadweep Sea",
                "source": "NIOT / MoES Coastal Observation Network (Simulated)",
            },
            {
                "id": "station-05",
                "code": "BD11",
                "name": "Station 05 — Met Buoy BD11",
                "latitude": 20.00,
                "longitude": 88.50,
                "depth": 10.0,
                "temperature": 28.3,
                "salinity": 32.1,
                "current_speed": 1.10,
                "status": "Active",
                "region": "Northern Bay of Bengal",
                "source": "INCOIS Severe Weather Warning System (Simulated)",
            },
            {
                "id": "station-06",
                "code": "TB05",
                "name": "Station 06 — Tsunami Buoy TB05",
                "latitude": 5.50,
                "longitude": 85.20,
                "depth": 100.0,
                "temperature": 25.1,
                "salinity": 35.0,
                "current_speed": 0.72,
                "status": "Offline",
                "region": "Central Equatorial Indian Ocean",
                "source": "Indian Tsunami Early Warning Centre (Simulated)",
            },
        ]

        # Initialize dataset reference and metadata
        self._dataset_path: Optional[Path] = self._locate_netcdf_file()
        self._ds: Optional[xr.Dataset] = None
        self.dataset_metadata: Optional[DatasetMetadata] = None

        if self._dataset_path and self._dataset_path.exists():
            self._init_dataset()

    def _locate_netcdf_file(self) -> Optional[Path]:
        """Locate the downloaded Copernicus Marine NetCDF file in backend/data."""
        base_dir = Path(__file__).resolve().parent.parent
        data_dir = base_dir / "data"

        # Check explicit filename first
        primary_file = data_dir / "cmems_mod_glo_phy_my_0.083deg_P1D-m_1788438825634.nc"
        if primary_file.exists():
            return primary_file

        # Check for any .nc file matching the Copernicus product pattern
        nc_files = list(data_dir.glob("*.nc"))
        if nc_files:
            return nc_files[0]

        return None

    def _init_dataset(self) -> None:
        """Lazily initialize xarray Dataset and extract metadata without loading whole arrays."""
        if not self._dataset_path or not self._dataset_path.exists():
            self._ds = None
            self.dataset_metadata = None
            return

        try:
            # open_dataset with netcdf4 engine reads metadata only; data arrays are lazily accessed
            ds = xr.open_dataset(self._dataset_path, engine="netcdf4")
            self._ds = ds

            # Extract temporal bounds
            times = [str(t).split(".")[0] + "Z" for t in ds.time.values]
            time_start = times[0] if times else None
            time_end = times[-1] if times else None

            # Extract depth bounds
            depth_vals = [float(d) for d in ds.depth.values]
            depth_min = min(depth_vals) if depth_vals else 0.0
            depth_max = max(depth_vals) if depth_vals else 0.0

            # Extract spatial bounding box
            lat_vals = [float(la) for la in ds.latitude.values]
            lon_vals = [float(lo) for lo in ds.longitude.values]

            # Collect available physical variables
            available_vars = [
                var for var in ["thetao", "so", "uo", "vo"] if var in ds.data_vars
            ]

            self.dataset_metadata = DatasetMetadata(
                source="Copernicus Marine",
                dataset_id="cmems_mod_glo_phy_my_0.083deg_P1D-m",
                type="reanalysis",
                variables=available_vars,
                time_range={"start": time_start, "end": time_end}
                if time_start and time_end
                else None,
                depth_range={"min": round(depth_min, 2), "max": round(depth_max, 2)},
                spatial_bounds={
                    "lat_min": round(min(lat_vals), 2),
                    "lat_max": round(max(lat_vals), 2),
                    "lon_min": round(min(lon_vals), 2),
                    "lon_max": round(max(lon_vals), 2),
                },
            )
            logger.info("Successfully mounted Copernicus Marine NetCDF dataset: %s", self._dataset_path.name)
        except Exception as e:
            logger.error("Failed to open NetCDF dataset %s: %s", self._dataset_path, e)
            self._ds = None
            self.dataset_metadata = None

    def get_available_depths(self) -> Dict:
        """Return the exact real depth levels present in the mounted Copernicus NetCDF dataset."""
        if self._ds is not None and "depth" in self._ds.coords:
            depth_vals = [round(float(d), 2) for d in self._ds.depth.values]
            return {
                "available_depths": depth_vals,
                "min": min(depth_vals),
                "max": max(depth_vals),
                "count": len(depth_vals),
                "unit": "meters",
                "dataset": "Copernicus Marine GLORYS12V1 Reanalysis"
            }
        return {
            "available_depths": [0.49, 1.54, 2.65, 3.82, 5.08, 6.44, 7.93, 9.57, 11.40],
            "min": 0.49,
            "max": 11.40,
            "count": 9,
            "unit": "meters",
            "dataset": "Fallback subset"
        }

    def _get_utc_now_iso(self) -> str:
        """Return formatted ISO 8601 UTC timestamp."""
        return datetime.now(timezone.utc).isoformat()

    def _format_time_val(self, time_val) -> str:
        """Format an xarray/numpy datetime64 into ISO 8601 UTC string."""
        raw_str = str(time_val)
        cleaned = raw_str.split(".")[0]
        if not cleaned.endswith("Z"):
            cleaned += "Z"
        return cleaned

    def get_sample_ocean_data(
        self,
        lat: float = 15.0,
        lon: float = 72.0,
        depth: float = 0.5,
    ) -> OceanDataResponse:
        """
        Extract physical oceanographic observation parameters at a spatial point
        from the Copernicus Marine historical reanalysis NetCDF dataset.
        """
        if self._ds is not None:
            try:
                # Nearest point selection (lazy slice on latest available reanalysis time step)
                point = self._ds.isel(time=-1).sel(
                    latitude=lat, longitude=lon, depth=depth, method="nearest"
                )

                temp_val = float(point["thetao"].values)
                sal_val = float(point["so"].values)
                u_val = float(point["uo"].values)
                v_val = float(point["vo"].values)

                # Safe NaN handling: If point is on land, try nearby ocean coordinates
                if np.isnan(temp_val) or np.isnan(sal_val):
                    # Fallback to known open-ocean coordinates in Arabian Sea
                    point = self._ds.isel(time=-1).sel(
                        latitude=15.0, longitude=72.0, depth=0.5, method="nearest"
                    )
                    temp_val = float(point["thetao"].values)
                    sal_val = float(point["so"].values)
                    u_val = float(point["uo"].values)
                    v_val = float(point["vo"].values)

                actual_lat = round(float(point.latitude.values), 4)
                actual_lon = round(float(point.longitude.values), 4)
                actual_depth = round(float(point.depth.values), 2)
                speed = round(math.sqrt(u_val * u_val + v_val * v_val), 3)
                timestamp_str = self._format_time_val(point.time.values)

                return OceanDataResponse(
                    latitude=actual_lat,
                    longitude=actual_lon,
                    depth=actual_depth,
                    temperature=round(temp_val, 2),
                    salinity=round(sal_val, 2),
                    u_current=round(u_val, 3),
                    v_current=round(v_val, 3),
                    current_speed=speed,
                    timestamp=timestamp_str,
                    data_type="reanalysis",
                    metadata=self.dataset_metadata,
                )
            except Exception as e:
                logger.warning("Error querying NetCDF point, falling back to simulated values: %s", e)

        # Fallback if NetCDF file is unavailable
        u = 0.82
        v = 0.45
        speed = round(math.sqrt(u * u + v * v), 2)
        return OceanDataResponse(
            latitude=lat,
            longitude=lon,
            depth=depth,
            temperature=27.4,
            salinity=35.2,
            u_current=u,
            v_current=v,
            current_speed=speed,
            timestamp=self._get_utc_now_iso(),
            data_type="reanalysis",
            metadata=self.dataset_metadata,
        )

    def get_ocean_grid(
        self,
        stride: int = 15,
        depth: Optional[float] = None,
        time_index: int = -1,
        skip_nan: bool = True,
    ) -> OceanGridResponse:
        """
        Generate a spatial 3D ocean data grid from the real Copernicus Marine NetCDF dataset.

        Applies spatial downsampling / striding to keep the JSON payload compact (< 150 KB)
        and fast for React / Three.js point-cloud and vector visualization.
        """
        if self._ds is not None:
            try:
                # Ensure stride is at least 5 to prevent returning millions of points
                stride = max(5, int(stride))

                # Downsample latitude and longitude slices
                lat_sub = self._ds.latitude.values[::stride]
                lon_sub = self._ds.longitude.values[::stride]

                # Select depth layers
                if depth is not None:
                    # Single nearest depth layer requested
                    nearest_depth = float(
                        self._ds.depth.sel(depth=depth, method="nearest").values
                    )
                    depth_sub = np.array([nearest_depth])
                else:
                    # Default: 3 representative depth layers [Surface ~0.5m, Mid ~5.1m, Lower ~11.4m]
                    available_depths = self._ds.depth.values
                    if len(available_depths) >= 3:
                        depth_sub = available_depths[[0, len(available_depths) // 2, -1]]
                    else:
                        depth_sub = available_depths

                # Validate time index
                max_time_idx = self._ds.sizes["time"] - 1
                if abs(time_index) > max_time_idx:
                    time_index = -1

                # Slice only the required subset from disk lazily
                subset = self._ds.isel(time=time_index).sel(
                    latitude=lat_sub, longitude=lon_sub, depth=depth_sub
                )

                # Load only the downsampled block into memory
                thetao_arr = subset["thetao"].values
                so_arr = subset["so"].values
                uo_arr = subset["uo"].values
                vo_arr = subset["vo"].values

                points: List[OceanGridPoint] = []

                # Iterate and filter out land (NaN) cells safely
                for d_idx, d_val in enumerate(depth_sub):
                    for lat_idx, lat_val in enumerate(lat_sub):
                        for lon_idx, lon_val in enumerate(lon_sub):
                            t = thetao_arr[d_idx, lat_idx, lon_idx]

                            # Handle missing / land values
                            if np.isnan(t):
                                if skip_nan:
                                    continue
                                t = 0.0

                            s = so_arr[d_idx, lat_idx, lon_idx]
                            if np.isnan(s):
                                s = 0.0

                            u = uo_arr[d_idx, lat_idx, lon_idx]
                            if np.isnan(u):
                                u = 0.0

                            v = vo_arr[d_idx, lat_idx, lon_idx]
                            if np.isnan(v):
                                v = 0.0

                            speed = math.sqrt(u * u + v * v)

                            points.append(
                                OceanGridPoint(
                                    latitude=round(float(lat_val), 3),
                                    longitude=round(float(lon_val), 3),
                                    depth=round(float(d_val), 2),
                                    temperature=round(float(t), 2),
                                    salinity=round(float(s), 2),
                                    u_current=round(float(u), 3),
                                    v_current=round(float(v), 3),
                                    current_speed=round(float(speed), 3),
                                )
                            )

                timestamp_str = self._format_time_val(subset.time.values)

                return OceanGridResponse(
                    description="3D Ocean Reanalysis Physics Grid (Copernicus Marine — Indian Ocean / Arabian Sea)",
                    coordinate_system="WGS84 / EPSG:4326",
                    dimensions={
                        "lat_count": len(lat_sub),
                        "lon_count": len(lon_sub),
                        "depth_count": len(depth_sub),
                        "total_points": len(points),
                    },
                    latitudes=[round(float(x), 3) for x in lat_sub],
                    longitudes=[round(float(x), 3) for x in lon_sub],
                    depths=[round(float(x), 2) for x in depth_sub],
                    points=points,
                    timestamp=timestamp_str,
                    metadata=self.dataset_metadata,
                )
            except Exception as e:
                logger.error("Error generating NetCDF grid: %s", e)

        # Fallback if NetCDF is unavailable
        latitudes = [10.0, 15.0, 20.0]
        longitudes = [65.0, 70.0, 75.0]
        depths = [0.0, 50.0, 200.0]
        fallback_points: List[OceanGridPoint] = []

        for lat in latitudes:
            for lon in longitudes:
                for depth_m in depths:
                    decay = math.exp(-depth_m / 120.0)
                    temp = round(14.0 + 14.5 * decay + 0.5 * math.sin(lat * 0.2), 2)
                    sal = round(34.0 + 1.8 * (1.0 - 0.2 * decay) + 0.2 * math.cos(lon * 0.1), 2)
                    u = round((0.8 * math.cos(lat * 0.3) + 0.2) * decay, 3)
                    v = round((0.6 * math.sin(lon * 0.3)) * decay, 3)
                    speed = round(math.sqrt(u * u + v * v), 3)

                    fallback_points.append(
                        OceanGridPoint(
                            latitude=lat,
                            longitude=lon,
                            depth=depth_m,
                            temperature=temp,
                            salinity=sal,
                            u_current=u,
                            v_current=v,
                            current_speed=speed,
                        )
                    )

        return OceanGridResponse(
            description="3D Ocean Simulation Grid (Fallback)",
            coordinate_system="WGS84 / EPSG:4326",
            dimensions={
                "lat_count": len(latitudes),
                "lon_count": len(longitudes),
                "depth_count": len(depths),
                "total_points": len(fallback_points),
            },
            latitudes=latitudes,
            longitudes=longitudes,
            depths=depths,
            points=fallback_points,
            timestamp=self._get_utc_now_iso(),
            metadata=self.dataset_metadata,
        )

    def get_all_stations(self) -> List[StationResponse]:
        """
        Return all sample ocean observation stations.
        Maintains registered simulated buoy and float telemetry for the UI.
        """
        now = self._get_utc_now_iso()
        return [
            StationResponse(
                id=st["id"],
                name=st["name"],
                latitude=st["latitude"],
                longitude=st["longitude"],
                depth=st["depth"],
                temperature=st["temperature"],
                salinity=st["salinity"],
                current_speed=st["current_speed"],
                status=st["status"],
                region=st.get("region"),
                source=st.get("source"),
                timestamp=now,
            )
            for st in self._sample_stations
        ]

    def get_station_by_id(self, station_id: str) -> Optional[StationResponse]:
        """
        Retrieve details of a single observation station by its unique ID.
        Returns None if station is not found.
        """
        now = self._get_utc_now_iso()
        for st in self._sample_stations:
            if st["id"].lower() == station_id.strip().lower():
                return StationResponse(
                    id=st["id"],
                    name=st["name"],
                    latitude=st["latitude"],
                    longitude=st["longitude"],
                    depth=st["depth"],
                    temperature=st["temperature"],
                    salinity=st["salinity"],
                    current_speed=st["current_speed"],
                    status=st["status"],
                    region=st.get("region"),
                    source=st.get("source"),
                    timestamp=now,
                )
        return None

    def get_health_status(self) -> HealthResponse:
        """Return API service health and readiness flag for Copernicus."""
        copernicus_configured = bool(self.copernicus_user and self.copernicus_pass)
        dataset_available = bool(self._ds is not None)
        return HealthResponse(
            status="healthy",
            timestamp=self._get_utc_now_iso(),
            service="Ocean3D Backend Service",
            copernicus_configured=copernicus_configured,
            dataset_available=dataset_available,
            metadata=self.dataset_metadata,
        )


# Global singleton instance for injection into routes
ocean_service = OceanService()
