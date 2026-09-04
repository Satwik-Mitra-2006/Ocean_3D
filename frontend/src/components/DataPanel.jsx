import React, { useState } from 'react';
import { 
  Radio, 
  MapPin, 
  Thermometer, 
  Droplets, 
  Wind, 
  Waves, 
  Clock, 
  Database, 
  Cpu, 
  Battery, 
  ExternalLink,
  X,
  Compass,
  AlertCircle,
  CheckCircle2,
  BrainCircuit,
  Sparkles,
  Info
} from 'lucide-react';
import { generateOceanExplanation } from './OceanAIExplainer';

export default function DataPanel({
  selectedStation,
  selectedStationData,
  onClearSelection,
  allStations = [],
  onSelectStation,
  backendHealth
}) {
  const [panelTab, setPanelTab] = useState('telemetry'); // 'telemetry' | 'ai-insights'

  const statusStyles = {
    Active: {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500'
    },
    Warning: {
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500'
    },
    Offline: {
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500'
    }
  };

  const station = selectedStationData || selectedStation;
  const aiExplanation = station ? generateOceanExplanation(station) : null;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col h-full">
      {station ? (
        <div className="flex flex-col h-full">
          {/* Header with Clear "Selected Station" designation */}
          <div className="flex items-start justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/60 font-mono">
                  Selected Station
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 ${
                  statusStyles[station.status]?.badge || 'bg-slate-100 text-slate-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusStyles[station.status]?.dot || 'bg-slate-400'}`} />
                  {station.status || 'Active'}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mt-1 leading-snug">
                {station.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                <MapPin className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                <span>{station.region || 'Indian Ocean'}</span>
              </p>
            </div>

            {onClearSelection && (
              <button
                type="button"
                onClick={onClearSelection}
                title="Deselect station"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Tab Switcher: Sensors Telemetry vs Explainable AI Diagnosis */}
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl mt-3 border border-slate-200/80">
            <button
              type="button"
              onClick={() => setPanelTab('telemetry')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                panelTab === 'telemetry'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cpu className="h-3.5 w-3.5 text-sky-600" />
              <span>Sensors</span>
            </button>
            <button
              type="button"
              onClick={() => setPanelTab('ai-insights')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                panelTab === 'ai-insights'
                  ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-xs font-bold'
                  : 'text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50/50'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI Diagnosis</span>
            </button>
          </div>

          {panelTab === 'telemetry' ? (
            <>
              {/* Coordinates & Depth Pills */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="bg-slate-50 rounded-xl p-2 border border-slate-200/70 text-center">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block font-mono">
                    Latitude
                  </span>
                  <span className="text-xs font-bold text-slate-800 font-mono">
                    {(station.lat ?? station.latitude ?? 15.0).toFixed(2)}° N
                  </span>
                </div>

                <div className="bg-slate-50 rounded-xl p-2 border border-slate-200/70 text-center">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block font-mono">
                    Longitude
                  </span>
                  <span className="text-xs font-bold text-slate-800 font-mono">
                    {(station.lon ?? station.longitude ?? 72.0).toFixed(2)}° E
                  </span>
                </div>

                <div className="bg-slate-50 rounded-xl p-2 border border-slate-200/70 text-center">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block font-mono">
                    Depth
                  </span>
                  <span className="text-xs font-bold text-sky-700 font-mono">
                    {station.depth || 0.5} m
                  </span>
                </div>
              </div>

              {/* Primary 4 Physical Measurements Grid */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                {/* Temperature */}
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-200/70">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                    <Thermometer className="h-3.5 w-3.5 text-amber-600" />
                    Sea Temperature
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-extrabold text-slate-900 font-mono">
                      {station.currentTemp ?? station.baseTemp ?? station.temperature ?? 28.2}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">°C</span>
                  </div>
                </div>

                {/* Salinity */}
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500/10 to-teal-500/5 border border-teal-200/70">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-900">
                    <Droplets className="h-3.5 w-3.5 text-teal-600" />
                    Salinity
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-extrabold text-slate-900 font-mono">
                      {station.currentSalinity ?? station.baseSalinity ?? station.salinity ?? 35.1}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">PSU</span>
                  </div>
                </div>

                {/* Current Speed */}
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-500/10 to-sky-500/5 border border-sky-200/70">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-900">
                    <Wind className="h-3.5 w-3.5 text-sky-600" />
                    Current Velocity
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-extrabold text-slate-900 font-mono">
                      {station.currentSpeed ?? station.baseSpeed ?? station.current_speed ?? 0.45}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">m/s</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                    Heading: {station.direction || '142° SE'}
                  </div>
                </div>

                {/* Wave Height */}
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-200/70">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-900">
                    <Waves className="h-3.5 w-3.5 text-cyan-600" />
                    Wave Height
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-extrabold text-slate-900 font-mono">
                      {station.currentWave ?? station.baseWave ?? 1.8}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">m</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                    Period: 8.2s Swell
                  </div>
                </div>
              </div>

              {/* Station Metadata Section */}
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5 shrink-0">
                    <Cpu className="h-3.5 w-3.5 text-slate-400" />
                    Station Type
                  </span>
                  <span className="font-semibold text-slate-800 text-right truncate">
                    {station.type || 'Moored Oceanographic Buoy'}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5 shrink-0">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    Timestamp
                  </span>
                  <span className="font-mono text-slate-800 font-medium text-right text-[11px]">
                    {station.timestamp || '2026-09-03 12:00 UTC'}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5 shrink-0">
                    <Database className="h-3.5 w-3.5 text-slate-400" />
                    Data Source
                  </span>
                  <span className="font-medium text-slate-700 text-right truncate max-w-[170px]" title={station.source}>
                    {station.source || 'Copernicus Marine & INCOIS / MoES'}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5 shrink-0">
                    <Battery className="h-3.5 w-3.5 text-slate-400" />
                    System Health
                  </span>
                  <span className="font-mono text-emerald-700 font-semibold text-right">
                    {station.health || 'Operational (98.4%)'}
                  </span>
                </div>
              </div>
            </>
          ) : (
            /* AI Insights Mode */
            <div className="mt-3 space-y-2.5">
              {/* Cyclone / Heat Content Assessment */}
              <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/80">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-950 mb-1">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                    Cyclone & Heat Potential
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    aiExplanation?.cycloneRisk.includes('High')
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {aiExplanation?.cycloneRisk}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-snug">
                  {aiExplanation?.cycloneText}
                </p>
              </div>

              {/* Salinity & River Runoff */}
              <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200/80">
                <div className="flex items-center justify-between text-xs font-bold text-teal-950 mb-1">
                  <span>Water Mass & Salinity</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-bold">
                    {aiExplanation?.salinityState.split(' ')[0]}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-snug">
                  {aiExplanation?.salinityText}
                </p>
              </div>

              {/* Maritime & Fishermen Advisory */}
              <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200/80">
                <div className="flex items-center justify-between text-xs font-bold text-sky-950 mb-1">
                  <span>Maritime Safety Advisory</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                    {aiExplanation?.safetyBadge.split(' ')[0]}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-snug">
                  {aiExplanation?.safetyStatus}
                </p>
              </div>
            </div>
          )}

          {/* Quick Switch Other Stations */}
          <div className="mt-auto pt-3 border-t border-slate-100">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between font-mono">
              <span>Switch Station</span>
              <span className="text-[9px] text-slate-400 font-normal">1-Click</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allStations.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelectStation(s)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-mono font-medium border transition-all cursor-pointer ${
                    s.id === station.id
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {s.code || s.name.split('—')[1] || s.name.substring(0, 4)}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center text-center h-full py-6 px-2">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600 mb-3 shadow-inner">
            <Radio className="h-6 w-6 stroke-[1.8] animate-pulse" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">
            Observation Station Details
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-[230px] leading-relaxed">
            Click any observation marker on the 3D globe or pick a station below to view real-time physical telemetry.
          </p>

          <div className="mt-4 w-full bg-slate-50/80 rounded-xl p-3 border border-slate-200/60 text-left text-[11px] text-slate-600 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              <span><strong>Large Markers:</strong> In-Situ Ocean Buoys</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shrink-0" />
              <span><strong>Small Dots:</strong> Copernicus NetCDF Grid</span>
            </div>
          </div>

          <div className="mt-4 w-full pt-3 border-t border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 font-mono text-left">
              Available Buoys & Floats
            </span>
            <div className="space-y-1.5 text-left max-h-52 overflow-y-auto pr-1">
              {allStations.map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => onSelectStation(st)}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-200/70 hover:border-sky-300 hover:bg-sky-50/60 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${statusStyles[st.status]?.dot || 'bg-slate-400'}`} />
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-sky-700 truncate">
                      {st.name.split('—')[0].trim()}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    {st.baseTemp ?? st.temperature ?? 28}°C
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
