import React, { useEffect, useState, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Database,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const AVAILABLE_DATES = [
  { iso: '2026-06-17', label: '17 Jun', weekday: 'Wed', dayNum: 1 },
  { iso: '2026-06-18', label: '18 Jun', weekday: 'Thu', dayNum: 2 },
  { iso: '2026-06-19', label: '19 Jun', weekday: 'Fri', dayNum: 3 },
  { iso: '2026-06-20', label: '20 Jun', weekday: 'Sat', dayNum: 4 },
  { iso: '2026-06-21', label: '21 Jun', weekday: 'Sun', dayNum: 5 },
  { iso: '2026-06-22', label: '22 Jun', weekday: 'Mon', dayNum: 6 },
  { iso: '2026-06-23', label: '23 Jun', weekday: 'Tue', dayNum: 7 },
];

export default function TimeControls({
  isPlaying = false,
  setIsPlaying = () => {},
  selectedDate = '2026-06-23',
  setSelectedDate = () => {},
  station = null
}) {
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 2x, 4x

  // Current date index (0 to 6)
  const currentDateIdx = useMemo(() => {
    const idx = AVAILABLE_DATES.findIndex(d => d.iso === selectedDate);
    return idx >= 0 ? idx : AVAILABLE_DATES.length - 1;
  }, [selectedDate]);

  // Animation loop: advances through the 7 real NetCDF daily reanalysis days
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setSelectedDate(prevDate => {
          const idx = AVAILABLE_DATES.findIndex(d => d.iso === prevDate);
          const nextIdx = (idx + 1) % AVAILABLE_DATES.length;
          return AVAILABLE_DATES[nextIdx].iso;
        });
      }, Math.max(700, 1800 / playbackSpeed));
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playbackSpeed, setSelectedDate]);

  const handlePrevDay = () => {
    const prevIdx = (currentDateIdx - 1 + AVAILABLE_DATES.length) % AVAILABLE_DATES.length;
    setSelectedDate(AVAILABLE_DATES[prevIdx].iso);
  };

  const handleNextDay = () => {
    const nextIdx = (currentDateIdx + 1) % AVAILABLE_DATES.length;
    setSelectedDate(AVAILABLE_DATES[nextIdx].iso);
  };

  return (
    <div className="w-full bg-[#020814]/40 backdrop-blur-md rounded-2xl p-2 sm:px-3 sm:py-2 border border-cyan-400/20 shadow-xl flex flex-col gap-1.5 select-none font-sans animate-in fade-in duration-300">
      
      {/* ROW 1: CONTROLS & ACTIVE TIMELINE TELEMETRY */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        
        {/* Left: Title, Active Date Pill & Live Station SST */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-cyan-500 via-sky-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 shrink-0">
            <Calendar className="h-3.5 w-3.5" />
          </div>

          <span className="text-[11px] font-extrabold text-white tracking-tight uppercase font-mono hidden md:inline">
            7-Day Reanalysis
          </span>

          {/* Active Date Pill */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-sky-950/80 border border-sky-500/40 text-[11px] font-mono text-sky-200">
            <span className="font-extrabold text-white">{AVAILABLE_DATES[currentDateIdx]?.label}</span>
            <span className="text-[10px] text-sky-400">({AVAILABLE_DATES[currentDateIdx]?.weekday})</span>
            <span className="text-slate-600">|</span>
            <span className="text-[10px] text-cyan-300 font-bold">Day {currentDateIdx + 1}/7</span>
          </div>

          {station && (
            <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-900/70 border border-slate-700/50">
              <span className="text-slate-400">{station.code || station.name}:</span>
              <span className="text-amber-300 font-bold">
                {(station.temperature ?? station.baseTemp ?? 28.5).toFixed(1)}°C
              </span>
              <span className="text-slate-600">/</span>
              <span className="text-cyan-300 font-bold">
                {(station.salinity ?? station.baseSalinity ?? 35.0).toFixed(1)} PSU
              </span>
            </div>
          )}
        </div>

        {/* Right: Steppers, Play/Pause, Speeds & Reset */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={handlePrevDay}
            title="Previous Day"
            className="p-1 rounded-lg bg-[#060c18]/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          {/* Play / Pause 7-Day Sequence */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Pause 7-Day Sequence' : 'Play 7-Day Ocean Evolution'}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-md cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30 ring-1 ring-amber-300'
                : 'bg-[#0d9488] hover:bg-[#14b8a6] text-white shadow-[0_0_12px_rgba(13,148,136,0.4)] ring-1 ring-teal-300/50'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="h-3 w-3 fill-white" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3 fill-white" />
                <span>Play 7 Days</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleNextDay}
            title="Next Day"
            className="p-1 rounded-lg bg-[#060c18]/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          {/* Speed multiplier selector */}
          <div className="flex items-center bg-[#040814]/80 rounded-lg p-0.5 text-[9.5px] font-mono font-bold text-slate-400">
            {[1, 2, 4].map(spd => (
              <button
                key={spd}
                type="button"
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                  playbackSpeed === spd
                    ? 'bg-[#0284c7] text-white shadow-xs font-extrabold'
                    : 'hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Reset to Day 1 (17 Jun) */}
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setSelectedDate('2026-06-17');
            }}
            title="Reset to Day 1 (17 June 2026)"
            className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#060c18]/80 hover:bg-slate-800 text-[9.5px] font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="h-2.5 w-2.5 text-sky-400" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ROW 2: 7 NETCDF REANALYSIS DAY BUTTONS */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pt-0.5">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {AVAILABLE_DATES.map((d) => {
            const isSelected = d.iso === selectedDate;
            return (
              <button
                key={d.iso}
                type="button"
                onClick={() => setSelectedDate(d.iso)}
                title={`Select ${d.iso} (${d.weekday}) — NetCDF Slice Day ${d.dayNum}`}
                className={`flex-1 min-w-[58px] py-1 px-1.5 rounded-lg text-center transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-extrabold shadow-sm border-cyan-300 ring-1 ring-cyan-200/60 scale-[1.01]'
                    : 'bg-[#021a38]/40 hover:bg-[#073060]/60 text-slate-300 border-cyan-400/20'
                }`}
              >
                <div className="text-[10.5px] font-bold font-mono tracking-tight leading-none">{d.label}</div>
                <div className={`text-[8px] font-mono leading-none mt-0.5 ${isSelected ? 'text-sky-100 font-bold' : 'text-slate-400'}`}>
                  {d.weekday} • D{d.dayNum}
                </div>
              </button>
            );
          })}
        </div>

        {/* Compact Copernicus Metadata Badge */}
        <div className="hidden xl:flex items-center gap-1 text-[8.5px] font-mono text-slate-400 shrink-0 pl-2 border-l border-cyan-500/20">
          <Database className="h-2.5 w-2.5 text-emerald-400" />
          <span>Copernicus GLORYS12V1 (P1D-m)</span>
        </div>
      </div>

    </div>
  );
}

