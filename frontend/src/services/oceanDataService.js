// Ocean Data Service — API abstraction for Ocean3D Platform
// Seamless integration with FastAPI backend (xarray / NetCDF-4 Copernicus Marine)

import {
  OBSERVATION_STATIONS,
  getStationObservationAtTime,
  generateTimeSeriesData,
  generateDepthProfileData,
  OCEAN_MODELS
} from '../data/mockOceanData';

// API base URL defaults to /api (proxied via Vite or served alongside FastAPI)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Normalizes backend station responses so all UI components can reliably access
 * both `lat` / `latitude`, `lon` / `longitude`, `baseTemp` / `temperature`, etc.
 */
function normalizeStation(s, idx = 0) {
  const lat = s.latitude ?? s.lat ?? (15.0 + idx * 2.0);
  const lon = s.longitude ?? s.lon ?? (72.0 + idx * 2.0);
  const temp = s.temperature ?? s.baseTemp ?? 27.4;
  const sal = s.salinity ?? s.baseSalinity ?? 35.2;
  const spd = s.current_speed ?? s.baseSpeed ?? 1.24;

  return {
    ...s,
    id: s.id || `station-0${idx + 1}`,
    name: s.name || `Station 0${idx + 1}`,
    code: s.code || (s.name ? s.name.split('—')[1]?.trim() || `ST-${idx + 1}` : `ST-${idx + 1}`),
    type: s.type || 'Moored Ocean Buoy',
    lat,
    lon,
    latitude: lat,
    longitude: lon,
    depth: s.depth ?? 10.0,
    status: s.status || 'Active',
    region: s.region || 'Indian Ocean',
    source: s.source || 'Copernicus Marine / INCOIS',
    health: s.health || '98% (Telemetry Active)',
    baseTemp: temp,
    temperature: temp,
    baseSalinity: sal,
    salinity: sal,
    baseSpeed: spd,
    current_speed: spd,
    baseWave: s.baseWave ?? 1.8,
    direction: s.direction || '145° SE',
    pressure: s.pressure ?? 1012.8,
    battery: s.battery || '12.8V (Solar Normal)',
    lastPing: s.lastPing || 'Active Telemetry'
  };
}

