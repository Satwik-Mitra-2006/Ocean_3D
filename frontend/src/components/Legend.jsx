import React from 'react';
import { COLOR_SCALES } from '../data/mockOceanData';
import { Thermometer, Droplets, Wind, Waves, MapPin, Activity, X } from 'lucide-react';

export default function Legend({ 
  primaryVariable = 'sst', 
  colorScale = 'turbo', 
  layers = { sst: true, salinity: true },
  selectedStation = null,
  onClearStation = null
}) {
  const currentScale = COLOR_SCALES.find(s => s.id === colorScale) || COLOR_SCALES[0];
  const gradientString = `linear-gradient(to right, ${currentScale.colors.join(', ')})`;

  const stationTemp = selectedStation ? (selectedStation.baseTemp ?? selectedStation.temperature ?? 28.5) : null;
  const stationSal = selectedStation ? (selectedStation.baseSalinity ?? selectedStation.salinity ?? 35.2) : null;
  const stationSpd = selectedStation ? (selectedStation.baseSpeed ?? selectedStation.current_speed ?? 0.85) : null;

  // Percentage on bars
  const tempPct = stationTemp ? Math.max(0, Math.min(100, ((stationTemp - 10) / 20) * 100)) : null;
  const salPct = stationSal ? Math.max(0, Math.min(100, ((stationSal - 30) / 8) * 100)) : null;

  return (
    <div className="absolute bottom-5 left-5 z-20 pointer-events-auto bg-slate-950/92 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 shadow-2xl flex flex-col gap-2.5 max-w-[280px] select-none text-white">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-300 font-mono">
            {selectedStation ? 'Live Station Telemetry' : 'Data Colormap Legend'}
          </span>
        </div>
        <span className="text-[9px] font-bold font-mono text-sky-300 bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-400/30">
          {currentScale.name.split(' ')[0]}
        </span>
      </div>

      {/* ACTIVE STATION HIGHLIGHT (If selected) */}
      {selectedStation && (
        <div className="bg-sky-950/70 border border-sky-400/40 rounded-xl p-2 text-xs flex flex-col gap-1 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sky-200 font-mono flex items-center gap-1">
              <MapPin className="h-3 w-3 text-emerald-400" />
              {selectedStation.code || selectedStation.name}
            </span>
            <span className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded ${
              selectedStation.status === 'Warning'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
            }`}>
              {selectedStation.status || 'Active'}
            </span>
          </div>
          <div className="text-[10px] text-slate-300 font-mono truncate">
            {selectedStation.region || selectedStation.source || 'Indian Ocean'}
          </div>
        </div>
      )}

      {/* Temperature Bar with Live Pin Marker */}
      {layers.sst && (
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-1">
            <span className="flex items-center gap-1">
              <Thermometer className="h-3 w-3 text-rose-400" />
              <span>Temperature</span>
            </span>
            <span className="text-[11px] font-mono font-bold text-rose-300">
              {stationTemp !== null ? `${stationTemp.toFixed(2)} °C` : '10°C — 30°C'}
            </span>
          </div>
          <div className="relative h-2.5 w-full rounded-full border border-white/20 shadow-inner overflow-visible" style={{ background: gradientString }}>
            {tempPct !== null && (
              <div 
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white ring-2 ring-rose-500 shadow-md transition-all duration-300"
                style={{ left: `${tempPct}%` }}
                title={`Active Reading: ${stationTemp}°C`}
              />
            )}
          </div>
          <div className="flex justify-between text-[8px] font-mono text-slate-400 mt-0.5 px-0.5">
            <span>10°C</span>
            <span>20°C</span>
            <span>30°C</span>
          </div>
        </div>
      )}

      {/* Salinity Bar with Live Pin Marker */}
      {layers.salinity && (
        <div className="pt-1 border-t border-white/10">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-1">
            <span className="flex items-center gap-1">
              <Droplets className="h-3 w-3 text-amber-400" />
              <span>Salinity</span>
            </span>
            <span className="text-[11px] font-mono font-bold text-amber-300">
              {stationSal !== null ? `${stationSal.toFixed(2)} PSU` : '30 — 38 PSU'}
            </span>
          </div>
          <div 
            className="relative h-2.5 w-full rounded-full border border-white/20 shadow-inner overflow-visible"
            style={{
              background: 'linear-gradient(to right, #042f2e, #0d9488, #2dd4bf, #99f6e4, #fef08a)'
            }}
          >
            {salPct !== null && (
              <div 
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white ring-2 ring-amber-400 shadow-md transition-all duration-300"
                style={{ left: `${salPct}%` }}
                title={`Active Salinity: ${stationSal} PSU`}
              />
            )}
          </div>
          <div className="flex justify-between text-[8px] font-mono text-slate-400 mt-0.5 px-0.5">
            <span>30 PSU</span>
            <span>34 PSU</span>
            <span>38 PSU</span>
          </div>
        </div>
      )}

      {/* Current Velocity */}
      {layers.currents && (
        <div className="pt-1 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-slate-200">
          <span className="flex items-center gap-1">
            <Wind className="h-3 w-3 text-sky-400" />
            <span>Velocity</span>
          </span>
          <span className="text-[11px] font-mono font-bold text-cyan-300">
            {stationSpd !== null ? `${stationSpd.toFixed(2)} m/s` : '0.0 — 2.5 m/s'}
          </span>
        </div>
      )}
    </div>
  );
}
