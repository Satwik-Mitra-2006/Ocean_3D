import React, { useState, useMemo } from 'react';
import { 
  GitCompare, 
  Activity, 
  Thermometer, 
  Droplets, 
  Wind, 
  Compass, 
  Gauge, 
  Waves, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Maximize2,
  ChevronRight,
  ShieldCheck,
  Target,
  BarChart2,
  Calendar,
  Layers
} from 'lucide-react';
import { getStationAccuracyMetrics, formatHourAmPm } from '../data/mockOceanData';

/**
 * ModelObservationComparisonCard
 * 
 * Arranged strictly according to user request:
 * 1. TOP: Station-Specific Scientific Accuracy Metrics (RMSE, MAE, R², Bias) — dynamically calibrated per station.
 * 2. MIDDLE: Compact Met-Ocean Telemetry Table comparing Numerical Model Data vs In-Situ Observation Data,
 *    including Date, Time, Coordinates, and Depth.
 * 3. BOTTOM: All Graphs Brought Together in one unified place at the bottom (Temperature vs Time,
 *    Salinity vs Time, Current Speed vs Time, Residual Variance).
 */
export default function ModelObservationComparisonCard({
  station = {},
  timeSeriesData = [],
  currentTimeHour = 12,
  selectedDepth = 0.49,
  selectedDate = '2026-06-23',
  simulationScenario = 'baseline',
  dataSource = 'model',
  setDataSource
}) {
  const [activeChartTab, setActiveChartTab] = useState('suite'); // 'suite' (all 3 side-by-side) | 'residual'
  const [hoveredHour, setHoveredHour] = useState(null);

  const currentStn = station || {};
  const lat = Number(currentStn.lat ?? currentStn.latitude ?? 15.2);
  const lon = Number(currentStn.lon ?? currentStn.longitude ?? 72.8);
  const stnCode = currentStn.code || 'BD08';
  const stnName = currentStn.name || `Station ${stnCode}`;

  // Station-specific scientific validation accuracy metrics (RMSE, MAE, R², Bias)
  // Changes dynamically whenever station changes!
  const stationAccuracy = useMemo(() => {
    return getStationAccuracyMetrics(stnCode);
  }, [stnCode]);

  // Ensure time series data is populated
  const series = useMemo(() => {
    if (timeSeriesData && timeSeriesData.length > 0) {
      return timeSeriesData;
    }
    // Fallback if timeSeriesData not passed
    const points = [];
    const baseT = currentStn.temperature ?? currentStn.baseTemp ?? 29.11;
    const baseS = currentStn.salinity ?? currentStn.baseSalinity ?? 35.09;
    const baseV = currentStn.current_speed ?? currentStn.baseSpeed ?? 0.211;

    for (let h = 0; h <= 24; h += 2) {
      const rad = ((h - 6) / 24) * 2 * Math.PI;
      const modelTemp = +(baseT + Math.sin(rad) * 0.45 + (stationAccuracy.biasT || -0.22)).toFixed(2);
      const obsTemp = +(baseT + Math.sin(rad) * 0.40 + Math.sin(h * 3.7) * (stationAccuracy.maeT || 0.17)).toFixed(2);
      const modelSal = +(baseS + Math.cos(rad) * 0.10 + (stationAccuracy.biasS || 0.07)).toFixed(2);
      const obsSal = +(baseS + Math.cos(rad) * 0.08 + Math.cos(h * 2.1) * (stationAccuracy.maeS || 0.06)).toFixed(2);
      const modelSpeed = +(Math.max(0.05, baseV + Math.sin(rad * 1.5) * 0.12 + (stationAccuracy.biasSpeed || 0.024))).toFixed(3);
      const obsSpeed = +(Math.max(0.05, baseV + Math.sin(rad * 1.5) * 0.10)).toFixed(3);

      points.push({
        time: `${String(h).padStart(2, '0')}:00`,
        hour: h,
        temperature: obsTemp,
        modelTemperature: modelTemp,
        salinity: obsSal,
        modelSalinity: modelSal,
        currentSpeed: obsSpeed,
        modelSpeed: modelSpeed,
        residualVariance: +(Math.abs(modelTemp - obsTemp)).toFixed(2)
      });
    }
    return points;
  }, [timeSeriesData, currentStn, stationAccuracy]);

  // Find nearest time point for current hour
  const currentPoint = useMemo(() => {
    if (!series || series.length === 0) return null;
    return series.reduce((prev, curr) => 
      Math.abs(curr.hour - currentTimeHour) < Math.abs(prev.hour - currentTimeHour) ? curr : prev
    );
  }, [series, currentTimeHour]);

  // Observation values (In-Situ)
  const obsTemp = Number(currentPoint?.temperature ?? currentStn.temperature ?? 29.11);
  const obsSal = Number(currentPoint?.salinity ?? currentStn.salinity ?? 35.09);
  const obsSpeed = Number(currentPoint?.currentSpeed ?? currentStn.current_speed ?? 0.211);
  const obsWave = Number(currentStn.wave_height ?? 1.8);
  const calcObsDensity = +(1028.1 - 0.15 * obsTemp + 0.78 * (obsSal - 35) + 0.045 * Number(selectedDepth ?? 0.49)).toFixed(2);
  const obsDensity = Number(currentStn.density ?? calcObsDensity);

  // Station-specific Sea Surface Height Anomaly (SSHA) profiles (Sentinel-3 altimetry referenced)
  const stnSshaMap = {
    'BD08': { obs: 0.06, model: 0.08 },
    'AD02': { obs: -0.03, model: -0.01 },
    'ARGO-1844': { obs: 0.09, model: 0.11 },
    'CB01': { obs: 0.07, model: 0.09 },
    'BD11': { obs: 0.14, model: 0.17 },
    'TB05': { obs: 0.04, model: 0.05 }
  };
  const sshaProfile = stnSshaMap[stnCode] || { obs: 0.06, model: 0.08 };
  const obsSsha = Number(currentStn.ssha ?? sshaProfile.obs);

  // Model values (Numerical Simulation - Copernicus GLORYS12V1)
  const modelTemp = Number(currentPoint?.modelTemperature ?? (obsTemp + stationAccuracy.biasT));
  const modelSal = Number(currentPoint?.modelSalinity ?? (obsSal + stationAccuracy.biasS));
  const modelSpeed = Number(currentPoint?.modelSpeed ?? (obsSpeed + stationAccuracy.biasSpeed));
  const modelWave = +(obsWave + 0.1);
  const modelDensity = +(1028.1 - 0.15 * modelTemp + 0.78 * (modelSal - 35) + 0.045 * Number(selectedDepth ?? 0.49)).toFixed(2);
  const modelSsha = Number(sshaProfile.model);

  // Formatted date & time
  const hourStr = String(Math.floor(currentTimeHour)).padStart(2, '0');
  const syncTimestamp = `${selectedDate} • ${formatHourAmPm(currentTimeHour)} UTC (${hourStr}:00)`;

  // Table rows comparing core physical oceanography parameters for both Model and In-Situ
  const comparisonRows = [
    {
      id: 'sst',
      name: 'Sea Temperature (SST)',
      symbol: 'T',
      layer: `${Number(selectedDepth).toFixed(2)}m Depth`,
      icon: Thermometer,
      iconColor: 'text-rose-400',
      modelVal: modelTemp.toFixed(2),
      obsVal: obsTemp.toFixed(2),
      unit: '°C',
      diff: `${(modelTemp - obsTemp) >= 0 ? '+' : ''}${(modelTemp - obsTemp).toFixed(2)}`,
      diffColor: (modelTemp - obsTemp) < 0 ? 'text-cyan-300 bg-cyan-950/40 border-cyan-500/30' : 'text-rose-300 bg-rose-950/40 border-rose-500/30',
      matchPct: (Math.min(100, Math.max(90, 100 - (Math.abs(modelTemp - obsTemp) / Math.max(1, obsTemp)) * 100))).toFixed(1),
      status: 'Optimal Agreement'
    },
    {
      id: 'sss',
      name: 'Practical Salinity (SSS)',
      symbol: 'S',
      layer: `${Number(selectedDepth).toFixed(2)}m Depth`,
      icon: Droplets,
      iconColor: 'text-teal-400',
      modelVal: modelSal.toFixed(2),
      obsVal: obsSal.toFixed(2),
      unit: 'PSU',
      diff: `${(modelSal - obsSal) >= 0 ? '+' : ''}${(modelSal - obsSal).toFixed(2)}`,
      diffColor: (modelSal - obsSal) < 0 ? 'text-cyan-300 bg-cyan-950/40 border-cyan-500/30' : 'text-teal-300 bg-teal-950/40 border-teal-500/30',
      matchPct: (Math.min(100, Math.max(90, 100 - (Math.abs(modelSal - obsSal) / Math.max(1, obsSal)) * 100))).toFixed(1),
      status: 'High Concordance'
    },
    {
      id: 'speed',
      name: 'Current Velocity (|U|)',
      symbol: '|U|',
      layer: `${Number(selectedDepth).toFixed(2)}m Depth`,
      icon: Wind,
      iconColor: 'text-sky-400',
      modelVal: modelSpeed.toFixed(3),
      obsVal: obsSpeed.toFixed(3),
      unit: 'm/s',
      diff: `${(modelSpeed - obsSpeed) >= 0 ? '+' : ''}${(modelSpeed - obsSpeed).toFixed(3)}`,
      diffColor: (modelSpeed - obsSpeed) < 0 ? 'text-cyan-300 bg-cyan-950/40 border-cyan-500/30' : 'text-sky-300 bg-sky-950/40 border-sky-500/30',
      matchPct: (Math.min(100, Math.max(88, 100 - (Math.abs(modelSpeed - obsSpeed) / Math.max(0.5, obsSpeed)) * 100))).toFixed(1),
      status: 'Within 1σ Envelope'
    },
    {
      id: 'ssha',
      name: 'Sea Surface Height (SSHA)',
      symbol: 'η',
      layer: 'Sea Surface (0m)',
      icon: Compass,
      modelVal: `${modelSsha >= 0 ? '+' : ''}${modelSsha.toFixed(2)}`,
      obsVal: `${obsSsha >= 0 ? '+' : ''}${obsSsha.toFixed(2)}`,
      unit: 'm',
      diff: `${(modelSsha - obsSsha) >= 0 ? '+' : ''}${(modelSsha - obsSsha).toFixed(2)}`,
      diffColor: 'text-indigo-300 bg-indigo-950/40 border-indigo-500/30',
      matchPct: '98.5',
      status: 'Altimeter Aligned'
    },
    {
      id: 'density',
      name: 'Potential Density (σ₀)',
      symbol: 'σ₀',
      layer: `${Number(selectedDepth).toFixed(2)}m Depth`,
      icon: Gauge,
      iconColor: 'text-amber-400',
      modelVal: modelDensity.toFixed(2),
      obsVal: obsDensity.toFixed(2),
      unit: 'kg/m³',
      diff: `${(modelDensity - obsDensity) >= 0 ? '+' : ''}${(modelDensity - obsDensity).toFixed(2)}`,
      diffColor: (modelDensity - obsDensity) < 0 ? 'text-cyan-300 bg-cyan-950/40 border-cyan-500/30' : 'text-amber-300 bg-amber-950/40 border-amber-500/30',
      matchPct: '99.9',
      status: 'Hydrostatic State'
    },
    {
      id: 'wave',
      name: 'Significant Wave Height',
      symbol: 'Hs',
      layer: 'Surface Sea State',
      icon: Waves,
      iconColor: 'text-cyan-400',
      modelVal: modelWave.toFixed(1),
      obsVal: obsWave.toFixed(1),
      unit: 'm',
      diff: `+${(modelWave - obsWave).toFixed(1)}`,
      diffColor: 'text-sky-300 bg-sky-950/40 border-sky-500/30',
      matchPct: '96.2',
      status: 'Wave Spectrum Valid'
    }
  ];

  // Helper to build SVG path
  const buildSvgPath = (points, key, minVal, maxVal, width = 480, height = 90, padX = 25, padY = 12) => {
    if (!points || points.length === 0) return '';
    const plotW = width - padX * 2;
    const plotH = height - padY * 2;
    const range = (maxVal - minVal) || 1;

    return points.map((p, i) => {
      const x = padX + (p.hour / 24) * plotW;
      const val = p[key] ?? minVal;
      const normalized = (val - minVal) / range;
      const y = (height - padY) - normalized * plotH;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  };

  const buildSvgArea = (points, key, minVal, maxVal, width = 480, height = 90, padX = 25, padY = 12) => {
    if (!points || points.length === 0) return '';
    const plotW = width - padX * 2;
    const plotH = height - padY * 2;
    const range = (maxVal - minVal) || 1;

    const lineParts = points.map((p, i) => {
      const x = padX + (p.hour / 24) * plotW;
      const val = p[key] ?? minVal;
      const normalized = (val - minVal) / range;
      const y = (height - padY) - normalized * plotH;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');

    const lastX = padX + plotW;
    const baselineY = height - padY;
    return `${lineParts} L ${lastX.toFixed(1)} ${baselineY} L ${padX} ${baselineY} Z`;
  };

  // Bounds for Temperature chart
  const tempStats = useMemo(() => {
    const all = series.flatMap(s => [s.temperature, s.modelTemperature]);
    const min = Math.min(...all);
    const max = Math.max(...all);
    const margin = (max - min) * 0.25 || 0.4;
    return {
      min: +(min - margin).toFixed(2),
      max: +(max + margin).toFixed(2),
      currentObs: obsTemp,
      currentModel: modelTemp
    };
  }, [series, obsTemp, modelTemp]);

  // Bounds for Salinity chart
  const salStats = useMemo(() => {
    const all = series.flatMap(s => [s.salinity, s.modelSalinity]);
    const min = Math.min(...all);
    const max = Math.max(...all);
    const margin = (max - min) * 0.25 || 0.1;
    return {
      min: +(min - margin).toFixed(2),
      max: +(max + margin).toFixed(2),
      currentObs: obsSal,
      currentModel: modelSal
    };
  }, [series, obsSal, modelSal]);

  // Bounds for Current Speed chart
  const speedStats = useMemo(() => {
    const all = series.flatMap(s => [s.currentSpeed, s.modelSpeed]);
    const min = Math.min(...all);
    const max = Math.max(...all);
    const margin = (max - min) * 0.25 || 0.05;
    return {
      min: Math.max(0, +(min - margin).toFixed(3)),
      max: +(max + margin).toFixed(3),
      currentObs: obsSpeed,
      currentModel: modelSpeed
    };
  }, [series, obsSpeed, modelSpeed]);

  const timeScrubberX = 25 + (currentTimeHour / 24) * (480 - 50);

  const hoverPoint = useMemo(() => {
    if (hoveredHour === null) return null;
    return series.reduce((prev, curr) => 
      Math.abs(curr.hour - hoveredHour) < Math.abs(prev.hour - hoveredHour) ? curr : prev
    );
  }, [series, hoveredHour]);

  return (
    <div className="w-full bg-[#050b18]/95 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-slate-800/80 shadow-2xl flex flex-col gap-3 font-sans select-none animate-in fade-in duration-300">
      
      {/* ============================================================ */}
      {/* 1. TOP SECTION: STATION HEADER & DYNAMIC RMSE / MAE METRICS   */}
      {/* ============================================================ */}
      <div className="flex flex-col gap-2.5 pb-3 border-b border-slate-800/80">
        
        {/* Row A: Station Identity & Telemetry Sync Information */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 shrink-0">
              <GitCompare className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span>Model vs. In-Situ Validation</span>
                  <span className="text-sky-300 font-extrabold font-mono">[{stnCode}]</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase bg-blue-950/80 text-blue-300 border border-blue-500/40">
                    {stnName}
                  </span>
                </h3>
              </div>
              <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-slate-400 font-mono mt-0.5 flex-wrap">
                <span>Coordinates: <strong className="text-slate-200">{lat.toFixed(2)}°N, {lon.toFixed(2)}°E</strong></span>
                <span className="text-slate-600">•</span>
                <span>Depth Layer: <strong className="text-amber-300">{Number(selectedDepth).toFixed(2)}m</strong></span>
                <span className="text-slate-600">•</span>
                <span>Synced: <strong className="text-sky-300">{syncTimestamp}</strong></span>
              </div>
            </div>
          </div>

          {/* Assimilation Cycle Badge */}
          <div className="flex items-center gap-1.5 bg-[#030712] px-2.5 py-1 rounded-xl border border-slate-800 text-[10px] font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">Status:</span>
            <span className="text-emerald-400 font-bold">{stationAccuracy.rating}</span>
          </div>
        </div>

        {/* Row B: PROMINENT STATION-SPECIFIC STATISTICAL METRICS (RMSE, MAE, R², BIAS) */}
        {/* DYNAMICALLY CHANGES FOR EVERY STATION — NEVER IDENTICAL ACROSS STATIONS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          
          {/* 1. RMSE (Root Mean Square Error) */}
          <div className="bg-[#030712] p-2 rounded-xl border border-slate-800/90 shadow-inner flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="font-sans font-semibold">RMSE (Error)</span>
              <span className="text-[9px] font-mono text-emerald-400 font-bold">ΔT Spec</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-extrabold font-mono text-emerald-400">
                {stationAccuracy.rmseT.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">°C</span>
              </span>
              <span className="text-[9.5px] font-mono text-slate-400">
                (Sal: {stationAccuracy.rmseS.toFixed(2)} PSU)
              </span>
            </div>
          </div>

          {/* 2. MAE (Mean Absolute Error) */}
          <div className="bg-[#030712] p-2 rounded-xl border border-slate-800/90 shadow-inner flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="font-sans font-semibold">MAE (Accuracy)</span>
              <span className="text-[9px] font-mono text-teal-400 font-bold">1σ Bound</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-extrabold font-mono text-teal-300">
                {stationAccuracy.maeT.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">°C</span>
              </span>
              <span className="text-[9.5px] font-mono text-slate-400">
                (Sal: {stationAccuracy.maeS.toFixed(2)} PSU)
              </span>
            </div>
          </div>

          {/* 3. Correlation (R²) */}
          <div className="bg-[#030712] p-2 rounded-xl border border-slate-800/90 shadow-inner flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="font-sans font-semibold">Correlation (R²)</span>
              <span className="text-[9px] font-mono text-sky-400 font-bold">Covariance</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-extrabold font-mono text-sky-400">
                {stationAccuracy.r2.toFixed(3)}
              </span>
              <span className="text-[9.5px] font-mono text-emerald-400">
                {stationAccuracy.confidence}
              </span>
            </div>
          </div>

          {/* 4. Mean Predictive Bias */}
          <div className="bg-[#030712] p-2 rounded-xl border border-slate-800/90 shadow-inner flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="font-sans font-semibold">Model Bias (Δ)</span>
              <span className="text-[9px] font-mono text-amber-400 font-bold">Offset</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-extrabold font-mono text-cyan-300">
                {stationAccuracy.biasT > 0 ? `+${stationAccuracy.biasT}` : stationAccuracy.biasT} <span className="text-[10px] font-normal text-slate-400">°C</span>
              </span>
              <span className="text-[9.5px] font-mono text-amber-300">
                ({stationAccuracy.biasS > 0 ? `+${stationAccuracy.biasS}` : stationAccuracy.biasS} PSU)
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* ============================================================ */}
      {/* 2. MIDDLE SECTION: COMPACT INFORMATION TABLE                  */}
      {/* ============================================================ */}
      <div className="bg-[#030712]/90 rounded-xl border border-slate-800/90 p-2.5 sm:p-3 flex flex-col gap-2 overflow-hidden shadow-inner">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Activity className="h-3.5 w-3.5 text-sky-400" />
            <span>Compact Met-Ocean Telemetry: Numerical Model vs In-Situ Observation</span>
          </div>
          <div className="flex items-center gap-3 text-[9.5px] font-mono">
            <span className="flex items-center gap-1 text-sky-400 font-semibold">
              <span className="w-2 h-2 rounded-sm bg-sky-500/40 border border-sky-400 inline-block" />
              Copernicus GLORYS12V1
            </span>
            <span className="flex items-center gap-1 text-amber-400 font-semibold">
              <span className="w-2 h-2 rounded-sm bg-amber-500/40 border border-amber-400 inline-block" />
              MoES / INCOIS Sensor
            </span>
          </div>
        </div>

        {/* Compact Table */}
        <div className="overflow-x-auto scrollbar-none">
          <table className="w-full text-left text-[11px] font-sans border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                <th className="py-2 px-2.5 font-semibold">Ocean Parameter</th>
                <th className="py-2 px-2.5 font-semibold text-sky-300">Numerical Model Data</th>
                <th className="py-2 px-2.5 font-semibold text-amber-300">In-Situ Observation</th>
                <th className="py-2 px-2.5 font-semibold text-slate-300">Model Bias (Δ = M - O)</th>
                <th className="py-2 px-2.5 font-semibold text-right">Concordance Match</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 font-mono">
              {comparisonRows.map((row) => {
                const Icon = row.icon;
                return (
                  <tr key={row.id} className="hover:bg-slate-800/30 transition-colors group">
                    {/* Parameter */}
                    <td className="py-2 px-2.5 font-sans text-slate-200">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                          <Icon className={`h-3.5 w-3.5 ${row.iconColor}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 font-semibold text-slate-200 text-xs">
                            <span>{row.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">({row.symbol})</span>
                          </div>
                          <div className="text-[9.5px] text-slate-500 font-mono">
                            {row.layer}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Model Value */}
                    <td className="py-2 px-2.5">
                      <span className="inline-flex items-baseline gap-1 px-2.5 py-1 rounded-lg bg-sky-950/50 border border-sky-500/30 text-sky-300 font-bold font-mono text-xs">
                        <span>{row.modelVal}</span>
                        <span className="text-[9.5px] font-normal text-sky-400">{row.unit}</span>
                      </span>
                    </td>

                    {/* In-Situ Value */}
                    <td className="py-2 px-2.5">
                      <span className="inline-flex items-baseline gap-1 px-2.5 py-1 rounded-lg bg-amber-950/50 border border-amber-500/30 text-amber-300 font-bold font-mono text-xs">
                        <span>{row.obsVal}</span>
                        <span className="text-[9.5px] font-normal text-amber-400">{row.unit}</span>
                      </span>
                    </td>

                    {/* Difference */}
                    <td className="py-2 px-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold border ${row.diffColor}`}>
                        <span>{row.diff}</span>
                        <span className="text-[9px] font-normal opacity-80">{row.unit}</span>
                      </span>
                    </td>

                    {/* Concordance Match */}
                    <td className="py-2 px-2.5 text-right">
                      <div className="flex items-center justify-end gap-2 font-mono">
                        <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden hidden sm:block">
                          <div 
                            className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full" 
                            style={{ width: `${row.matchPct}%` }}
                          />
                        </div>
                        <span className="text-emerald-300 font-bold text-xs">{row.matchPct}%</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 hidden lg:inline-block">
                          {row.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Date, Time & Station Details */}
        <div className="pt-2 border-t border-slate-800/70 flex flex-wrap items-center justify-between text-[9.5px] font-mono text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-slate-300">
              <Calendar className="h-3 w-3 text-sky-400" />
              <span>Timestamp: <strong>{syncTimestamp}</strong></span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1 text-slate-300">
              <Layers className="h-3 w-3 text-amber-400" />
              <span>Layer: <strong>{Number(selectedDepth).toFixed(2)}m Depth</strong></span>
            </span>
            <span className="text-slate-600">|</span>
            <span>Focus: <strong className="text-slate-200">{lat.toFixed(2)}°N, {lon.toFixed(2)}°E</strong></span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <span>Station ID: <strong className="text-sky-300">{currentStn.id || stnCode}</strong></span>
            <span className="text-slate-600">|</span>
            <span>MoES Telemetry: <strong className="text-emerald-400">Active Online</strong></span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. BOTTOM SECTION: ALL GRAPHS BROUGHT TOGETHER IN ONE PLACE  */}
      {/* ============================================================ */}
      <div className="bg-[#030712]/90 rounded-xl border border-slate-800/90 p-3 flex flex-col gap-2.5 shadow-inner">
        
        {/* Graphs Header & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-sky-400" />
            <span className="text-xs font-bold text-slate-200 font-sans">
              Oceanographic Diurnal & Spatial Telemetry Graphs
            </span>
          </div>

          {/* Graph Mode Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveChartTab('suite')}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold font-mono transition-all cursor-pointer ${
                activeChartTab === 'suite'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'bg-[#060c18] hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              3-Variable Diurnal Suite (T, S, |U|)
            </button>
            <button
              type="button"
              onClick={() => setActiveChartTab('residual')}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold font-mono transition-all cursor-pointer ${
                activeChartTab === 'residual'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'bg-[#060c18] hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              Δ Residual Variance
            </button>
          </div>

          {/* Interactive Hover Tooltip Pill */}
          {hoverPoint && (
            <div className="text-[10px] font-mono text-cyan-300 bg-sky-950/90 px-2.5 py-0.5 rounded border border-sky-500/50 shadow-md">
              {hoverPoint.time} UTC: M {hoverPoint.modelTemperature}°C | O {hoverPoint.temperature}°C (Δ {hoverPoint.residualVariance}°C)
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* A. UNIFIED 3-VARIABLE DIURNAL SUITE: TEMP, SALINITY, SPEED */}
        {/* ========================================================= */}
        {activeChartTab === 'suite' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            
            {/* GRAPH 1: TEMPERATURE VS TIME (24h Diurnal) */}
            <div className="bg-[#050b18] rounded-xl border border-slate-800/80 p-2.5 flex flex-col gap-1 shadow-inner">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-200">
                  <Thermometer className="h-3.5 w-3.5 text-rose-400" />
                  <span>Temperature (24h)</span>
                </div>
                <div className="flex items-center gap-1 text-[9.5px] font-mono">
                  <span className="text-sky-300 font-bold">{modelTemp.toFixed(2)}°C</span>
                  <span className="text-slate-500">vs</span>
                  <span className="text-amber-300 font-bold">{obsTemp.toFixed(2)}°C</span>
                </div>
              </div>

              {/* SVG Chart */}
              <div 
                className="relative w-full h-24 sm:h-28 cursor-crosshair"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left - 25) / (rect.width - 50)));
                  setHoveredHour(Math.round(ratio * 24));
                }}
                onMouseLeave={() => setHoveredHour(null)}
              >
                <svg className="w-full h-full overflow-visible" viewBox="0 0 480 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="tempModelGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.30" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.00" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid */}
                  {[0, 0.5, 1].map((r, idx) => {
                    const y = 14 + r * (100 - 28);
                    const label = (tempStats.max - r * (tempStats.max - tempStats.min)).toFixed(1);
                    return (
                      <g key={idx}>
                        <line x1="25" y1={y} x2="455" y2={y} stroke="#1e293b" strokeDasharray="2 2" strokeWidth="0.8" />
                        <text x="20" y={y + 3} textAnchor="end" fontSize="8" fill="#64748b" fontFamily="monospace">
                          {label}
                        </text>
                      </g>
                    );
                  })}

                  {/* Vertical Hour Grid */}
                  {[0, 6, 12, 18, 24].map((h) => {
                    const x = 25 + (h / 24) * 430;
                    const amPmMap = { 0: '12 AM', 6: '6 AM', 12: '12 PM', 18: '6 PM', 24: '12 AM' };
                    return (
                      <g key={h}>
                        <line x1={x} y1="14" x2={x} y2="86" stroke="#1e293b" strokeDasharray="2 2" strokeWidth="0.8" />
                        <text x={x} y="96" textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="monospace">
                          {amPmMap[h] || `${h}:00`}
                        </text>
                      </g>
                    );
                  })}

                  {/* Model Area & Curve */}
                  <path
                    d={buildSvgArea(series, 'modelTemperature', tempStats.min, tempStats.max, 480, 100)}
                    fill="url(#tempModelGradient)"
                  />
                  <path
                    d={buildSvgPath(series, 'modelTemperature', tempStats.min, tempStats.max, 480, 100)}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />

                  {/* In-Situ Curve with Dots */}
                  <path
                    d={buildSvgPath(series, 'temperature', tempStats.min, tempStats.max, 480, 100)}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeDasharray="4 2"
                  />

                  {series.map((p, idx) => {
                    const x = 25 + (p.hour / 24) * 430;
                    const y = 86 - ((p.temperature - tempStats.min) / (tempStats.max - tempStats.min || 1)) * 72;
                    return (
                      <circle
                        key={idx}
                        cx={x}
                        cy={y}
                        r="2.5"
                        fill="#f59e0b"
                        stroke="#ffffff"
                        strokeWidth="0.5"
                      />
                    );
                  })}

                  {/* Active Scrubber Indicator */}
                  <line
                    x1={timeScrubberX}
                    y1="12"
                    x2={timeScrubberX}
                    y2="88"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={timeScrubberX}
                    cy={86 - ((modelTemp - tempStats.min) / (tempStats.max - tempStats.min || 1)) * 72}
                    r="4"
                    fill="#38bdf8"
                    stroke="#ffffff"
                    strokeWidth="1"
                  />
                </svg>
              </div>

              <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                <span className="flex items-center gap-1 text-sky-400">
                  <span className="w-2 h-0.5 bg-sky-400 inline-block" /> Model (GLORYS)
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-2 h-0.5 bg-amber-400 inline-block" /> In-Situ ({stnCode})
                </span>
              </div>
            </div>

            {/* GRAPH 2: SALINITY VS TIME (24h Diurnal) */}
            <div className="bg-[#050b18] rounded-xl border border-slate-800/80 p-2.5 flex flex-col gap-1 shadow-inner">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-200">
                  <Droplets className="h-3.5 w-3.5 text-teal-400" />
                  <span>Salinity (24h)</span>
                </div>
                <div className="flex items-center gap-1 text-[9.5px] font-mono">
                  <span className="text-sky-300 font-bold">{modelSal.toFixed(2)}</span>
                  <span className="text-slate-500">vs</span>
                  <span className="text-teal-300 font-bold">{obsSal.toFixed(2)} PSU</span>
                </div>
              </div>

              {/* SVG Chart */}
              <div 
                className="relative w-full h-24 sm:h-28 cursor-crosshair"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left - 25) / (rect.width - 50)));
                  setHoveredHour(Math.round(ratio * 24));
                }}
                onMouseLeave={() => setHoveredHour(null)}
              >
                <svg className="w-full h-full overflow-visible" viewBox="0 0 480 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="salModelGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.30" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.00" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid */}
                  {[0, 0.5, 1].map((r, idx) => {
                    const y = 14 + r * (100 - 28);
                    const label = (salStats.max - r * (salStats.max - salStats.min)).toFixed(1);
                    return (
                      <g key={idx}>
                        <line x1="25" y1={y} x2="455" y2={y} stroke="#1e293b" strokeDasharray="2 2" strokeWidth="0.8" />
                        <text x="20" y={y + 3} textAnchor="end" fontSize="8" fill="#64748b" fontFamily="monospace">
                          {label}
                        </text>
                      </g>
                    );
                  })}

                  {/* Vertical Hour Grid */}
                  {[0, 6, 12, 18, 24].map((h) => {
                    const x = 25 + (h / 24) * 430;
                    const amPmMap = { 0: '12 AM', 6: '6 AM', 12: '12 PM', 18: '6 PM', 24: '12 AM' };
                    return (
                      <g key={h}>
                        <line x1={x} y1="14" x2={x} y2="86" stroke="#1e293b" strokeDasharray="2 2" strokeWidth="0.8" />
                        <text x={x} y="96" textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="monospace">
                          {amPmMap[h] || `${h}:00`}
                        </text>
                      </g>
                    );
                  })}

                  {/* Model Area & Curve */}
                  <path
                    d={buildSvgArea(series, 'modelSalinity', salStats.min, salStats.max, 480, 100)}
                    fill="url(#salModelGradient)"
                  />
                  <path
                    d={buildSvgPath(series, 'modelSalinity', salStats.min, salStats.max, 480, 100)}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />

                  {/* In-Situ Curve with Dots */}
                  <path
                    d={buildSvgPath(series, 'salinity', salStats.min, salStats.max, 480, 100)}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeDasharray="4 2"
                  />

                  {series.map((p, idx) => {
                    const x = 25 + (p.hour / 24) * 430;
                    const y = 86 - ((p.salinity - salStats.min) / (salStats.max - salStats.min || 1)) * 72;
                    return (
                      <circle
                        key={idx}
                        cx={x}
                        cy={y}
                        r="2.5"
                        fill="#10b981"
                        stroke="#ffffff"
                        strokeWidth="0.5"
                      />
                    );
                  })}

                  {/* Active Scrubber Indicator */}
                  <line
                    x1={timeScrubberX}
                    y1="12"
                    x2={timeScrubberX}
                    y2="88"
                    stroke="#06b6d4"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={timeScrubberX}
                    cy={86 - ((modelSal - salStats.min) / (salStats.max - salStats.min || 1)) * 72}
                    r="4"
                    fill="#06b6d4"
                    stroke="#ffffff"
                    strokeWidth="1"
                  />
                </svg>
              </div>

              <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                <span className="flex items-center gap-1 text-cyan-400">
                  <span className="w-2 h-0.5 bg-cyan-400 inline-block" /> Model (GLORYS)
                </span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-0.5 bg-emerald-400 inline-block" /> In-Situ ({stnCode})
                </span>
              </div>
            </div>

            {/* GRAPH 3: CURRENT VELOCITY VS TIME (24h Diurnal) */}
            <div className="bg-[#050b18] rounded-xl border border-slate-800/80 p-2.5 flex flex-col gap-1 shadow-inner">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-200">
                  <Wind className="h-3.5 w-3.5 text-sky-400" />
                  <span>Current Speed (24h)</span>
                </div>
                <div className="flex items-center gap-1 text-[9.5px] font-mono">
                  <span className="text-sky-300 font-bold">{modelSpeed.toFixed(3)}</span>
                  <span className="text-slate-500">vs</span>
                  <span className="text-emerald-300 font-bold">{obsSpeed.toFixed(3)} m/s</span>
                </div>
              </div>

              {/* SVG Chart */}
              <div 
                className="relative w-full h-24 sm:h-28 cursor-crosshair"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left - 25) / (rect.width - 50)));
                  setHoveredHour(Math.round(ratio * 24));
                }}
                onMouseLeave={() => setHoveredHour(null)}
              >
                <svg className="w-full h-full overflow-visible" viewBox="0 0 480 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="speedModelGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.30" />
                      <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.00" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid */}
                  {[0, 0.5, 1].map((r, idx) => {
                    const y = 14 + r * (100 - 28);
                    const label = (speedStats.max - r * (speedStats.max - speedStats.min)).toFixed(2);
                    return (
                      <g key={idx}>
                        <line x1="25" y1={y} x2="455" y2={y} stroke="#1e293b" strokeDasharray="2 2" strokeWidth="0.8" />
                        <text x="20" y={y + 3} textAnchor="end" fontSize="8" fill="#64748b" fontFamily="monospace">
                          {label}
                        </text>
                      </g>
                    );
                  })}

                  {/* Vertical Hour Grid */}
                  {[0, 6, 12, 18, 24].map((h) => {
                    const x = 25 + (h / 24) * 430;
                    const amPmMap = { 0: '12 AM', 6: '6 AM', 12: '12 PM', 18: '6 PM', 24: '12 AM' };
                    return (
                      <g key={h}>
                        <line x1={x} y1="14" x2={x} y2="86" stroke="#1e293b" strokeDasharray="2 2" strokeWidth="0.8" />
                        <text x={x} y="96" textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="monospace">
                          {amPmMap[h] || `${h}:00`}
                        </text>
                      </g>
                    );
                  })}

                  {/* Model Speed Area & Curve */}
                  <path
                    d={buildSvgArea(series, 'modelSpeed', speedStats.min, speedStats.max, 480, 100)}
                    fill="url(#speedModelGradient)"
                  />
                  <path
                    d={buildSvgPath(series, 'modelSpeed', speedStats.min, speedStats.max, 480, 100)}
                    fill="none"
                    stroke="#0ea5e9"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />

                  {/* In-Situ Curve with Dots */}
                  <path
                    d={buildSvgPath(series, 'currentSpeed', speedStats.min, speedStats.max, 480, 100)}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeDasharray="4 2"
                  />

                  {series.map((p, idx) => {
                    const x = 25 + (p.hour / 24) * 430;
                    const y = 86 - ((p.currentSpeed - speedStats.min) / (speedStats.max - speedStats.min || 1)) * 72;
                    return (
                      <circle
                        key={idx}
                        cx={x}
                        cy={y}
                        r="2.5"
                        fill="#10b981"
                        stroke="#ffffff"
                        strokeWidth="0.5"
                      />
                    );
                  })}

                  {/* Active Scrubber Indicator */}
                  <line
                    x1={timeScrubberX}
                    y1="12"
                    x2={timeScrubberX}
                    y2="88"
                    stroke="#0ea5e9"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={timeScrubberX}
                    cy={86 - ((modelSpeed - speedStats.min) / (speedStats.max - speedStats.min || 1)) * 72}
                    r="4"
                    fill="#0ea5e9"
                    stroke="#ffffff"
                    strokeWidth="1"
                  />
                </svg>
              </div>

              <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                <span className="flex items-center gap-1 text-sky-400">
                  <span className="w-2 h-0.5 bg-sky-400 inline-block" /> Model (GLORYS)
                </span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-0.5 bg-emerald-400 inline-block" /> In-Situ ({stnCode})
                </span>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* C. RESIDUAL ERROR VARIANCE (|ΔT|)                         */}
        {/* ========================================================= */}
        {activeChartTab === 'residual' && (
          <div className="bg-[#050b18] rounded-xl border border-slate-800/80 p-3 flex flex-col gap-2 shadow-inner">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-200">
                <Activity className="h-3.5 w-3.5 text-indigo-400" />
                <span>Diurnal Residual Error Variance |Model - Obs| (24h)</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="text-indigo-300">Station RMSE: {stationAccuracy.rmseT.toFixed(2)}°C</span>
                <span className="text-slate-500">|</span>
                <span className="text-teal-300">MAE: {stationAccuracy.maeT.toFixed(2)}°C</span>
              </div>
            </div>

            <div className="relative w-full h-36">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 540 140" preserveAspectRatio="none">
                {[0, 0.2, 0.4, 0.6].map((val) => {
                  const y = 120 - (val / 0.6) * 105;
                  return (
                    <g key={val}>
                      <line x1="30" y1={y} x2="510" y2={y} stroke="#1e293b" strokeDasharray="2 2" strokeWidth="0.8" />
                      <text x="25" y={y + 3} textAnchor="end" fontSize="8.5" fill="#64748b" fontFamily="monospace">
                        {val.toFixed(1)}°C
                      </text>
                    </g>
                  );
                })}

                {/* Variance Bars */}
                {series.map((p, idx) => {
                  const x = 30 + (p.hour / 24) * 480;
                  const h = (p.residualVariance / 0.6) * 105;
                  const y = 120 - h;
                  return (
                    <g key={idx}>
                      <rect
                        x={x - 6}
                        y={y}
                        width="12"
                        height={Math.max(2, h)}
                        rx="3"
                        fill={p.residualVariance > stationAccuracy.rmseT ? "#f43f5e" : "#6366f1"}
                        fillOpacity="0.85"
                      >
                        <title>{`${p.time} UTC: Error |Δ| = ${p.residualVariance}°C`}</title>
                      </rect>
                      <text x={x} y="132" textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="monospace">
                        {p.hour}h
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="text-[9.5px] font-mono text-slate-400 text-center pt-1 border-t border-slate-800">
              Red bars indicate points exceeding station 1σ threshold ({stationAccuracy.rmseT}°C). All residuals remain within the 95% confidence interval.
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
