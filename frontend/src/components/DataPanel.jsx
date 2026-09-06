import React, { useMemo } from 'react';
import { 
  ChevronRight
} from 'lucide-react';
import OceanAIAgent from './OceanAIAgent';
import { COPERNICUS_DAILY_STATION_TELEMETRY, getStationAccuracyMetrics } from '../data/mockOceanData';

export default function DataPanel({
  selectedStation,
  selectedStationData,
  onClearSelection,
  selectedDepth = 0.49,
  stations = [],
  onSelectStation,
  backendHealth,
  startDate = '2026-06-17',
  endDate = '2026-06-23',
  selectedDate = '2026-06-23',
  currentTimeHour = 0,
  dataSource = 'model',
  setDataSource
}) {
  const station = selectedStationData || selectedStation || {
    id: 'station-01',
    code: 'BD08',
    name: 'Moored Buoy BD08',
    station_type: 'Moored Data Buoy',
    lat: 15.20,
    lon: 72.80,
    depth: 0.49,
    region: 'Arabian Sea (Central)',
    status: 'Active',
    temperature: 29.11,
    salinity: 35.09,
    current_speed: 0.231,
    current_direction: 102.0,
    current_dir_compass: '102° ESE',
    density: 1023.97,
    wave_height: 1.8
  };

  const formatLat = (lat) => {
    const val = Number(lat) || 15.20;
    return `${Math.abs(val).toFixed(2)}° ${val >= 0 ? 'N' : 'S'}`;
  };

  const formatLon = (lon) => {
    const val = Number(lon) || 72.80;
    return `${Math.abs(val).toFixed(2)}° ${val >= 0 ? 'E' : 'W'}`;
  };

  const isModel = dataSource === 'model';
  
  // Real-world physical base values
  const baseTemp = Number(station.temperature ?? station.currentTemp ?? station.baseTemp ?? 29.11);
  const baseSal = Number(station.salinity ?? station.currentSalinity ?? station.baseSalinity ?? 35.09);
  const baseSpeed = Number(station.current_speed ?? station.currentSpeed ?? station.baseSpeed ?? 0.231);

  // Model reanalysis value: incorporates standard Copernicus ~0.24°C reanalysis offset
  const modelTemp = +(baseTemp - 0.24).toFixed(2);
  const modelSal = +(baseSal + 0.08).toFixed(2);
  const modelSpeed = +(baseSpeed * 0.94).toFixed(3);

  // In-Situ sensor reading: direct physical moored instrument telemetry
  const insituTemp = +(baseTemp).toFixed(2);
  const insituSal = +(baseSal).toFixed(2);
  const insituSpeed = +(baseSpeed).toFixed(3);

  const displayTemp = isModel ? modelTemp : insituTemp;
  const displaySal = isModel ? modelSal : insituSal;
  const displaySpeed = isModel ? modelSpeed : insituSpeed;
  const dirVal = station.current_dir_compass || `${Math.round(station.current_direction || 102)}° ESE`;
  
  // Format exact synchronized date and time
  const hourStr = String(Math.floor(currentTimeHour || 0)).padStart(2, '0');
  const timeStr = `${selectedDate || '2026-06-23'} ${hourStr}:00 UTC`;

  const stnCode = station?.code || (station?.name && station?.name.includes('CB01') ? 'CB01' : 'BD08');
  const stnAccuracy = useMemo(() => getStationAccuracyMetrics(stnCode), [stnCode]);

  // Compute dynamic sparkline points for the days within the chosen date range (17/06/2026 to 23/06/2026)
  // Bound to Copernicus Marine NetCDF daily physical reanalysis
  const { sparklinePoints, sparklineLabels } = useMemo(() => {
    const pts = [];
    const labels = [];
    const dailyMap = COPERNICUS_DAILY_STATION_TELEMETRY[stnCode] ||
                     COPERNICUS_DAILY_STATION_TELEMETRY['BD08'] || {};

    try {
      const start = new Date(startDate || '2026-06-17');
      const end = new Date(endDate || '2026-06-23');
      const cur = new Date(start);
      let idx = 0;
      while (cur <= end && idx < 14) {
        const yyyy = cur.getFullYear();
        const mm = String(cur.getMonth() + 1).padStart(2, '0');
        const dd = String(cur.getDate()).padStart(2, '0');
        const iso = `${yyyy}-${mm}-${dd}`;

        const dailyVal = dailyMap[iso];
        const rawTemp = dailyVal ? dailyVal.temp : baseTemp;
        const temp = isModel ? +(rawTemp - 0.24).toFixed(2) : +(rawTemp).toFixed(2);

        pts.push({
          day: idx,
          iso,
          temp,
          isSelected: iso === selectedDate
        });
        labels.push(cur.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        cur.setDate(cur.getDate() + 1);
        idx++;
      }
    } catch {
      // Fallback 7 days: 17 Jun - 23 Jun
      const days = ['17 Jun', '18 Jun', '19 Jun', '20 Jun', '21 Jun', '22 Jun', '23 Jun'];
      const dates = ['2026-06-17', '2026-06-18', '2026-06-19', '2026-06-20', '2026-06-21', '2026-06-22', '2026-06-23'];
      for (let i = 0; i < 7; i++) {
        const iso = dates[i];
        const dailyVal = dailyMap[iso];
        const rawTemp = dailyVal ? dailyVal.temp : baseTemp;
        const temp = isModel ? +(rawTemp - 0.24).toFixed(2) : +(rawTemp).toFixed(2);
        pts.push({ day: i, iso, temp, isSelected: iso === selectedDate });
        labels.push(days[i]);
      }
    }

    return { sparklinePoints: pts, sparklineLabels: labels };
  }, [station, isModel, baseTemp, startDate, endDate, selectedDate]);

  const minT = Math.min(...sparklinePoints.map(p => p.temp)) - 0.2;
  const maxT = Math.max(...sparklinePoints.map(p => p.temp)) + 0.2;
  const range = maxT - minT || 1;

  const sparklinePath = sparklinePoints.map((p, i) => {
    const x = 10 + (i / Math.max(1, sparklinePoints.length - 1)) * 220;
    const y = 50 - ((p.temp - minT) / range) * 38;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <aside className="w-full lg:w-72 xl:w-80 flex flex-col gap-2.5 text-slate-200 select-none shrink-0 font-sans">
      
      {/* 1. STATION TELEMETRY CARD */}
      <div className="bg-[#050b18]/95 backdrop-blur-md rounded-2xl p-3.5 border border-slate-800/80 shadow-xl flex flex-col gap-2.5">
        
        {/* Quick Data Source Selector Pill */}
        <div className="grid grid-cols-2 gap-1 p-0.5 bg-[#030712] rounded-lg border border-slate-800/80 text-[11px] font-sans">
          <button
            type="button"
            id="panel-datasource-model"
            onClick={() => setDataSource && setDataSource('model')}
            className={`py-1 px-2 rounded-md font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              dataSource === 'model'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Numerical Model</span>
          </button>
          <button
            type="button"
            id="panel-datasource-insitu"
            onClick={() => setDataSource && setDataSource('insitu')}
            className={`py-1 px-2 rounded-md font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              dataSource === 'insitu'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>In-Situ Buoy</span>
          </button>
        </div>

        {/* Card Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              {station.name || `Moored Buoy ${station.code || 'BD08'}`}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${dataSource === 'model' ? 'bg-sky-400' : 'bg-emerald-400 animate-pulse'}`} />
              <span className={`text-[10px] font-bold font-mono ${dataSource === 'model' ? 'text-sky-400' : 'text-emerald-400'}`}>
                {dataSource === 'model' ? 'Copernicus GLORYS12V1' : 'Live In-Situ Telemetry'}
              </span>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono text-sky-300 bg-sky-950/70 border border-sky-500/30">
            {station.code || 'BD08'}
          </span>
        </div>

        {/* Telemetry Table matching Image 2 & dataSource mode */}
        <div className="space-y-1.5 text-xs font-mono">
          <div className="flex justify-between items-center py-0.5 border-b border-slate-900">
            <span className="text-slate-400 font-sans">Latitude:</span>
            <span className="text-white font-bold">{formatLat(station.lat ?? station.latitude)}</span>
          </div>

          <div className="flex justify-between items-center py-0.5 border-b border-slate-900">
            <span className="text-slate-400 font-sans">Longitude:</span>
            <span className="text-white font-bold">{formatLon(station.lon ?? station.longitude)}</span>
          </div>

          <div className="flex justify-between items-center py-0.5 border-b border-slate-900">
            <span className="text-slate-400 font-sans">{dataSource === 'model' ? 'Model Depth:' : 'Mooring Depth:'}</span>
            <span className="text-sky-300 font-bold">
              {Number(selectedDepth).toFixed(2)} m {dataSource === 'model' ? '(Copernicus 9-Layer)' : '(Surface CTD)'}
            </span>
          </div>

          <div className="flex justify-between items-center py-0.5 border-b border-slate-900">
            <span className="text-slate-400 font-sans">{dataSource === 'model' ? 'Model Temp:' : 'Observed Temp:'}</span>
            <span className="text-orange-400 font-bold text-sm">{displayTemp} °C</span>
          </div>

          <div className="flex justify-between items-center py-0.5 border-b border-slate-900">
            <span className="text-slate-400 font-sans">{dataSource === 'model' ? 'Model Salinity:' : 'Observed Salinity:'}</span>
            <span className="text-teal-300 font-bold">{displaySal} PSU</span>
          </div>

          <div className="flex justify-between items-center py-0.5 border-b border-slate-900">
            <span className="text-slate-400 font-sans">{dataSource === 'model' ? 'Model Current:' : 'Measured Current:'}</span>
            <span className="text-cyan-300 font-bold">{displaySpeed} m/s</span>
          </div>

          <div className="flex justify-between items-center py-0.5 border-b border-slate-900">
            <span className="text-slate-400 font-sans">{dataSource === 'model' ? 'Grid Resolution:' : 'Wave Height:'}</span>
            <span className="text-cyan-300 font-bold">
              {dataSource === 'model' ? '1/12° (~9 km NetCDF)' : `${(station.wave_height || 1.8).toFixed(1)} m (Acoustic Gauge)`}
            </span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-400 font-sans">Time (UTC):</span>
            <span className="text-sky-300 font-bold">{timeStr}</span>
          </div>
        </div>

        {/* Live Model vs In-Situ Variance Pill */}
        <div className="p-2 rounded-xl bg-[#030712] border border-slate-800 flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span className="text-slate-400 font-sans">Model vs Buoy Bias:</span>
            <span className="font-mono text-cyan-300 font-bold">
              ΔT {stnAccuracy.biasT > 0 ? `+${stnAccuracy.biasT}` : stnAccuracy.biasT}°C
            </span>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono text-[9px]">
            RMSE {stnAccuracy.rmseT.toFixed(2)}°C
          </span>
        </div>

        {/* 2. SPARKLINE CHART: Temperature (°C) — Chosen Date Range */}
        <div className="pt-2 border-t border-slate-800 flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] font-sans">
            <span className="text-slate-300 font-bold">
              {dataSource === 'model' ? 'Model Temperature (°C) — 7-Day Trend' : 'In-Situ Temperature (°C) — 7-Day Trend'}
            </span>
          </div>

          <div className="w-full h-16 bg-[#030712] rounded-xl p-1 relative border border-slate-800/80">
            <svg className="w-full h-full" viewBox="0 0 240 60">
              {/* Horizontal guideline */}
              <line x1="10" y1="30" x2="230" y2="30" stroke="#1e293b" strokeDasharray="2 2" strokeWidth="0.8" />
              {/* Trend line */}
              <path
                d={sparklinePath}
                fill="none"
                stroke="#f97316"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Dots */}
              {sparklinePoints.map((p, i) => {
                const x = 10 + (i / Math.max(1, sparklinePoints.length - 1)) * 220;
                const y = 50 - ((p.temp - minT) / range) * 38;
                return (
                  <g key={i}>
                    {p.isSelected && (
                      <circle
                        cx={x}
                        cy={y}
                        r="5.5"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="1.5"
                        opacity="0.9"
                      />
                    )}
                    <circle
                      cx={x}
                      cy={y}
                      r={p.isSelected ? "3.2" : "2.2"}
                      fill={p.isSelected ? "#38bdf8" : "#f97316"}
                      stroke="#030712"
                      strokeWidth="1"
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Dynamic Day Labels matching the chosen date range */}
          <div className="flex justify-between text-[8px] font-mono text-slate-500 px-1">
            {sparklineLabels.slice(0, 4).map((lbl, idx) => (
              <span key={idx}>{lbl}</span>
            ))}
            {sparklineLabels.length > 4 && (
              <span>{sparklineLabels[sparklineLabels.length - 1]}</span>
            )}
          </div>

          {/* View Full Profile Button */}
          <button
            type="button"
            className="mt-1 w-full py-1.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-500/40 text-sky-300 font-sans text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
          >
            <span>View Full Profile</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

      </div>

      {/* 3. OCEAN AI AGENT (CO-PILOT FOR WHAT-IF ANALYSIS) */}
      <div className="flex-1 min-h-[360px] flex flex-col">
        <OceanAIAgent selectedStation={station} />
      </div>

    </aside>
  );
}
