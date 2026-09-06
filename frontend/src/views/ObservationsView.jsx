import React, { useState, useMemo } from 'react';
import { 
  Radio, 
  MapPin, 
  Thermometer, 
  Droplets, 
  Gauge, 
  Compass, 
  Waves, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Search, 
  ArrowUpRight, 
  ExternalLink,
  ShieldCheck,
  Battery,
  Clock,
  Sparkles,
  Info,
  Globe2
} from 'lucide-react';

export default function ObservationsView({
  stations = [],
  selectedStation,
  onSelectStation,
  onNavigateTo3D,
  selectedDepth = 100
}) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCardId, setSelectedCardId] = useState(selectedStation?.id || 'station-04');

  // Filtered stations
  const filteredStations = useMemo(() => {
    return stations.filter(st => {
      const matchStatus = filterStatus === 'ALL' || st.status?.toUpperCase() === filterStatus;
      const q = searchQuery.toLowerCase();
      const matchQuery = !q || 
        st.name?.toLowerCase().includes(q) || 
        st.region?.toLowerCase().includes(q) ||
        st.code?.toLowerCase().includes(q) ||
        st.type?.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [stations, filterStatus, searchQuery]);

  // Status counters
  const totalCount = stations.length;
  const activeCount = stations.filter(s => s.status === 'Active').length;
  const warningCount = stations.filter(s => s.status === 'Warning').length;
  const offlineCount = stations.filter(s => s.status === 'Offline').length;

  const handleSelectAndExplore = (st) => {
    if (onSelectStation) onSelectStation(st);
    if (onNavigateTo3D) onNavigateTo3D();
  };

  return (
    <div className="flex-1 flex flex-col gap-4 text-slate-100 max-w-[1800px] mx-auto w-full px-3 py-2 animate-in fade-in duration-300">
      
      {/* HEADER BANNER */}
      <div className="bg-[#0b1325]/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-950 text-sky-400 border border-sky-500/40 uppercase font-mono">
              In-Situ Ocean Network
            </span>
            <span className="text-xs text-slate-400">• MoES / INCOIS & NIOT</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Indian Ocean Observation Stations & Buoy Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            Real-time in-situ sensory network monitoring surface and subsurface ocean dynamics across the Arabian Sea, Bay of Bengal, and Lakshadweep Sea.
          </p>
        </div>

        {/* Status Counters */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'ALL'
                ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/30'
                : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            All: <span className="text-sky-300 ml-1">{totalCount}</span>
          </button>
          <button
            onClick={() => setFilterStatus('ACTIVE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'ACTIVE'
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-500/30'
                : 'bg-slate-900/80 text-emerald-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Active: <span className="ml-1">{activeCount}</span>
          </button>
          <button
            onClick={() => setFilterStatus('WARNING')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'WARNING'
                ? 'bg-amber-600 text-white border-amber-400 shadow-lg shadow-amber-500/30'
                : 'bg-slate-900/80 text-amber-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Warning: <span className="ml-1">{warningCount}</span>
          </button>
          <button
            onClick={() => setFilterStatus('OFFLINE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'OFFLINE'
                ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-500/30'
                : 'bg-slate-900/80 text-rose-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <XCircle className="h-3.5 w-3.5" />
            Offline: <span className="ml-1">{offlineCount}</span>
          </button>
        </div>
      </div>

      {/* SEARCH AND CONTROLS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#080f20]/90 border border-slate-800/80 rounded-xl p-3">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, region, or code (e.g. CB01, BD08)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#050a14] border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-400"
          />
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span>Showing <strong>{filteredStations.length}</strong> of <strong>{stations.length}</strong> Stations</span>
          <span className="text-slate-600">•</span>
          <span className="text-sky-400">Click any station to load directly into 3D Twin</span>
        </div>
      </div>

      {/* STATION CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStations.map(station => {
          const isSelected = selectedStation?.id === station.id || selectedCardId === station.id;
          const status = station.status || 'Active';
          const isWarning = status === 'Warning';
          const isOffline = status === 'Offline';
          const lat = station.lat ?? station.latitude ?? 10.57;
          const lon = station.lon ?? station.longitude ?? 72.63;
          const temp = station.temperature ?? station.baseTemp ?? 27.4;
          const sal = station.salinity ?? station.baseSalinity ?? 35.1;
          const speed = station.current_speed ?? station.baseSpeed ?? 0.32;
          const wave = station.wave_height ?? station.baseWave ?? 2.0;
          const dir = station.current_dir_compass || station.direction || '145° SE';

          return (
            <div
              key={station.id}
              onClick={() => {
                setSelectedCardId(station.id);
                if (onSelectStation) onSelectStation(station);
              }}
              className={`bg-[#0b1325]/90 rounded-2xl p-5 border transition-all cursor-pointer flex flex-col justify-between gap-4 relative overflow-hidden ${
                isSelected 
                  ? 'border-sky-400 ring-2 ring-sky-500/30 shadow-xl shadow-sky-500/10 bg-[#0d1830]' 
                  : 'border-slate-800/80 hover:border-slate-700 hover:bg-[#0e172c]'
              }`}
            >
              {/* Active Indicator Top Strip */}
              {isSelected && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500" />
              )}

              {/* Top Row: Name, Code & Status Badge */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold shadow-md ${
                      isOffline 
                        ? 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
                        : isWarning 
                        ? 'bg-amber-950/80 text-amber-400 border border-amber-500/30'
                        : 'bg-sky-950/80 text-sky-400 border border-sky-500/30'
                    }`}>
                      <Radio className={`h-5 w-5 ${!isOffline && 'animate-pulse'}`} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                        <span>{station.name}</span>
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-sky-400 shrink-0" />
                        <span>{station.region}</span>
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono shrink-0 border ${
                    isOffline
                      ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                      : isWarning
                      ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {status}
                  </span>
                </div>

                {/* Coordinates & Agency Chip */}
                <div className="flex items-center justify-between text-[11px] font-mono mt-3 pt-2.5 border-t border-slate-800/80 text-slate-300">
                  <span className="bg-[#050a14] px-2 py-0.5 rounded border border-slate-800 text-sky-300 font-semibold">
                    {Math.abs(lat).toFixed(2)}° {lat >= 0 ? 'N' : 'S'}, {Math.abs(lon).toFixed(2)}° {lon >= 0 ? 'E' : 'W'}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[160px]" title={station.source}>
                    {station.source?.split('/')[0] || 'MoES / INCOIS'}
                  </span>
                </div>
              </div>

              {/* Physical Parameters Grid */}
              <div className="grid grid-cols-3 gap-2 bg-[#060c18] p-3 rounded-xl border border-slate-800/60 font-mono text-xs">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-sans flex items-center gap-1">
                    <Thermometer className="h-3 w-3 text-rose-400" /> Temp
                  </span>
                  <span className="font-bold text-slate-100 mt-0.5">{temp} °C</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-sans flex items-center gap-1">
                    <Droplets className="h-3 w-3 text-teal-400" /> Salinity
                  </span>
                  <span className="font-bold text-slate-100 mt-0.5">{sal} PSU</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-sans flex items-center gap-1">
                    <Gauge className="h-3 w-3 text-sky-400" /> Speed
                  </span>
                  <span className="font-bold text-slate-100 mt-0.5">{speed} m/s</span>
                </div>
                <div className="flex flex-col pt-2 border-t border-slate-800/60">
                  <span className="text-[10px] text-slate-400 font-sans flex items-center gap-1">
                    <Compass className="h-3 w-3 text-blue-400" /> Dir
                  </span>
                  <span className="font-bold text-emerald-400 mt-0.5">{dir}</span>
                </div>
                <div className="flex flex-col pt-2 border-t border-slate-800/60">
                  <span className="text-[10px] text-slate-400 font-sans flex items-center gap-1">
                    <Waves className="h-3 w-3 text-cyan-400" /> Wave
                  </span>
                  <span className="font-bold text-slate-100 mt-0.5">{wave} m</span>
                </div>
                <div className="flex flex-col pt-2 border-t border-slate-800/60">
                  <span className="text-[10px] text-slate-400 font-sans flex items-center gap-1">
                    <Battery className="h-3 w-3 text-amber-400" /> Battery
                  </span>
                  <span className="font-bold text-slate-300 mt-0.5">{station.battery?.split(' ')[0] || '12.4V'}</span>
                </div>
              </div>

              {/* Special Note for CB01 if Warning */}
              {station.code === 'CB01' && (
                <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-2.5 text-[11px] text-amber-300/90 flex items-start gap-2 font-sans">
                  <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Lakshadweep Radar Note:</strong> High-frequency coastal surface radar tracking current shifts through Nine Degree Channel. Sensor calibration check ongoing.
                  </div>
                </div>
              )}

              {/* Action Button: Load into 3D Twin */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectAndExplore(station);
                }}
                className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white shadow-lg shadow-blue-500/30 ring-1 ring-blue-300'
                    : 'bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-200 border border-slate-700'
                }`}
              >
                <Globe2 className="h-3.5 w-3.5" />
                <span>Load into 3D Twin & Water Column</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
}
