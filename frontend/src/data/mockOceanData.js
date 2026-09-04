// Mock Ocean Data for Ocean3D Visualization Platform
// High-resolution scientific mock data designed for Smart India Hackathon ocean modeling

export const OBSERVATION_STATIONS = [
  {
    id: 'station-01',
    name: 'Station 01 — Moored Buoy BD08',
    code: 'BD08',
    type: 'Moored Data Buoy',
    lat: 15.20,
    lon: 72.80,
    region: 'Arabian Sea (Central)',
    depth: 10,
    status: 'Active', // 'Active' | 'Warning' | 'Offline'
    source: 'MoES / INCOIS National Data Buoy Programme',
    health: '98% (Telemetry Active)',
    baseTemp: 27.4,
    baseSalinity: 35.2,
    baseSpeed: 1.24,
    baseWave: 1.8,
    direction: '142° SE',
    pressure: 1012.8,
    battery: '12.8V (Solar Normal)',
    lastPing: '3 mins ago'
  },
  {
    id: 'station-02',
    name: 'Station 02 — Deep Ocean Buoy AD02',
    code: 'AD02',
    type: 'Moored Ocean Met Buoy',
    lat: 18.50,
    lon: 67.20,
    region: 'Northern Arabian Sea',
    depth: 15,
    status: 'Active',
    source: 'INCOIS Ocean Monitoring Network',
    health: '96% (Operational)',
    baseTemp: 26.2,
    baseSalinity: 36.4,
    baseSpeed: 0.95,
    baseWave: 2.3,
    direction: '210° SW',
    pressure: 1014.2,
    battery: '12.6V (Solar Normal)',
    lastPing: '7 mins ago'
  },
  {
    id: 'station-03',
    name: 'Station 03 — Argo Float 2901844',
    code: 'ARGO-1844',
    type: 'Autonomous Profiling Float',
    lat: 8.40,
    lon: 76.90,
    region: 'South Indian Coastal Shelf',
    depth: 50,
    status: 'Active',
    source: 'International Argo Project / INCOIS',
    health: '94% (Surfaced Profile)',
    baseTemp: 28.8,
    baseSalinity: 34.8,
    baseSpeed: 1.48,
    baseWave: 1.4,
    direction: '085° E',
    pressure: 1011.5,
    battery: '11.9V (Nominal)',
    lastPing: '12 mins ago'
  },
  {
    id: 'station-04',
    name: 'Station 04 — Coastal Radar CB01',
    code: 'CB01',
    type: 'Coastal HF Radar & Buoy Array',
    lat: 10.57,
    lon: 72.63,
    region: 'Lakshadweep Sea',
    depth: 5,
    status: 'Warning',
    source: 'NIOT / MoES Coastal Observation Network',
    health: '82% (Sensor Recalibration Req.)',
    baseTemp: 29.1,
    baseSalinity: 34.2,
    baseSpeed: 1.62,
    baseWave: 2.1,
    direction: '175° S',
    pressure: 1010.9,
    battery: '11.2V (Maintenance Flag)',
    lastPing: '24 mins ago'
  },
  {
    id: 'station-05',
    name: 'Station 05 — Met Buoy BD11',
    code: 'BD11',
    type: 'Deep Ocean Met-Ocean Buoy',
    lat: 20.00,
    lon: 88.50,
    region: 'Northern Bay of Bengal',
    depth: 10,
    status: 'Active',
    source: 'INCOIS Severe Weather Warning System',
    health: '99% (Operational)',
    baseTemp: 28.3,
    baseSalinity: 32.1,
    baseSpeed: 1.10,
    baseWave: 2.6,
    direction: '315° NW',
    pressure: 1008.4,
    battery: '12.9V (Solar Normal)',
    lastPing: '1 min ago'
  },
  {
    id: 'station-06',
    name: 'Station 06 — Tsunami Buoy TB05',
    code: 'TB05',
    type: 'BPR Tsunami Early Warning Buoy',
    lat: 5.50,
    lon: 85.20,
    region: 'Central Equatorial Indian Ocean',
    depth: 100,
    status: 'Offline',
    source: 'Indian Tsunami Early Warning Centre (ITEWC)',
    health: '0% (Satellite Comm Timeout)',
    baseTemp: 27.9,
    baseSalinity: 34.6,
    baseSpeed: 0.88,
    baseWave: 1.9,
    direction: '110° ESE',
    pressure: 1012.0,
    battery: '9.4V (Offline)',
    lastPing: '18 hours ago'
  }
];