export const oceanDataService = {
  // Cached metadata from live backend
  cachedMetadata: null,
  isLiveBackend: false,

  /**
   * Check backend health and NetCDF dataset availability
   * FastAPI Endpoint: GET /api/health
   */
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(3500) });
      if (res.ok) {
        const data = await res.json();
        this.isLiveBackend = true;
        if (data.metadata) {
          this.cachedMetadata = data.metadata;
        }
        return data;
      }
    } catch (e) {
      console.warn('Backend /api/health not reachable, using fallback mock data mode:', e.message);
    }
    this.isLiveBackend = false;
    return {
      status: 'offline',
      service: 'Ocean3D Client (Demo Mode)',
      dataset_available: false,
      metadata: null
    };
  },

  /**
   * Fetch list of all in-situ observation stations with current health & coordinates
   * FastAPI Endpoint: GET /api/stations
   */
  async getStations() {
    try {
      const res = await fetch(`${API_BASE_URL}/stations`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          this.isLiveBackend = true;
          return data.map((st, i) => normalizeStation(st, i));
        }
      }
    } catch (e) {
      console.warn('Could not reach /api/stations, falling back to local station registry:', e.message);
    }
    return OBSERVATION_STATIONS.map((st, i) => normalizeStation(st, i));
  },

  /**
   * Fetch specific observation station data at a given time
   * FastAPI Endpoint: GET /api/stations/{stationId}
   */
  async getStationDetails(stationId, hour = 12) {
    try {
      const res = await fetch(`${API_BASE_URL}/stations/${stationId}`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const rawStation = await res.json();
        const station = normalizeStation(rawStation);
        return getStationObservationAtTime(station, hour);
      }
    } catch (e) {
      console.warn(`Fallback for station ${stationId}:`, e.message);
    }
    const station = OBSERVATION_STATIONS.find(s => s.id === stationId) || OBSERVATION_STATIONS[0];
    return getStationObservationAtTime(normalizeStation(station), hour);
  },

  /**
   * Fetch 3D spatial grid from Copernicus Marine NetCDF dataset
   * FastAPI Endpoint: GET /api/ocean/grid?stride=20
   */
  async getOceanGrid({ stride = 20, depth = null, timeIndex = -1, skipNan = true } = {}) {
    try {
      const params = new URLSearchParams({
        stride: String(stride),
        time_index: String(timeIndex),
        skip_nan: String(skipNan)
      });
      if (depth !== null && depth !== undefined) {
        params.append('depth', String(depth));
      }

      const res = await fetch(`${API_BASE_URL}/ocean/grid?${params.toString()}`, {
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) {
        const data = await res.json();
        this.isLiveBackend = true;
        if (data.metadata) {
          this.cachedMetadata = data.metadata;
        }
        return data;
      }
    } catch (e) {
      console.warn('Could not fetch /api/ocean/grid, generating synthetic grid:', e.message);
    }

    // Synthetic fallback grid over Indian Ocean / Arabian Sea (lat 0 to 25, lon 55 to 90)
    const points = [];
    for (let lat = 2; lat <= 24; lat += 3) {
      for (let lon = 58; lon <= 90; lon += 4) {
        // Exclude rough Indian landmass
        if (lat > 8 && lat < 22 && lon > 74 && lon < 85) continue;
        const decay = Math.cos(lat * 0.1);
        const temp = +(28.2 + Math.sin(lat * 0.2) * 1.5 - (lon - 70) * 0.05).toFixed(2);
        const salinity = +(35.0 + Math.cos(lon * 0.15) * 1.2).toFixed(2);
        const u = +(0.25 * Math.sin(lat * 0.3)).toFixed(3);
        const v = +(0.18 * Math.cos(lon * 0.3)).toFixed(3);
        const spd = +(Math.sqrt(u * u + v * v)).toFixed(3);

        points.push({
          latitude: lat,
          longitude: lon,
          depth: 0.49,
          temperature: temp,
          salinity: salinity,
          u_current: u,
          v_current: v,
          current_speed: spd
        });
      }
    }

    return {
      description: '3D Ocean Grid (Client Fallback)',
      coordinate_system: 'WGS84',
      dimensions: { total_points: points.length },
      points,
      timestamp: new Date().toISOString(),
      metadata: null
    };
  },

  /**
   * Fetch ocean point data at specific coordinate from Copernicus NetCDF
   * FastAPI Endpoint: GET /api/ocean?lat={lat}&lon={lon}&depth={depth}
   */
  async getOceanPoint(lat = 15.0, lon = 72.0, depth = 0.5) {
    try {
      const res = await fetch(`${API_BASE_URL}/ocean?lat=${lat}&lon=${lon}&depth=${depth}`, {
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Could not fetch /api/ocean point:', e.message);
    }
    return {
      latitude: lat,
      longitude: lon,
      depth: depth,
      temperature: 28.5,
      salinity: 35.1,
      u_current: 0.22,
      v_current: 0.15,
      current_speed: 0.27,
      timestamp: new Date().toISOString(),
      data_type: 'reanalysis (mock)'
    };
  },

  /**
   * Fetch 24-hour time-series comparison between numerical model and observations
   */
  async getTimeSeries(stationId, variable = 'Temperature') {
    const station = OBSERVATION_STATIONS.find(s => s.id === stationId) || OBSERVATION_STATIONS[0];
    return Promise.resolve(generateTimeSeriesData(normalizeStation(station), variable));
  },

  /**
   * Fetch vertical ocean profile (Depth vs Salinity / Temperature)
   */
  async getDepthProfile(stationId) {
    const station = OBSERVATION_STATIONS.find(s => s.id === stationId) || OBSERVATION_STATIONS[0];
    return Promise.resolve(generateDepthProfileData(normalizeStation(station)));
  },

  /**
   * Fetch ocean numerical model metadata
   */
  async getModelMetadata() {
    return Promise.resolve(OCEAN_MODELS);
  },

  /**
   * Fetch real depth levels available in the loaded Copernicus NetCDF dataset
   * FastAPI Endpoint: GET /api/ocean/depths
   */
  async getAvailableDepths() {
    try {
      const res = await fetch(`${API_BASE_URL}/ocean/depths`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Could not fetch /api/ocean/depths:', e.message);
    }
    return {
      available_depths: [0.49, 1.54, 2.65, 3.82, 5.08, 6.44, 7.93, 9.57, 11.40],
      min: 0.49,
      max: 11.40,
      count: 9,
      unit: 'meters',
      dataset: 'Fallback subset'
    };
  }
};
