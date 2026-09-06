// Ocean Data Service — API abstraction for Ocean3D Platform
// Seamless integration with FastAPI backend (xarray / NetCDF-4 Copernicus Marine)

import {
  OBSERVATION_STATIONS,
  COPERNICUS_DAILY_STATION_TELEMETRY,
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
function normalizeStation(s, idx = 0, date = '2026-06-23') {
  const code = s.code || (s.name ? s.name.split('—')[1]?.trim() || `ST-${idx + 1}` : `ST-${idx + 1}`);
  const daily = COPERNICUS_DAILY_STATION_TELEMETRY[code]?.[date] ||
                COPERNICUS_DAILY_STATION_TELEMETRY[s.id]?.[date];

  const lat = s.latitude ?? s.lat ?? (15.0 + idx * 2.0);
  const lon = s.longitude ?? s.lon ?? (72.0 + idx * 2.0);
  const temp = daily ? daily.temp : (s.temperature ?? s.baseTemp ?? 27.4);
  const sal = daily ? daily.sal : (s.salinity ?? s.baseSalinity ?? 35.2);
  const spd = daily ? daily.speed : (s.current_speed ?? s.baseSpeed ?? 1.24);
  const wave = daily ? daily.wave : (s.baseWave ?? 1.8);
  const density = daily ? daily.density : (s.density ?? 1024.0);

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
   * FastAPI Endpoint: GET /api/stations?date=2026-06-18
   */
  async getStations({ date = '2026-06-23', depth = null, timeIndex = null } = {}) {
    try {
      const params = new URLSearchParams();
      if (date) params.append('date', date);
      if (depth !== null && depth !== undefined) params.append('depth', String(depth));
      if (timeIndex !== null && timeIndex !== undefined) params.append('time_index', String(timeIndex));

      const res = await fetch(`${API_BASE_URL}/stations?${params.toString()}`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          this.isLiveBackend = true;
          return data.map((st, i) => normalizeStation(st, i, date));
        }
      }
    } catch (e) {
      console.warn('Could not reach /api/stations, falling back to local station registry:', e.message);
    }
    return OBSERVATION_STATIONS.map((st, i) => normalizeStation(st, i, date));
  },

  /**
   * Fetch specific observation station data at a given time and date
   * FastAPI Endpoint: GET /api/stations/{stationId}?date=...
   */
  async getStationDetails(stationId, hour = 12, date = '2026-06-23') {
    try {
      const params = new URLSearchParams();
      if (date) params.append('date', date);
      const res = await fetch(`${API_BASE_URL}/stations/${stationId}?${params.toString()}`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const rawStation = await res.json();
        const station = normalizeStation(rawStation, 0, date);
        return getStationObservationAtTime(station, hour, date);
      }
    } catch (e) {
      console.warn(`Fallback for station ${stationId}:`, e.message);
    }
    const station = OBSERVATION_STATIONS.find(s => s.id === stationId) || OBSERVATION_STATIONS[0];
    return getStationObservationAtTime(normalizeStation(station, 0, date), hour, date);
  },

  /**
   * Fetch 3D spatial grid from Copernicus Marine NetCDF dataset for selected date
   * FastAPI Endpoint: GET /api/ocean/grid?stride=20&date=2026-06-18
   */
  async getOceanGrid({ stride = 20, depth = null, timeIndex = -1, date = '2026-06-23', skipNan = true } = {}) {
    try {
      const params = new URLSearchParams({
        stride: String(stride),
        time_index: String(timeIndex),
        skip_nan: String(skipNan)
      });
      if (depth !== null && depth !== undefined) {
        params.append('depth', String(depth));
      }
      if (date) {
        params.append('date', date);
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

    // Dynamic fallback grid with daily variation matching Copernicus reanalysis
    const points = [];
    const dateOffset = {
      '2026-06-17': 0.15,
      '2026-06-18': 0.10,
      '2026-06-19': 0.05,
      '2026-06-20': 0.00,
      '2026-06-21': -0.05,
      '2026-06-22': -0.08,
      '2026-06-23': -0.12
    }[date] || 0.0;

    for (let lat = 2; lat <= 24; lat += 3) {
      for (let lon = 58; lon <= 90; lon += 4) {
        // Exclude rough Indian landmass
        if (lat > 8 && lat < 22 && lon > 74 && lon < 85) continue;
        const decay = Math.cos(lat * 0.1);
        const temp = +(28.2 + Math.sin(lat * 0.2) * 1.5 - (lon - 70) * 0.05 + dateOffset).toFixed(2);
        const salinity = +(35.0 + Math.cos(lon * 0.15) * 1.2 + dateOffset * 0.3).toFixed(2);
        const u = +(0.25 * Math.sin(lat * 0.3) + dateOffset * 0.1).toFixed(3);
        const v = +(0.18 * Math.cos(lon * 0.3)).toFixed(3);
        const spd = +(Math.sqrt(u * u + v * v)).toFixed(3);

        points.push({
          latitude: lat,
          longitude: lon,
          depth: depth || 0.49,
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
      timestamp: `${date || '2026-06-23'}T00:00:00Z`,
      metadata: null
    };
  },

  /**
   * Fetch ocean point data at specific coordinate from Copernicus NetCDF
   * FastAPI Endpoint: GET /api/ocean?lat={lat}&lon={lon}&depth={depth}&date={date}
   */
  async getOceanPoint(lat = 15.0, lon = 72.0, depth = 0.5, date = '2026-06-23') {
    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        depth: String(depth)
      });
      if (date) params.append('date', date);

      const res = await fetch(`${API_BASE_URL}/ocean?${params.toString()}`, {
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
      timestamp: `${date}T00:00:00Z`,
      data_type: 'reanalysis (mock)'
    };
  },

  /**
   * Fetch 24-hour time-series comparison between numerical model and observations for selected date
   */
  async getTimeSeries(stationId, variable = 'Temperature', date = '2026-06-23') {
    const station = OBSERVATION_STATIONS.find(s => s.id === stationId) || OBSERVATION_STATIONS[0];
    return Promise.resolve(generateTimeSeriesData(normalizeStation(station, 0, date), variable, date));
  },

  /**
   * Fetch vertical ocean profile (Depth vs Salinity / Temperature)
   */
  async getDepthProfile(stationId, date = '2026-06-23') {
    const station = OBSERVATION_STATIONS.find(s => s.id === stationId) || OBSERVATION_STATIONS[0];
    return Promise.resolve(generateDepthProfileData(normalizeStation(station, 0, date)));
  },

  /**
   * Fetch complete vertical profile from Copernicus NetCDF API for requested date
   * FastAPI Endpoint: GET /api/ocean/profile?lat=...&lon=...&date=...
   */
  async getVerticalProfile(lat = 10.57, lon = 72.63, stationId = null, date = '2026-06-23') {
    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
      });
      if (stationId) params.append('station_id', stationId);
      if (date) params.append('date', date);

      const res = await fetch(`${API_BASE_URL}/ocean/profile?${params.toString()}`, {
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const data = await res.json();
        this.isLiveBackend = true;
        return data;
      }
    } catch (e) {
      console.warn('Could not fetch /api/ocean/profile:', e.message);
    }
    const station = OBSERVATION_STATIONS.find(s => s.id === stationId) || OBSERVATION_STATIONS[3]; // default CB01
    const mockPoints = generateDepthProfileData(normalizeStation(station, 0, date));
    return {
      latitude: lat,
      longitude: lon,
      station_id: stationId,
      station_name: station.name,
      profile: mockPoints.map(p => ({
        depth: p.depthVal,
        temperature: p.temperature,
        salinity: p.salinity,
        current_speed: p.currentSpeed,
        density: p.density
      })),
      timestamp: `${date}T00:00:00Z`
    };
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
      dataset: 'Copernicus Marine GLORYS12V1 (0.49m - 11.40m Layer)'
    };
  },

  /**
   * Interactive Ocean AI Agent Query
   * FastAPI Endpoint: POST /api/ai/query
   */
  async queryAIAgent(payload) {
    try {
      const res = await fetch(`${API_BASE_URL}/ai/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend AI query endpoint unavailable, using client-side AI engine:', e.message);
    }
    return null;
  }
};