// Helper to compute time-adjusted values based on hour (0 - 24)
export const getStationObservationAtTime = (station, hour = 12) => {
  if (!station) return null;

  const baseTemp = station.baseTemp ?? station.temperature ?? 27.4;
  const baseSalinity = station.baseSalinity ?? station.salinity ?? 35.2;
  const baseSpeed = station.baseSpeed ?? station.current_speed ?? 1.24;
  const baseWave = station.baseWave ?? 1.8;

  // Diurnal sinusoidal variation
  const hourAngle = ((hour - 6) / 24) * 2 * Math.PI;
  const tempVariation = Math.sin(hourAngle) * 0.85;
  const currentVariation = Math.cos(hourAngle * 2) * 0.18;
  const waveVariation = Math.sin(hourAngle + 0.5) * 0.25;
  const salinityVariation = Math.sin(hourAngle * 0.5) * 0.12;

  const currentTemp = +(baseTemp + tempVariation).toFixed(1);
  const currentSalinity = +(baseSalinity + salinityVariation).toFixed(1);
  const currentSpeed = +(Math.max(0.1, baseSpeed + currentVariation)).toFixed(2);
  const currentWave = +(Math.max(0.3, baseWave + waveVariation)).toFixed(1);

  const formattedHour = String(Math.floor(hour)).padStart(2, '0');
  const formattedMin = String(Math.floor((hour % 1) * 60)).padStart(2, '0');
  const timestamp = `2026-09-03 ${formattedHour}:${formattedMin} UTC`;

  return {
    ...station,
    lat: station.lat ?? station.latitude ?? 15.0,
    lon: station.lon ?? station.longitude ?? 72.0,
    baseTemp,
    baseSalinity,
    baseSpeed,
    baseWave,
    currentTemp,
    currentSalinity,
    currentSpeed,
    currentWave,
    timestamp
  };
};

// Generate 24-hour time series for charts
export const generateTimeSeriesData = (station, variable = 'Temperature') => {
  const baseT = station ? (station.baseTemp ?? station.temperature ?? 27.4) : 27.4;
  const baseS = station ? (station.baseSalinity ?? station.salinity ?? 35.2) : 35.2;
  const baseV = station ? (station.baseSpeed ?? station.current_speed ?? 1.24) : 1.24;

  const timePoints = [];
  for (let h = 0; h <= 24; h += 2) {
    const timeLabel = `${String(h).padStart(2, '0')}:00`;
    const rad = ((h - 6) / 24) * 2 * Math.PI;

    // Numerical model calculation with slight predictive offset
    const modelTemp = +(baseT + Math.sin(rad) * 0.95 + 0.2).toFixed(2);
    // In-situ observation with realistic sensor noise
    const obsNoise = (Math.sin(h * 3.7) * 0.22);
    const obsTemp = +(baseT + Math.sin(rad) * 0.85 + obsNoise).toFixed(2);

    const modelSalinity = +(baseS + Math.cos(rad) * 0.18).toFixed(2);
    const obsSalinity = +(baseS + Math.cos(rad) * 0.15 + (Math.cos(h * 2.1) * 0.08)).toFixed(2);

    const modelSpeed = +(Math.max(0.2, baseV + Math.sin(rad * 1.5) * 0.25)).toFixed(2);
    const obsSpeed = +(Math.max(0.2, baseV + Math.sin(rad * 1.5) * 0.22 + (Math.sin(h * 4.3) * 0.06))).toFixed(2);

    timePoints.push({
      time: timeLabel,
      hour: h,
      temperature: obsTemp,
      modelTemperature: modelTemp,
      salinity: obsSalinity,
      modelSalinity: modelSalinity,
      currentSpeed: obsSpeed,
      modelSpeed: modelSpeed,
      residualVariance: +(Math.abs(modelTemp - obsTemp)).toFixed(2)
    });
  }

  return timePoints;
};

