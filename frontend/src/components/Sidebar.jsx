import React, { useMemo } from 'react';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Waves,
  Gauge,
  Calendar,
  ChevronDown,
  Radio,
  Clock,
  Play,
  Pause,
  Sun,
  Moon,
  RotateCw
} from 'lucide-react';
import { formatHourAmPm } from '../data/mockOceanData';

export default function Sidebar({
  layers = {},
  setLayers,
  selectedDepth = 0.49,
  setSelectedDepth,
  primaryVariable = 'thetao',
  setPrimaryVariable,
  currentTimeHour = 0,
  setCurrentTimeHour,
  isPlaying = false,
  setIsPlaying,
  availableDepths = [0.49, 1.54, 2.65, 3.82, 5.08, 6.44, 7.93, 9.57, 11.40],
  opacity = 0.85,
  setOpacity,
  stations = [],
  selectedStation,
  onSelectStation,
  startDate = '2026-06-17',
  endDate = '2026-06-23',
  selectedDate = '2026-06-19',
  setStartDate,
  setEndDate,
  setSelectedDate,
  dataSource = 'model',
  setDataSource,
  showAdvanced = false
}) {
  const depths = availableDepths && availableDepths.length > 0
    ? availableDepths
    : [0.49, 1.54, 2.65, 3.82, 5.08, 6.44, 7.93, 9.57, 11.40];

  const minDepth = Math.min(...depths);
  const maxDepth = Math.max(...depths);

  // Quick Station buttons matching reference mockup: 2 rows of 3
  const quickStationCodes = ['AD02', 'BD08', 'ARGO 2901844', 'CB01', 'BD11', 'TB05'];

  // 7 observation days matching Copernicus NetCDF dataset
  const daysList = [
    { iso: '2026-06-17', label: 'Jun 17' },
    { iso: '2026-06-18', label: 'Jun 18' },
    { iso: '2026-06-19', label: 'Jun 19' },
    { iso: '2026-06-20', label: 'Jun 20' },
    { iso: '2026-06-21', label: 'Jun 21' },
    { iso: '2026-06-22', label: 'Jun 22' },
    { iso: '2026-06-23', label: 'Jun 23' }
  ];

  return (
    <aside className="w-full flex flex-col gap-2.5 text-slate-200 select-none font-sans">
      
      {/* 1. BRAND HEADER */}
      <div className="bg-[#020814]/10 backdrop-blur-[2px] rounded-2xl p-3 shadow-xl flex items-center justify-between border border-cyan-400/20">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold text-white tracking-tight">Ocean3D</h1>
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 font-mono uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          </div>
          <p className="text-[10.5px] text-slate-300 font-sans">Interactive Ocean Visualization</p>
        </div>

        <span className="px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-bold text-sky-300 bg-sky-950/70 border border-sky-500/30 shadow-sm">
          Data Bound
        </span>
      </div>

      {/* 2. SELECT STATION (SECTION 1) */}
      <div className="bg-[#020814]/10 backdrop-blur-[2px] rounded-2xl p-3.5 shadow-xl flex flex-col gap-2.5 border border-cyan-400/20">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-extrabold text-sky-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px] font-bold">1</span>
            SELECT STATION:
          </label>
        </div>

        {/* Station Select Dropdown */}
        <div className="relative">
          <select
            value={selectedStation?.code || selectedStation?.id || 'CB01'}
            onChange={(e) => {
              const found = stations.find(s => s.code === e.target.value || s.id === e.target.value);
              if (found && onSelectStation) onSelectStation(found);
            }}
            className="w-full bg-[#02132b]/50 border border-cyan-400/20 rounded-xl px-3 py-2 text-xs text-white appearance-none focus:outline-none focus:border-sky-400 cursor-pointer font-sans"
          >
            {stations.map(st => (
              <option key={st.id} value={st.code || st.id} className="bg-slate-900 text-white">
                {st.name || st.code} ({st.region || 'Indian Ocean'})
              </option>
            ))}
          </select>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
        </div>

        {/* Quick Station Filter Buttons (2 Rows of 3 matching mockup) */}
        <div className="grid grid-cols-3 gap-1.5 pt-0.5">
          {quickStationCodes.map(code => {
            const isSel = selectedStation?.code === code || (code === 'ARGO 2901844' && selectedStation?.code?.includes('ARGO'));
            const stnObj = stations.find(s => s.code === code || (code === 'ARGO 2901844' && s.code?.includes('ARGO')));

            return (
              <button
                key={code}
                type="button"
                onClick={() => {
                  if (stnObj && onSelectStation) onSelectStation(stnObj);
                }}
                className={`px-1.5 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all truncate cursor-pointer ${
                  isSel
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/40 ring-1 ring-blue-300'
                    : 'bg-[#02132b]/50 hover:bg-slate-800/80 text-slate-200 border border-cyan-400/20'
                }`}
                title={code}
              >
                {code}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. DATE RANGE (COPERNICUS NETCDF) (SECTION 2) */}
      <div className="bg-[#020814]/10 backdrop-blur-[2px] rounded-2xl p-3.5 shadow-xl flex flex-col gap-2.5 border border-cyan-400/20">
        <label className="text-[11px] font-extrabold text-sky-400 uppercase tracking-wider flex items-center justify-between font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px] font-bold">2</span>
            DATE RANGE (COPERNICUS NETCDF):
          </span>
          <RotateCw className="h-3 w-3 text-sky-400/80" />
        </label>

        {/* Date Range Inputs */}
        <div className="flex items-center gap-2 bg-[#02132b]/50 p-2 rounded-xl border border-cyan-400/20 text-xs font-mono text-slate-200">
          <Calendar className="h-3.5 w-3.5 text-sky-400 shrink-0" />
          <input
            type="date"
            min="2026-06-17"
            max="2026-06-23"
            value={startDate}
            onChange={(e) => setStartDate && setStartDate(e.target.value)}
            className="bg-transparent text-white focus:outline-none w-full cursor-pointer text-xs"
          />
          <span className="text-slate-500 font-bold">→</span>
          <input
            type="date"
            min="2026-06-17"
            max="2026-06-23"
            value={endDate}
            onChange={(e) => setEndDate && setEndDate(e.target.value)}
            className="bg-transparent text-white focus:outline-none w-full cursor-pointer text-xs"
          />
        </div>

        {/* Quick Select Buttons Strictly Within the 7 Days */}
        <div className="pt-0.5">
          <div className="text-[10px] font-mono text-slate-400 mb-1.5 flex items-center justify-between">
            <span>Select Active Day:</span>
            <span className="text-sky-300 font-bold">{selectedDate}</span>
          </div>
          
          {/* Row 1: Jun 17 - Jun 21 (5 days) */}
          <div className="grid grid-cols-5 gap-1 mb-1">
            {daysList.slice(0, 5).map(d => {
              const isSelected = selectedDate === d.iso;
              return (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => setSelectedDate && setSelectedDate(d.iso)}
                  className={`py-1 px-1 rounded-lg text-[10px] font-mono font-bold transition-all text-center cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/40 ring-1 ring-blue-300'
                      : 'bg-[#02132b]/50 hover:bg-slate-800/80 text-slate-200 border border-cyan-400/20'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>

          {/* Row 2: Jun 22, Jun 23 (2 days) */}
          <div className="grid grid-cols-5 gap-1">
            {daysList.slice(5).map(d => {
              const isSelected = selectedDate === d.iso;
              return (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => setSelectedDate && setSelectedDate(d.iso)}
                  className={`py-1 px-1 rounded-lg text-[10px] font-mono font-bold transition-all text-center cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/40 ring-1 ring-blue-300'
                      : 'bg-[#02132b]/50 hover:bg-slate-800/80 text-slate-200 border border-cyan-400/20'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* 4. VARIABLES (SECTION 3) - 4 BUTTONS MATCHING MOCKUP */}
      <div className="bg-[#020814]/10 backdrop-blur-[2px] rounded-2xl p-3.5 shadow-xl flex flex-col gap-2.5 border border-cyan-400/20">
        <label className="text-[11px] font-extrabold text-sky-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
          <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px] font-bold">3</span>
          VARIABLES:
        </label>

        {/* 4 Variable Toggles: Temperature, Salinity, Current, Density */}
        <div className="grid grid-cols-4 gap-1.5">
          {/* Temperature */}
          <button
            type="button"
            onClick={() => setPrimaryVariable && setPrimaryVariable('thetao')}
            className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              primaryVariable === 'thetao'
                ? 'bg-gradient-to-br from-amber-500 to-rose-600 text-white shadow-md shadow-rose-500/40 ring-1 ring-amber-300'
                : 'bg-[#02132b]/50 hover:bg-slate-800/80 text-slate-300 border border-cyan-400/20'
            }`}
          >
            <Thermometer className="h-4 w-4" />
            <span className="text-[9px] leading-tight text-center font-bold">Temperature</span>
          </button>

          {/* Salinity */}
          <button
            type="button"
            onClick={() => setPrimaryVariable && setPrimaryVariable('so')}
            className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              primaryVariable === 'so'
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/40 ring-1 ring-emerald-300'
                : 'bg-[#02132b]/50 hover:bg-slate-800/80 text-slate-300 border border-cyan-400/20'
            }`}
          >
            <Droplets className="h-4 w-4" />
            <span className="text-[9px] leading-tight text-center font-bold">Salinity</span>
          </button>

          {/* Current */}
          <button
            type="button"
            onClick={() => setPrimaryVariable && setPrimaryVariable('current_speed')}
            className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              primaryVariable === 'current_speed' || primaryVariable === 'uo'
                ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/40 ring-1 ring-cyan-300'
                : 'bg-[#02132b]/50 hover:bg-slate-800/80 text-slate-300 border border-cyan-400/20'
            }`}
          >
            <Wind className="h-4 w-4" />
            <span className="text-[9px] leading-tight text-center font-bold">Current</span>
          </button>

          {/* Density */}
          <button
            type="button"
            onClick={() => setPrimaryVariable && setPrimaryVariable('density')}
            className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              primaryVariable === 'density'
                ? 'bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white shadow-md shadow-purple-500/40 ring-1 ring-purple-300'
                : 'bg-[#02132b]/50 hover:bg-slate-800/80 text-slate-300 border border-cyan-400/20'
            }`}
          >
            <Gauge className="h-4 w-4" />
            <span className="text-[9px] leading-tight text-center font-bold">Density</span>
          </button>
        </div>

        {/* Visualization Sliders */}
        <div className="pt-2 flex flex-col gap-2 border-t border-cyan-400/20">
          <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">Visualization:</div>
          
          {/* Opacity Slider */}
          <div>
            <div className="flex justify-between text-[10px] font-mono text-slate-300 mb-1">
              <span>Atmosphere & Streamlines</span>
              <span className="text-sky-400 font-bold">{Math.round((opacity || 0.85) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={opacity || 0.85}
              onChange={(e) => setOpacity && setOpacity(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#02132b]/80 border border-cyan-400/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Depth Range Slider */}
          <div>
            <div className="flex justify-between text-[10px] font-mono text-slate-300 mb-1">
              <span>Depth Level</span>
              <span className="text-sky-400 font-bold">
                {Number(selectedDepth).toFixed(2)}m {Number(selectedDepth) <= 0.5 ? '(Surface)' : Number(selectedDepth) <= 12.0 ? '(Mixed Layer)' : '(Subsurface)'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={depths.length - 1}
              step="1"
              value={depths.findIndex(d => Math.abs(d - selectedDepth) < 0.1) >= 0 ? depths.findIndex(d => Math.abs(d - selectedDepth) < 0.1) : 0}
              onChange={(e) => {
                const idx = parseInt(e.target.value, 10);
                setSelectedDepth && setSelectedDepth(depths[idx]);
              }}
              className="w-full h-1.5 bg-[#02132b]/80 border border-cyan-400/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[8.5px] font-mono text-slate-400 mt-0.5">
              <span>{minDepth.toFixed(2)}m (Surface)</span>
              <span>{maxDepth.toFixed(2)}m (Base)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. DATA SOURCE & MORE LAYERS */}
      <div className="bg-[#020814]/10 backdrop-blur-[2px] rounded-2xl p-3.5 shadow-xl flex flex-col gap-2.5 border border-cyan-400/20">
        <label className="text-[11px] font-extrabold text-sky-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
          <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px] font-bold">4</span>
          Data Source:
        </label>

        {/* Model vs In-situ Interactive Toggle */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#02132b]/50 rounded-xl border border-cyan-400/20">
          <button
            type="button"
            id="btn-datasource-model"
            onClick={() => setDataSource && setDataSource('model')}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
              dataSource === 'model'
                ? 'bg-blue-600 text-white shadow-md font-bold ring-1 ring-blue-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Model (Copernicus)
          </button>
          <button
            type="button"
            id="btn-datasource-insitu"
            onClick={() => setDataSource && setDataSource('insitu')}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
              dataSource === 'insitu'
                ? 'bg-blue-600 text-white shadow-md font-bold ring-1 ring-blue-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            In-situ Buoys
          </button>
        </div>

        {/* Active Source Status Tag */}
        <div className="flex items-center justify-between px-2.5 py-1 bg-[#02132b]/50 rounded-lg border border-cyan-400/20 text-[10px] font-mono">
          <span className="text-slate-300">Active Source:</span>
          <span className={dataSource === 'model' ? 'text-sky-400 font-bold' : 'text-emerald-400 font-bold'}>
            {dataSource === 'model' ? 'Copernicus GLORYS12V1' : 'MoES-INCOIS Buoys'}
          </span>
        </div>

        {/* More Layers Checkboxes */}
        <div className="pt-2 flex flex-col gap-1.5 border-t border-cyan-400/20">
          <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">More Layers:</div>
          
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={layers.bathymetry !== false}
                onChange={() => setLayers && setLayers(prev => ({ ...prev, bathymetry: !prev.bathymetry }))}
                className="rounded bg-slate-900 border-cyan-400/30 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span className="text-[11px]">Bathymetry</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={layers.currents !== false}
                onChange={() => setLayers && setLayers(prev => ({ ...prev, currents: !prev.currents }))}
                className="rounded bg-slate-900 border-cyan-400/30 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span className="text-[11px]">Currents (Streamlines)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={layers.stations !== false}
                onChange={() => setLayers && setLayers(prev => ({ ...prev, stations: !prev.stations }))}
                className="rounded bg-slate-900 border-cyan-400/30 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span className="text-[11px]">Station Markers</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={layers.coastline !== false}
                onChange={() => setLayers && setLayers(prev => ({ ...prev, coastline: !prev.coastline }))}
                className="rounded bg-slate-900 border-cyan-400/30 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span className="text-[11px]">Coastline</span>
            </label>
          </div>
        </div>
      </div>

      {/* 6. INCOIS & SATELLITE NETWORK TELEMETRY STATUS */}
      <div className="bg-[#020814]/10 backdrop-blur-[2px] rounded-2xl p-3.5 border border-cyan-400/20 shadow-xl flex flex-col gap-2 text-xs font-mono">
        <div className="flex items-center justify-between text-[11px] font-sans font-bold text-slate-200">
          <span className="flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span>Telemetry Network Status</span>
          </span>
          <span className="px-1.5 py-0.5 rounded text-[9.5px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
            Online
          </span>
        </div>
        <div className="space-y-1 text-[10px] text-slate-300">
          <div className="flex justify-between">
            <span>MoES / NIOT Buoys:</span>
            <span className="text-white font-bold">12 Active (4 OMNI)</span>
          </div>
          <div className="flex justify-between">
            <span>Copernicus Altimetry:</span>
            <span className="text-sky-300 font-bold">Sentinel-3A/6A</span>
          </div>
          <div className="flex justify-between">
            <span>Spatial Grid Stride:</span>
            <span className="text-teal-300 font-bold">1/12° (~9 km)</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

