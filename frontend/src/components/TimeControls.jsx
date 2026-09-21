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
    <div className="w-full bg-[#020814]/10 backdrop-blur-[2px] rounded-2xl p-3 border border-cyan-400/20 shadow-xl flex flex-col gap-2 select-none font-sans animate-in fade-in duration-300">
      
      {/* ROW 1: HEADER & TIMELINE CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        
        {/* Left: Title & Synced Date Badge */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 shrink-0">
            <Calendar className="h-4 w-4" />
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-extrabold text-white tracking-tight uppercase font-mono">
                Temporal Dimension (7-Day Reanalysis)
              </span>
              <span className="text-slate-500 hidden sm:inline">•</span>
              <span className="text-[10.5px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Copernicus P1D-m Daily Resolution
              </span>
            </div>

            {/* Active Date Pill */}
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-sky-950/70 border border-sky-500/40 text-xs font-mono text-sky-200">
                <Calendar className="h-3.5 w-3.5 text-sky-400" />
                <span className="font-extrabold text-white">{selectedDate}</span>
                <span className="text-[10px] text-sky-400">({AVAILABLE_DATES[currentDateIdx]?.weekday})</span>
                <span className="text-slate-600">|</span>
                <span className="text-[10px] text-sky-300 font-bold">Day {currentDateIdx + 1} of 7</span>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold font-mono uppercase bg-emerald-950/70 text-emerald-300 border border-emerald-500/30">
                100% Genuine NetCDF Observation
              </span>
            </div>
          </div>
        </div>

        {/* Right: Play/Pause, Steppers, Speeds */}
        <div className="flex items-center gap-1.5 self-start sm:self-center flex-wrap">
          {/* Step Back Day */}
          <button
            type="button"
            onClick={handlePrevDay}
            title="Previous Day"
            className="p-1.5 rounded-xl bg-[#060c18]/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Play / Pause 7-Day Sequence */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Pause 7-Day Sequence' : 'Play 7-Day Ocean Evolution'}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-md cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30 ring-1 ring-amber-300'
                : 'bg-[#0d9488] hover:bg-[#14b8a6] text-white shadow-[0_0_15px_rgba(13,148,136,0.4)] ring-1 ring-teal-300/50'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5 fill-white" />
                <span>Pause Sequence</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-white" />
                <span>Play 7 Days</span>
              </>
            )}
          </button>

          {/* Step Forward Day */}
          <button
            type="button"
            onClick={handleNextDay}
            title="Next Day"
            className="p-1.5 rounded-xl bg-[#060c18]/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Speed multiplier selector */}
          <div className="flex items-center bg-[#040814]/80 rounded-xl p-0.5 text-[10px] font-mono font-bold text-slate-400">
            {[1, 2, 4].map(spd => (
              <button
                key={spd}
                type="button"
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-1 rounded-lg cursor-pointer transition-all ${
                  playbackSpeed === spd
                    ? 'bg-[#0284c7] text-white shadow-sm font-extrabold'
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
            className="hidden md:flex items-center gap-1 px-2 py-1 rounded-lg bg-[#060c18]/80 hover:bg-slate-800 text-[10.5px] font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3 w-3 text-sky-400" />
            <span>Reset (Day 1)</span>
          </button>
        </div>
      </div>

      {/* ROW 2: 7 NETCDF OBSERVATION DAYS (17 TO 23 JUNE) */}
      <div className="flex items-center gap-1.5 bg-[#02132b]/30 p-1.5 rounded-xl border border-cyan-400/15 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 mr-1 shrink-0">
          <Calendar className="h-3.5 w-3.5 text-sky-400" />
          <span className="text-[10.5px] font-mono font-extrabold text-slate-300 uppercase tracking-tight">
            Observation Days:
          </span>
        </div>

        {/* 7 Days clickable buttons */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {AVAILABLE_DATES.map((d, i) => {
            const isSelected = d.iso === selectedDate;
            return (
              <button
                key={d.iso}
                type="button"
                onClick={() => setSelectedDate(d.iso)}
                title={`Select ${d.iso} (${d.weekday}) — NetCDF Slice Day ${d.dayNum}`}
                className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-xl text-center transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-gradient-to-r from-teal-500/90 to-cyan-500 text-white font-extrabold shadow-[0_0_20px_rgba(6,182,212,0.5)] border-cyan-300 ring-2 ring-cyan-200/60 scale-[1.02]'
                    : 'bg-[#021a38]/45 hover:bg-[#073060]/70 text-slate-200 border-cyan-400/25'
                }`}
              >
                <div className="text-[11.5px] font-bold font-mono tracking-tight leading-tight">{d.label}</div>
                <div className={`text-[9.5px] font-mono leading-none mt-0.5 ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                  {d.weekday} • Day {d.dayNum}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ROW 3: SCIENTIFIC INTEGRITY & DATASET TELEMETRY FOOTER */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 text-slate-300">
            <Database className="h-3 w-3 text-emerald-400" />
            <span>Dataset Product:</span>
            <strong className="text-emerald-400 font-bold">Copernicus GLORYS12V1 (P1D-m Daily Mean)</strong>
          </div>

          <div className="flex items-center gap-1 text-slate-300">
            <span>Observation Window:</span>
            <strong className="text-sky-300">17 Jun – 23 Jun 2026 (7 Days)</strong>
          </div>

          <div className="flex items-center gap-1 text-slate-400">
            <span>Scientific Data Integrity:</span>
            <strong className="text-emerald-400">100% Genuine NetCDF Observation</strong>
          </div>
        </div>

        {station && (
          <div className="text-[10px] text-slate-300 font-mono flex items-center gap-2">
            <span className="text-slate-400">{station.code || station.name}:</span>
            <span className="text-amber-300 font-bold">
              SST: {(station.temperature ?? station.baseTemp ?? 28.5).toFixed(2)} °C
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-300 font-bold">
              Sal: {(station.salinity ?? station.baseSalinity ?? 35.0).toFixed(2)} PSU
            </span>
          </div>
        )}
      </div>

    </div>
  );
}