// Generate Salinity & Temperature vs Real Depth Profile (0.49m to 11.4m)
export const generateDepthProfileData = (station) => {
  const baseS = station ? (station.baseSalinity ?? station.salinity ?? 35.2) : 35.2;
  const baseT = station ? (station.baseTemp ?? station.temperature ?? 28.5) : 28.5;
  const realDepths = [0.49, 1.54, 2.65, 3.82, 5.08, 6.44, 7.93, 9.57, 11.40];

  return realDepths.map(depth => {
    // Real near-surface stratification over 0.49m to 11.4m
    const tempDrop = (depth / 11.40) * 0.45; // Subtle mixed-layer cooling of ~0.45°C over 11m
    const salinityRise = (depth / 11.40) * 0.28; // Subtle salinity increase beneath freshwater skin

    const temperature = +(baseT - tempDrop).toFixed(2);
    const salinity = +(baseS + salinityRise).toFixed(2);
    const modelSalinity = +(baseS + salinityRise * 0.95).toFixed(2);

    return {
      depth: `${depth}m`,
      depthVal: depth,
      salinity,
      modelSalinity,
      temperature
    };
  });
};

export const OCEAN_MODELS = [
  { id: 'copernicus-glorys', name: 'Copernicus Global Reanalysis (GLORYS12V1)', grid: '1/12° (~9km)', updateRate: 'Daily P1D' },
  { id: 'incois-roms', name: 'INCOIS-ROMS High-Res (Operational)', grid: '1/12° (~9km)', updateRate: '6-hourly' },
  { id: 'hycom-global', name: 'HYCOM Global Ocean Analysis', grid: '1/12° Global', updateRate: 'Daily' }
];

export const DEPTH_LEVELS = [
  { id: 'd-0.49', label: '0.49 m (Near-Surface Layer)', value: 0.49 },
  { id: 'd-1.54', label: '1.54 m (Upper Mixed)', value: 1.54 },
  { id: 'd-2.65', label: '2.65 m (Subsurface)', value: 2.65 },
  { id: 'd-3.82', label: '3.82 m (Intermediate Upper)', value: 3.82 },
  { id: 'd-5.08', label: '5.08 m (Mid Subsurface)', value: 5.08 },
  { id: 'd-6.44', label: '6.44 m (Lower Subsurface)', value: 6.44 },
  { id: 'd-7.93', label: '7.93 m (Deep Subsurface)', value: 7.93 },
  { id: 'd-9.57', label: '9.57 m (Deep Mixed)', value: 9.57 },
  { id: 'd-11.4', label: '11.40 m (Max Available Depth)', value: 11.40 }
];

export const COLOR_SCALES = [
  { id: 'turbo', name: 'Turbo (Scientific Standard)', colors: ['#30123b', '#4163fb', '#1ae4b6', '#a2fc3c', '#fbb938', '#e23812', '#7a0403'] },
  { id: 'thermal', name: 'Thermal (SST High-Contrast)', colors: ['#0d0887', '#6a00a8', '#b12a90', '#e16462', '#fca636', '#f0f921'] },
  { id: 'deep-ocean', name: 'Deep Ocean (Bathy-Blue)', colors: ['#03071e', '#0b2545', '#134074', '#0077b6', '#00b4d8', '#90e0ef'] },
  { id: 'viridis', name: 'Viridis (Perceptual Linear)', colors: ['#440154', '#414487', '#2a788e', '#22a884', '#7ad151', '#fde725'] },
  { id: 'plasma', name: 'Plasma (Density Gradient)', colors: ['#0d0887', '#5c01a6', '#9c179e', '#cc4778', '#ed7953', '#fdb42f'] }
];
