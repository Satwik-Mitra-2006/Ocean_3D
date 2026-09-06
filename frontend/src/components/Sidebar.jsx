import React, { useMemo } from 'react';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Calendar,
  ChevronDown,
  Radio
} from 'lucide-react';

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
  selectedDate = '2026-06-23',
  setStartDate,
  setEndDate,
  setSelectedDate,
  dataSource = 'model',
  setDataSource
}) {
  const depths = availableDepths && availableDepths.length > 0
    ? availableDepths
    : [0.49, 1.54, 2.65, 3.82, 5.08, 6.44, 7.93, 9.57, 11.40];

  const minDepth = Math.min(...depths);
  const maxDepth = Math.max(...depths);

  const toggleLayer = (key) => {
    if (setLayers) {
      setLayers(prev => ({
        ...prev,
        [key]: !prev[key]
      }));
    }
  };

  const handleClearAllLayers = () => {
    if (setLayers) {
      setLayers({
        stations: false,
        currents: false,
        coastline: false,
        bathymetry: false,
        grid: false
      });
    }
  };

  const currentDepthIndex = depths.findIndex(d => Math.abs(d - selectedDepth) < 0.1);
  const safeDepthIndex = currentDepthIndex >= 0 ? currentDepthIndex : 0;

  // Station quick buttons matching Image 2
  const quickStationCodes = ['AD02', 'BD08', 'ARGO 2901844', 'CB01', 'BD11', 'TB05'];

  // Generate the list of selectable days strictly within the chosen date range (17/06/2026 to 23/06/2026)
  const selectableDays = useMemo(() => {
    const list = [];
    try {
      const start = new Date(startDate || '2026-06-17');
      const end = new Date(endDate || '2026-06-23');
      const current = new Date(start);

      // Max 14 days safety loop
      let count = 0;
      while (current <= end && count < 14) {
        const yyyy = current.getFullYear();
        const mm = String(current.getMonth() + 1).padStart(2, '0');
        const dd = String(current.getDate()).padStart(2, '0');
        const iso = `${yyyy}-${mm}-${dd}`;
        const label = current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        list.push({ iso, label });
        current.setDate(current.getDate() + 1);
        count++;
      }
    } catch {
      // Fallback: 17 Jun to 23 Jun 2026
      return [
        { iso: '2026-06-17', label: '17 Jun' },
        { iso: '2026-06-18', label: '18 Jun' },
        { iso: '2026-06-19', label: '19 Jun' },
        { iso: '2026-06-20', label: '20 Jun' },
        { iso: '2026-06-21', label: '21 Jun' },
        { iso: '2026-06-22', label: '22 Jun' },
        { iso: '2026-06-23', label: '23 Jun' }
      ];
    }
    return list;
  }, [startDate, endDate]);

  return (
    <aside className="w-full lg:w-72 xl:w-80 flex flex-col gap-2.5 text-slate-200 select-none shrink-0 font-sans">
      
      {/* 1. BRAND HEADER */}
      <div className="bg-[#050b18]/95 backdrop-blur-md rounded-2xl p-3 border border-slate-800/80 shadow-lg flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold text-white tracking-tight">Ocean3D</h1>
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 font-mono uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-sans">Interactive Ocean Visualization</p>
        </div>

        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono text-sky-400 bg-sky-950/70 border border-sky-500/30">
          Data Bound
        </span>
      </div>

      {/* 2. SELECT STATION */}
      <div className="bg-[#050b18]/95 backdrop-blur-md rounded-2xl p-3 border border-slate-800/80 shadow-lg flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px] font-bold">1</span>
            Select Station:
          </label>
        </div>

        {/* Station Select Dropdown */}
        <div className="relative">
          <select
            value={selectedStation?.code || selectedStation?.id || 'BD08'}
            onChange={(e) => {
              const found = stations.find(s => s.code === e.target.value || s.id === e.target.value);
              if (found && onSelectStation) onSelectStation(found);
            }}
            className="w-full bg-[#030712] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white appearance-none focus:outline-none focus:border-sky-400 cursor-pointer font-sans"
          >
            {stations.map(st => (
              <option key={st.id} value={st.code || st.id} className="bg-slate-900 text-white">
                {st.name || st.code} ({st.region || 'Indian Ocean'})
              </option>
            ))}
          </select>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
        </div>

        {/* Quick Station Filter Buttons (2 Rows matching Image 2) */}
        <div className="grid grid-cols-3 gap-1 pt-1">
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
                className={`px-1.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all truncate cursor-pointer ${
                  isSel
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-1 ring-blue-300'
                    : 'bg-[#030712] hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
                title={code}
              >
                {code}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. DATE RANGE SELECTOR (STRICTLY WITHIN DATASET BOUNDS - NO ARBITRARY MONTH/YEAR) */}
      <div className="bg-[#050b18]/95 backdrop-blur-md rounded-2xl p-3 border border-slate-800/80 shadow-lg flex flex-col gap-2">
        <label className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
          <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px] font-bold">2</span>
          Date Range (Copernicus NetCDF):
        </label>

        {/* Date Range Inputs strictly bound */}
        <div className="flex items-center gap-2 bg-[#030712] p-2 rounded-xl border border-slate-800 text-xs font-mono text-slate-200">
          <Calendar className="h-3.5 w-3.5 text-sky-400 shrink-0" />
          <input
            type="date"
            min="2026-06-17"
            max="2026-06-23"
            value={startDate}
            onChange={(e) => setStartDate && setStartDate(e.target.value)}
            className="bg-transparent text-white focus:outline-none w-full cursor-pointer text-xs"
          />
          <span className="text-slate-500">→</span>
          <input
            type="date"
            min="2026-06-17"
            max="2026-06-23"
            value={endDate}
            onChange={(e) => setEndDate && setEndDate(e.target.value)}
            className="bg-transparent text-white focus:outline-none w-full cursor-pointer text-xs"
          />
        </div>

        {/* Quick Select Buttons Strictly Within the Chosen Date Range (No 1m, 1y) */}
        <div className="pt-1">
          <div className="text-[10px] font-mono text-slate-400 mb-1 flex items-center justify-between">
            <span>Select Active Day:</span>
            <span className="text-sky-300 font-bold">{selectedDate}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {selectableDays.map(d => {
              const isSelected = selectedDate === d.iso;
              return (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => setSelectedDate && setSelectedDate(d.iso)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/40 ring-1 ring-blue-300'
                      : 'bg-[#030712] hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. VARIABLES & VISUALIZATION */}
      <div className="bg-[#050b18]/95 backdrop-blur-md rounded-2xl p-3 border border-slate-800/80 shadow-lg flex flex-col gap-2">
        <label className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
          <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px] font-bold">3</span>
          Variables:
        </label>

        {/* Variable Toggles */}
        <div className="grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => setPrimaryVariable && setPrimaryVariable('thetao')}
            className={`py-1.5 px-1 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              primaryVariable === 'thetao'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                : 'bg-[#030712] hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`}
          >
            <Thermometer className="h-3.5 w-3.5" />
            <span className="text-[10px] leading-none">Temperature</span>
          </button>

          <button
            type="button"
            onClick={() => setPrimaryVariable && setPrimaryVariable('so')}
            className={`py-1.5 px-1 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              primaryVariable === 'so'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                : 'bg-[#030712] hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`}
          >
            <Droplets className="h-3.5 w-3.5" />
            <span className="text-[10px] leading-none">Salinity</span>
          </button>

          <button
            type="button"
            onClick={() => setPrimaryVariable && setPrimaryVariable('current_speed')}
            className={`py-1.5 px-1 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              primaryVariable === 'current_speed' || primaryVariable === 'uo'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                : 'bg-[#030712] hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`}
          >
            <Wind className="h-3.5 w-3.5" />
            <span className="text-[10px] leading-none">Current Speed</span>
          </button>
        </div>

        {/* Visualization Sliders */}
        <div className="pt-2 flex flex-col gap-2 border-t border-slate-800/80">
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
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Depth Range Slider (0.49m to 11.40m Copernicus 9 Layers) */}
          <div>
            <div className="flex justify-between text-[10px] font-mono text-slate-300 mb-1">
              <span>Depth Level</span>
              <span className="text-sky-400 font-bold">{Number(selectedDepth).toFixed(2)}m (Surface)</span>
            </div>
            <input
              type="range"
              min="0"
              max={depths.length - 1}
              step="1"
              value={safeDepthIndex}
              onChange={(e) => {
                const idx = parseInt(e.target.value, 10);
                setSelectedDepth && setSelectedDepth(depths[idx]);
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[8.5px] font-mono text-slate-500 mt-0.5">
              <span>{minDepth.toFixed(2)}m (Surface)</span>
              <span>{maxDepth.toFixed(2)}m (Base)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. DATA SOURCE & MORE LAYERS */}
      <div className="bg-[#050b18]/95 backdrop-blur-md rounded-2xl p-3 border border-slate-800/80 shadow-lg flex flex-col gap-2">
        <label className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
          <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px] font-bold">4</span>
          Data Source:
        </label>

        {/* Model vs In-situ Interactive Toggle matching reference image */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#030712] rounded-xl border border-slate-800">
          <button
            type="button"
            id="btn-datasource-model"
            onClick={() => setDataSource && setDataSource('model')}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
              dataSource === 'model'
                ? 'bg-blue-600 text-white shadow-md font-bold ring-1 ring-blue-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
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
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            In-situ Buoys
          </button>
        </div>

        {/* Active Source Status Tag */}
        <div className="flex items-center justify-between px-2.5 py-1 bg-[#030712]/70 rounded-lg border border-slate-800/60 text-[10px] font-mono">
          <span className="text-slate-500">Active Source:</span>
          <span className={dataSource === 'model' ? 'text-sky-400 font-bold' : 'text-emerald-400 font-bold'}>
            {dataSource === 'model' ? 'Copernicus GLORYS12V1' : 'MoES-INCOIS Buoys'}
          </span>
        </div>

        {/* More Layers Checkboxes */}
        <div className="pt-2 flex flex-col gap-1.5 border-t border-slate-800/80">
          <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">More Layers:</div>
          
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={layers.bathymetry !== false}
                onChange={() => toggleLayer('bathymetry')}
                className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span className="text-[11px]">Bathymetry</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={layers.currents !== false}
                onChange={() => toggleLayer('currents')}
                className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span className="text-[11px]">Currents (Streamlines)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={layers.stations !== false}
                onChange={() => toggleLayer('stations')}
                className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span className="text-[11px]">Station Markers</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={layers.coastline !== false}
                onChange={() => toggleLayer('coastline')}
                className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span className="text-[11px]">Coastline</span>
            </label>
          </div>

          <button
            type="button"
            onClick={handleClearAllLayers}
            className="mt-1 w-full py-1 rounded-lg text-[10px] font-mono text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
          >
            Clear All Layers
          </button>
        </div>
      </div>

      {/* 5. INCOIS & SATELLITE NETWORK TELEMETRY HEALTH */}
      <div className="bg-[#050b18]/95 backdrop-blur-md rounded-2xl p-3 border border-slate-800/80 shadow-lg flex flex-col gap-2 text-xs font-mono">
        <div className="flex items-center justify-between text-[11px] font-sans font-bold text-slate-300">
          <span className="flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span>Telemetry Network Status</span>
          </span>
          <span className="px-1.5 py-0.5 rounded text-[9.5px] bg-emerald-950 text-emerald-300 border border-emerald-500/40">
            Online
          </span>
        </div>
        <div className="space-y-1 text-[10px] text-slate-400">
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
