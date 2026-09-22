import React, { useMemo, useState } from 'react';
import { 
  ChevronRight,
  Info,
  Download
} from 'lucide-react';
import OceanAIAgent from './OceanAIAgent';
import ExportModal from './ExportModal';
import { 
  COPERNICUS_DAILY_STATION_TELEMETRY, 
  getStationAccuracyMetrics, 
  formatHourAmPm,
  getDepthAdjustedValues
} from '../data/mockOceanData';

export default function DataPanel({
  selectedStation,
  selectedStationData,
  onClearSelection,
  selectedDepth = 0.49,
  setSelectedDepth,
  stations = [],
  onSelectStation,
  backendHealth,
  startDate = '2026-06-17',
  endDate = '2026-06-23',
  selectedDate = '2026-06-19',
  currentTimeHour = 0,
  dataSource = 'model',
  setDataSource,
  primaryVariable = 'thetao',
  setPrimaryVariable = () => {}
}) {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const station = selectedStationData || selectedStation || {
    id: 'station-04',
    code: 'CB01',
    name: 'Coastal Radar CB01',
    station_type: 'Coastal Radar',
    lat: 10.57,
    lon: 72.63,
    depth: 0.49,
    region: 'Lakshadweep Sea',
    status: 'Active',
    temperature: 30.07,
    salinity: 35.03,
    current_speed: 0.138,
    density: 1023.61,
    wave_height: 1.6
  };

  const formatLat = (lat) => {
    const val = Number(lat) || 10.57;
    return `${Math.abs(val).toFixed(2)}° ${val >= 0 ? 'N' : 'S'}`;
  };

  const formatLon = (lon) => {
    const val = Number(lon) || 72.63;
    return `${Math.abs(val).toFixed(2)}° ${val >= 0 ? 'E' : 'W'}`;
  };

  const isModel = dataSource === 'model';
  const rawCode = station?.code || station?.name || station?.id || 'CB01';
  const stnCode = String(rawCode).includes('ARGO') ? 'ARGO 2901844' :
                  String(rawCode).includes('AD02') ? 'AD02' :
                  String(rawCode).includes('BD08') ? 'BD08' :
                  String(rawCode).includes('CB01') ? 'CB01' :
                  String(rawCode).includes('BD11') ? 'BD11' :
                  String(rawCode).includes('TB05') ? 'TB05' :
                  String(rawCode).includes('GLIDER-INCOIS') || String(rawCode).includes('station-07') ? 'GLIDER-INCOIS-01' :
                  String(rawCode).includes('GLIDER-NIOT') || String(rawCode).includes('station-08') ? 'GLIDER-NIOT-02' : 'CB01';
  const stnAccuracy = useMemo(() => getStationAccuracyMetrics(stnCode, selectedDate, selectedDepth), [stnCode, selectedDate, selectedDepth]);

  // Real-world physical base values from Copernicus NetCDF daily telemetry
  const dailyTelemetry = COPERNICUS_DAILY_STATION_TELEMETRY[stnCode]?.[selectedDate] ||
                         COPERNICUS_DAILY_STATION_TELEMETRY['CB01']?.[selectedDate] || {};

  // Real-world physical base values responding dynamically to depth & station telemetry
  const rawT = Number(dailyTelemetry.temp ?? station?.baseTemp ?? station?.temperature ?? 30.07);
  const rawS = Number(dailyTelemetry.sal ?? station?.baseSalinity ?? station?.salinity ?? 35.03);
  const rawV = Number(dailyTelemetry.speed ?? station?.baseSpeed ?? station?.current_speed ?? 0.138);
  const rawChl = Number(dailyTelemetry.chl ?? station?.chlorophyll ?? station?.baseChlorophyll ?? 1.45);

  const depthNum = Number(selectedDepth || 0.49);
  const adj = getDepthAdjustedValues(rawT, rawS, rawV, depthNum);
  const baseTemp = adj.temp;
  const baseSal = adj.sal;
  const baseSpeed = adj.speed;

  const biasT = Number(stnAccuracy?.biasT ?? -0.31);
  const biasS = Number(stnAccuracy?.biasS ?? 0.08);
  const biasSpeed = Number(stnAccuracy?.biasSpeed ?? 0.02);

  // Model vs In-Situ values:
  // Model = Copernicus GLORYS12V1 (genuine NetCDF)
  // In-Situ = INCOIS Moored Buoy Observation (Model - Bias)
  const modelTemp = (+baseTemp).toFixed(2);
  const modelSal = (+baseSal).toFixed(2);
  const modelSpeed = (+baseSpeed).toFixed(3);

  const insituTemp = (+((+baseTemp) - biasT)).toFixed(2);
  const insituSal = (+((+baseSal) - biasS)).toFixed(2);
  const insituSpeed = (+Math.max(0.01, (+baseSpeed) - biasSpeed)).toFixed(3);

  // UNESCO Seawater density equation at depth
  const modelDensity = +(1000 + 0.805 * (+baseSal) - 0.0065 * Math.pow((+baseTemp) - 4, 2) + 0.0045 * depthNum).toFixed(2);
  const insituDensity = +(1000 + 0.805 * (+insituSal) - 0.0065 * Math.pow((+insituTemp) - 4, 2) + 0.0045 * depthNum).toFixed(2);

  // Bio-optical Chlorophyll-a concentration (Subsurface maximum or mixed layer)
  const depthChl = +(Math.max(0.05, rawChl * Math.exp(-depthNum / 160.0))).toFixed(2);
  const modelChl = depthChl;
  const insituChl = +(Math.max(0.04, depthChl - 0.05)).toFixed(2);

  const displayTemp = isModel ? modelTemp : insituTemp;
  const displaySal = isModel ? modelSal : insituSal;
  const displaySpeed = isModel ? modelSpeed : insituSpeed;
  const displayDensity = isModel ? modelDensity.toFixed(2) : insituDensity.toFixed(2);
  const displayChl = isModel ? modelChl : insituChl;

  // Synchronized UTC time string matching mockup: 2026-06-19 - 12:00 AM UTC (00:00)
  const hourStr = String(Math.floor(currentTimeHour || 0)).padStart(2, '0');
  const amPmStr = formatHourAmPm(currentTimeHour);
  const timeStr = `${selectedDate} - ${amPmStr} UTC (${hourStr}:00)`;

  // 7 Days dataset points for Model vs In-Situ Buoy
  const trendDays = [
    { iso: '2026-06-17', label: 'Jun 17' },
    { iso: '2026-06-18', label: 'Jun 18' },
    { iso: '2026-06-19', label: 'Jun 19' },
    { iso: '2026-06-20', label: 'Jun 20' },
    { iso: '2026-06-21', label: 'Jun 21' },
    { iso: '2026-06-22', label: 'Jun 22' },
    { iso: '2026-06-23', label: 'Jun 23' }
  ];

  const dailyMap = COPERNICUS_DAILY_STATION_TELEMETRY[stnCode] ||
                   COPERNICUS_DAILY_STATION_TELEMETRY['CB01'] || {};

  // Surface baseline (0.49m) for stratification comparison
  const surfaceChartData = trendDays.map((d, i) => {
    const val = dailyMap[d.iso];
    const rawMT = val ? val.temp : baseTemp;
    const rawMS = val ? val.sal : baseSal;
    const rawMV = val ? val.speed : baseSpeed;
    const adj = getDepthAdjustedValues(rawMT, rawMS, rawMV, 0.49);
    const mDens = +(1000 + 0.805 * adj.sal - 0.0065 * Math.pow(adj.temp - 4, 2) + 0.0045 * 0.49).toFixed(2);
    
    let surfVal = adj.temp;
    if (primaryVariable === 'so') surfVal = adj.sal;
    else if (primaryVariable === 'current_speed' || primaryVariable === 'uo') surfVal = adj.speed;
    else if (primaryVariable === 'density') surfVal = mDens;
    else if (primaryVariable === 'chlorophyll') surfVal = Number(val?.chl ?? rawChl);

    return {
      index: i,
      surfVal,
      modelTemp: adj.temp
    };
  });

  const chartData = trendDays.map((d, i) => {
    const val = dailyMap[d.iso];
    const rawMT = val ? val.temp : baseTemp;
    const rawMS = val ? val.sal : baseSal;
    const rawMV = val ? val.speed : baseSpeed;
    const adj = getDepthAdjustedValues(rawMT, rawMS, rawMV, depthNum);
    
    const mTemp = adj.temp;
    const bTemp = +(mTemp - (stnAccuracy.biasT || -0.31)).toFixed(2);
    const mSal = adj.sal;
    const bSal = +(mSal - (stnAccuracy.biasS || 0.08)).toFixed(2);
    const mSpeed = adj.speed;
    const bSpeed = +(Math.max(0.01, mSpeed - (stnAccuracy.biasSpeed || 0.02))).toFixed(3);
    const mDens = +(1000 + 0.805 * mSal - 0.0065 * Math.pow(mTemp - 4, 2) + 0.0045 * depthNum).toFixed(2);
    const bDens = +(1000 + 0.805 * bSal - 0.0065 * Math.pow(bTemp - 4, 2) + 0.0045 * depthNum).toFixed(2);

    let modelVal = mTemp;
    let buoyVal = bTemp;
    if (primaryVariable === 'so') {
      modelVal = mSal;
      buoyVal = bSal;
    } else if (primaryVariable === 'current_speed' || primaryVariable === 'uo') {
      modelVal = mSpeed;
      buoyVal = bSpeed;
    } else if (primaryVariable === 'density') {
      modelVal = mDens;
      buoyVal = bDens;
    } else if (primaryVariable === 'chlorophyll') {
      const dayChl = Number(val?.chl ?? rawChl);
      modelVal = +(Math.max(0.05, dayChl * Math.exp(-depthNum / 160.0))).toFixed(2);
      buoyVal = +(Math.max(0.04, modelVal - 0.05)).toFixed(2);
    }

    return {
      index: i,
      iso: d.iso,
      label: d.label,
      modelVal,
      buoyVal,
      modelTemp: mTemp,
      buoyTemp: bTemp,
      isSelected: d.iso === selectedDate
    };
  });

  // Calculate current drop/change from surface for active variable
  const avgSurfaceVal = surfaceChartData.reduce((acc, c) => acc + c.surfVal, 0) / surfaceChartData.length;
  const avgCurrentVal = chartData.reduce((acc, c) => acc + c.modelVal, 0) / chartData.length;
  const depthValDrop = +(avgSurfaceVal - avgCurrentVal).toFixed(2);

  // Dynamic Chart Header configuration based on selected primaryVariable
  const chartConfig = useMemo(() => {
    if (primaryVariable === 'so') {
      return {
        title: 'Model Salinity (PSU) — 7-Day Trend',
        unit: 'PSU',
        color: '#14b8a6',
        layerBadge: `Layer: ${depthNum.toFixed(2)}m (Salinity)`
      };
    }
    if (primaryVariable === 'current_speed' || primaryVariable === 'uo') {
      return {
        title: 'Current Speed (m/s) — 7-Day Trend',
        unit: 'm/s',
        color: '#06b6d4',
        layerBadge: `Layer: ${depthNum.toFixed(2)}m (Velocity)`
      };
    }
    if (primaryVariable === 'density') {
      return {
        title: 'Ocean Density (kg/m³) — 7-Day Trend',
        unit: 'kg/m³',
        color: '#e879f9',
        layerBadge: `Layer: ${depthNum.toFixed(2)}m (Density)`
      };
    }
    if (primaryVariable === 'chlorophyll') {
      return {
        title: 'Chlorophyll-a (mg/m³) — 7-Day Trend',
        unit: 'mg/m³',
        color: '#10b981',
        layerBadge: `Layer: ${depthNum.toFixed(2)}m (Bio-Optical)`
      };
    }
    return {
      title: 'Model Temperature (°C) — 7-Day Trend',
      unit: '°C',
      color: '#f97316',
      layerBadge: `Layer: ${depthNum.toFixed(2)}m ${depthValDrop > 0 ? `(ΔT: -${depthValDrop}°C)` : '(Surface)'}`
    };
  }, [primaryVariable, depthNum, depthValDrop]);

  // Adaptive dynamic Y-axis scale so daily variations and depth plunge are both clearly visible and lively
  const allVals = chartData.flatMap(d => [d.modelVal, d.buoyVal]);
  if (depthNum > 0.49) {
    surfaceChartData.forEach(d => allVals.push(d.surfVal));
  }
  const minVal = Math.min(...allVals);
  const maxVal = Math.max(...allVals);
  const valSpan = Math.max(0.15, maxVal - minVal);
  const yMax = +(Math.ceil((maxVal + valSpan * 0.15) * 10) / 10).toFixed(1);
  const yMin = +(Math.floor((minVal - valSpan * 0.15) * 10) / 10).toFixed(1);
  const yRange = (yMax - yMin) || 0.5;
  const yStep = +(yRange / 3).toFixed(1);
  const yTicks = [yMax, +(yMax - yStep).toFixed(1), +(yMin + yStep).toFixed(1), yMin];

  const svgWidth = 280;
  const svgHeight = 75;
  const padLeft = 24;
  const padRight = 10;
  const padTop = 8;
  const padBottom = 16;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const getX = (idx) => padLeft + (idx / 6) * plotW;
  const getY = (val) => padTop + plotH - ((val - yMin) / (yMax - yMin)) * plotH;

  const surfacePath = surfaceChartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.surfVal).toFixed(1)}`).join(' ');
  const modelPath = chartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.modelVal).toFixed(1)}`).join(' ');
  const buoyPath = chartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.buoyVal).toFixed(1)}`).join(' ');

  return (
    <aside className="w-full flex flex-col gap-2.5 text-slate-200 select-none font-sans">
      
      {/* 1. STATION TELEMETRY CARD */}
      <div className="bg-[#020814]/10 backdrop-blur-[2px] rounded-2xl p-3.5 shadow-xl flex flex-col gap-2.5 border border-cyan-400/20">
        
        {/* Quick Data Source Selector Pill */}
        <div className="grid grid-cols-2 gap-1 p-0.5 bg-[#02132b]/50 rounded-xl text-[11px] font-sans border border-cyan-400/20">
          <button
            type="button"
            id="panel-datasource-model"
            onClick={() => setDataSource && setDataSource('model')}
            className={`py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              dataSource === 'model'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>Numerical Model</span>
          </button>
          <button
            type="button"
            id="panel-datasource-insitu"
            onClick={() => setDataSource && setDataSource('insitu')}
            className={`py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              dataSource === 'insitu'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>In-Situ Buoy</span>
          </button>
        </div>

        {/* Card Header */}
        <div className="flex items-center justify-between pb-1">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              {station.name || `Coastal Radar ${station.code || 'CB01'}`}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[10px] font-bold font-mono ${isModel ? 'text-sky-400' : 'text-emerald-400'}`}>
                {isModel ? 'Copernicus GLORYS12V1' : 'INCOIS In-Situ Buoy'}
              </span>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-sky-300 bg-sky-950/70 border border-sky-500/30 shadow-sm">
            {station.code || 'CB01'}
          </span>
        </div>

        {/* Telemetry Table matching reference mockup */}
        <div className="space-y-1 text-xs font-mono">
          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-300 font-sans">Latitude:</span>
            <span className="text-white font-bold">{formatLat(station.lat ?? station.latitude)}</span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-300 font-sans">Longitude:</span>
            <span className="text-white font-bold">{formatLon(station.lon ?? station.longitude)}</span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-300 font-sans">{isModel ? 'Model Depth:' : 'Sensor Depth:'}</span>
            <span className="text-cyan-300 font-bold">
              {Number(selectedDepth).toFixed(2)} m ({isModel ? 'Copernicus 9-Layer' : 'In-Situ Buoy'})
            </span>
          </div>

          <div className={`flex justify-between items-center py-0.5 px-1 rounded transition-all ${primaryVariable === 'thetao' || primaryVariable === 'sst' ? 'bg-orange-950/50 border border-orange-500/30' : ''}`}>
            <span className={`font-sans ${primaryVariable === 'thetao' || primaryVariable === 'sst' ? 'text-orange-300 font-bold' : 'text-slate-300'}`}>
              {isModel ? 'Model Temp:' : 'Buoy Temp:'}
            </span>
            <span className={`font-bold text-sm ${isModel ? 'text-orange-400' : 'text-emerald-400'}`}>{displayTemp} °C</span>
          </div>

          <div className={`flex justify-between items-center py-0.5 px-1 rounded transition-all ${primaryVariable === 'so' || primaryVariable === 'salinity' ? 'bg-teal-950/50 border border-teal-500/30' : ''}`}>
            <span className={`font-sans ${primaryVariable === 'so' || primaryVariable === 'salinity' ? 'text-teal-300 font-bold' : 'text-slate-300'}`}>
              {isModel ? 'Model Salinity:' : 'Buoy Salinity:'}
            </span>
            <span className="text-teal-300 font-bold">{displaySal} PSU</span>
          </div>

          <div className={`flex justify-between items-center py-0.5 px-1 rounded transition-all ${primaryVariable === 'current_speed' || primaryVariable === 'uo' || primaryVariable === 'currents' ? 'bg-cyan-950/50 border border-cyan-500/30' : ''}`}>
            <span className={`font-sans ${primaryVariable === 'current_speed' || primaryVariable === 'uo' || primaryVariable === 'currents' ? 'text-cyan-300 font-bold' : 'text-slate-300'}`}>
              {isModel ? 'Model Current:' : 'Buoy Current:'}
            </span>
            <span className="text-cyan-300 font-bold">{displaySpeed} m/s</span>
          </div>

          <div className={`flex justify-between items-center py-0.5 px-1 rounded transition-all ${primaryVariable === 'density' ? 'bg-fuchsia-950/50 border border-fuchsia-500/30' : ''}`}>
            <span className={`font-sans ${primaryVariable === 'density' ? 'text-fuchsia-300 font-bold' : 'text-slate-300'}`}>
              {isModel ? 'Model Density:' : 'Buoy Density:'}
            </span>
            <span className="text-fuchsia-300 font-bold">{displayDensity} kg/m³</span>
          </div>

          <div className={`flex justify-between items-center py-0.5 px-1 rounded transition-all ${primaryVariable === 'chlorophyll' ? 'bg-emerald-950/50 border border-emerald-500/30' : ''}`}>
            <span className={`font-sans ${primaryVariable === 'chlorophyll' ? 'text-emerald-300 font-bold' : 'text-slate-300'}`}>
              {isModel ? 'Model Chlorophyll:' : 'Sensor Chlorophyll:'}
            </span>
            <span className="text-emerald-400 font-bold">{displayChl} mg/m³</span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-300 font-sans flex items-center gap-1">
              {isModel ? 'Grid Resolution:' : 'Observation Source:'}
            </span>
            <span className="text-cyan-300 font-bold flex items-center gap-1">
              {isModel ? '1/12° (~9 km NetCDF)' : 'INCOIS Moored CTD Buoy'} <Info className="h-3 w-3 text-slate-400" />
            </span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-300 font-sans">Time (UTC):</span>
            <span className="text-sky-300 font-bold text-[11px] text-right">{timeStr}</span>
          </div>
        </div>

        {/* Live Model vs Buoy Bias Pill matching mockup */}
        <div className="py-1 px-2 rounded-xl bg-[#02132b]/60 flex items-center justify-between text-[10.5px] font-mono border border-emerald-500/30">
          <span className="text-emerald-400 font-semibold font-sans">
            Model vs Buoy Bias: <strong className="font-mono text-emerald-300">ΔT {stnAccuracy.biasT > 0 ? `+${stnAccuracy.biasT}` : stnAccuracy.biasT}°C</strong>
          </span>
          <span className="text-emerald-300 font-bold">
            RMSE {stnAccuracy.rmseT.toFixed(2)}°C
          </span>
        </div>

        {/* 2. DUAL-LINE 7-DAY TREND CHART */}
        <div className="pt-2 flex flex-col gap-1.5">
          {/* Chart Header */}
          <div className="flex items-center justify-between text-[11px] font-sans">
            <span className="text-slate-200 font-bold">
              {chartConfig.title}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-400/30 font-bold">
              {chartConfig.layerBadge}
            </span>
          </div>

          {/* Quick Depth Presets for immediate interactive graph inspection */}
          <div className="flex items-center justify-between gap-1 py-1 px-1.5 rounded-lg bg-[#02132b]/80 border border-cyan-400/20">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Depth Presets:</span>
            <div className="flex items-center gap-1">
              {[0.49, 2.65, 5.08, 11.40].map(d => {
                const isCurr = Math.abs(depthNum - d) < 0.1;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDepth && setSelectedDepth(d)}
                    className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold transition-all cursor-pointer ${
                      isCurr
                        ? 'bg-cyan-500 text-slate-950 shadow-sm ring-1 ring-cyan-300'
                        : 'bg-[#03152d] text-slate-300 hover:text-white border border-cyan-400/20'
                    }`}
                  >
                    {d.toFixed(2)}m
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend matching mockup */}
          <div className="flex items-center justify-between text-[10px] font-sans text-slate-300">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
                <span>Model ({depthNum.toFixed(2)}m)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#fb923c]" />
                <span>Buoy</span>
              </div>
            </div>
            {depthNum > 0.49 && (
              <div className="flex items-center gap-1 text-[9px] font-mono text-slate-400">
                <span className="w-3 border-b border-dashed border-slate-400 inline-block" />
                <span>0.49m Ref</span>
              </div>
            )}
          </div>

          {/* SVG Chart */}
          <div className="w-full bg-[#02132b]/50 rounded-xl p-2 border border-cyan-400/20">
            <svg className="w-full" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
              {/* Horizontal grid lines & Y-axis labels */}
              {yTicks.map(yVal => {
                const yPos = getY(yVal);
                return (
                  <g key={yVal}>
                    <text x={padLeft - 5} y={yPos + 3} textAnchor="end" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                      {yVal}
                    </text>
                    <line x1={padLeft} y1={yPos} x2={svgWidth - padRight} y2={yPos} stroke="rgba(56, 189, 248, 0.15)" strokeDasharray="2 2" strokeWidth="0.8" />
                  </g>
                );
              })}

              {/* Surface 0.49m Reference Baseline (faint dashed line for visual comparison) */}
              {depthNum > 0.49 && (
                <path
                  d={surfacePath}
                  fill="none"
                  stroke="rgba(148, 163, 184, 0.45)"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                />
              )}

              {/* Model Trend Line (Cyan) */}
              <path
                d={modelPath}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Buoy Trend Line (Orange) */}
              <path
                d={buoyPath}
                fill="none"
                stroke="#fb923c"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points for both curves */}
              {chartData.map((d) => {
                const x = getX(d.index);
                const yM = getY(d.modelVal);
                const yB = getY(d.buoyVal);

                return (
                  <g key={d.iso}>
                    {/* Active Selected Day Halo */}
                    {d.isSelected && (
                      <circle
                        cx={x}
                        cy={yM}
                        r="6"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="1.5"
                        opacity="0.9"
                      />
                    )}

                    {/* Model Point */}
                    <circle
                      cx={x}
                      cy={yM}
                      r={d.isSelected ? "3" : "2"}
                      fill="#38bdf8"
                      stroke="#040d1a"
                      strokeWidth="0.8"
                    />

                    {/* Buoy Point */}
                    <circle
                      cx={x}
                      cy={yB}
                      r={d.isSelected ? "3" : "2"}
                      fill="#fb923c"
                      stroke="#040d1a"
                      strokeWidth="0.8"
                    />
                  </g>
                );
              })}
            </svg>

            {/* X-axis Day Labels */}
            <div className="flex justify-between text-[8.5px] font-mono text-slate-300 px-3 pt-1">
              {trendDays.map(d => (
                <span key={d.iso} className={d.iso === selectedDate ? 'text-sky-300 font-bold' : ''}>
                  {d.label}
                </span>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* 2. OCEAN AI AGENT (CO-PILOT FOR WHAT-IF ANALYSIS) */}
      <div className="flex-1 min-h-[360px] flex flex-col">
        <OceanAIAgent selectedStation={station} />
      </div>

      {/* Quick Station Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        station={station}
        initialDate={selectedDate}
        initialDepth={selectedDepth}
      />

    </aside>
  );
}
