import React, { useEffect, useState, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Clock, 
  Sun, 
  Moon, 
  RotateCcw,
  Calendar,
  Sparkles,
  Activity,
  Flame,
  Droplets,
  Wind
} from 'lucide-react';
import { formatHourAmPm, formatFullTimestamp, getStationAccuracyMetrics } from '../data/mockOceanData';

export default function TimeControls({
  currentTimeHour = 12,
  setCurrentTimeHour = () => {},
  isPlaying = false,
  setIsPlaying = () => {},
  selectedDate = '2026-06-23',
  setSelectedDate,
  startDate = '2026-06-17',
  endDate = '2026-06-23',
  station = null,
  dataSource = 'model'
}) {
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 2x, 4x

  // Animation loop when playing (smooth forecast progression across 24h)
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTimeHour(prev => {
          const step = 0.25 * playbackSpeed;
          const next = prev + step;
          return next > 24 ? 0 : +(next.toFixed(2));
        });
      }, 250);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playbackSpeed, setCurrentTimeHour]);

  const handleStepBack = () => {
    setCurrentTimeHour(prev => Math.max(0, +(prev - 1).toFixed(2)));
  };

  const handleStepForward = () => {
    setCurrentTimeHour(prev => Math.min(24, +(prev + 1).toFixed(2)));
  };

  const safeHour = Math.max(0, Math.min(24, Number(currentTimeHour || 0)));
  const isDaytime = safeHour >= 6 && safeHour < 18;
  const isSolarPeak = safeHour >= 12 && safeHour <= 15;

  const formattedAmPm = formatHourAmPm(safeHour);
  const formatted24h = `${String(Math.floor(safeHour % 24)).padStart(2, '0')}:${String(Math.floor((safeHour % 1) * 60)).padStart(2, '0')}`;

  // Diurnal sinusoidal shift at surface
  const hourAngle = ((safeHour - 6) / 24) * 2 * Math.PI;
  const diurnalTempShift = +(Math.sin(hourAngle) * 0.45).toFixed(2);
  const diurnalCurrentShift = +(Math.cos(hourAngle * 2) * 0.08).toFixed(3);

  // Quick preset milestones with AM/PM labels
  const presets = [
    { hour: 0, label: '12:00 AM', desc: 'Midnight' },
    { hour: 6, label: '06:00 AM', desc: 'Sunrise / Min SST' },
    { hour: 9, label: '09:00 AM', desc: 'Morning' },
    { hour: 12, label: '12:00 PM', desc: 'Solar Noon' },
    { hour: 14, label: '02:00 PM', desc: 'Peak Solar SST' },
    { hour: 18, label: '06:00 PM', desc: 'Sunset' },
    { hour: 21, label: '09:00 PM', desc: 'Night' }
  ];

  return (
    <div className="w-full bg-[#0b1325]/95 border border-slate-800/90 rounded-2xl p-3 sm:p-3.5 shadow-xl backdrop-blur-md flex flex-col gap-2.5 select-none font-sans animate-in fade-in duration-300">
      
      {/* ROW 1: HEADER & PLAYBACK CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        
        {/* Left: Clock Title & Synchronized AM/PM Timestamp Badge */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 shrink-0">
            <Clock className="h-4 w-4" />
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-extrabold text-white tracking-tight uppercase font-mono">
                Temporal Dimension
              </span>
              <span className="text-slate-500 hidden sm:inline">•</span>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                Diurnal Ocean Simulator
              </span>
            </div>

            {/* Synced AM/PM Timestamp Badge */}
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#040814] border border-slate-800 text-xs font-mono">
                {isDaytime ? (
                  <Sun className={`h-3.5 w-3.5 ${isSolarPeak ? 'text-amber-400 animate-pulse' : 'text-amber-400'}`} />
                ) : (
                  <Moon className="h-3.5 w-3.5 text-indigo-400" />
                )}
                <span className="text-sky-300 font-extrabold text-sm">{formattedAmPm}</span>
                <span className="text-[10px] text-slate-400">UTC</span>
                <span className="text-slate-600">|</span>
                <span className="text-[10px] text-slate-400">24h: {formatted24h}</span>
              </div>

              {/* Day/Night status pill */}
              <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold font-mono uppercase ${
                isSolarPeak
                  ? 'bg-amber-950/70 text-amber-300 border border-amber-500/40'
                  : isDaytime
                    ? 'bg-sky-950/70 text-sky-300 border border-sky-500/40'
                    : 'bg-indigo-950/70 text-indigo-300 border border-indigo-500/40'
              }`}>
                {isSolarPeak ? '☀️ Solar Thermal Peak' : isDaytime ? '🌤️ Daytime Warming' : '🌙 Nocturnal Cooling'}
              </span>

              {/* Active Date Badge */}
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300">
                <Calendar className="h-3 w-3 text-sky-400" />
                <span>{selectedDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Stepper Controls, Play/Pause, Speeds */}
        <div className="flex items-center gap-1.5 self-start sm:self-center flex-wrap">
          {/* Step Back */}
          <button
            type="button"
            onClick={handleStepBack}
            title="Step Back 1 Hour"
            className="p-1.5 rounded-xl bg-[#060c18] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer"
          >
            <SkipBack className="h-3.5 w-3.5" />
          </button>

          {/* Play / Pause */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Pause Diurnal Simulation' : 'Play 24-Hour Diurnal Forecast'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30 ring-1 ring-amber-300'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/30 ring-1 ring-blue-300'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5 fill-white" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-white" />
                <span>Play Diurnal</span>
              </>
            )}
          </button>

          {/* Step Forward */}
          <button
            type="button"
            onClick={handleStepForward}
            title="Step Forward 1 Hour"
            className="p-1.5 rounded-xl bg-[#060c18] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </button>

          {/* Speed multiplier selector */}
          <div className="flex items-center bg-[#040814] rounded-xl p-0.5 border border-slate-800 text-[10px] font-mono font-bold text-slate-400">
            {[1, 2, 4].map(spd => (
              <button
                key={spd}
                type="button"
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-1 rounded-lg cursor-pointer transition-all ${
                  playbackSpeed === spd
                    ? 'bg-blue-600 text-white shadow-sm font-extrabold'
                    : 'hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Reset to Noon button */}
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setCurrentTimeHour(12);
            }}
            title="Reset Time to 12:00 PM (Noon)"
            className="hidden md:flex items-center gap-1 px-2 py-1 rounded-lg bg-[#060c18] hover:bg-slate-800 text-[10.5px] font-mono text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3 w-3 text-sky-400" />
            <span>12:00 PM</span>
          </button>
        </div>
      </div>

      {/* ROW 2: QUICK JUMP AM/PM PRESETS */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
        <span className="text-[10px] font-mono text-slate-400 uppercase font-bold mr-1 shrink-0 flex items-center gap-1">
          <Clock className="h-3 w-3 text-sky-400" /> Quick Hours:
        </span>
        {presets.map(p => {
          const isCurrent = Math.abs(safeHour - p.hour) < 1.0;
          return (
            <button
              key={p.hour}
              type="button"
              onClick={() => setCurrentTimeHour(p.hour)}
              title={`${p.label} — ${p.desc}`}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-1 ring-blue-300'
                  : 'bg-[#040814] hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* ROW 3: HORIZONTAL TIME RANGE SLIDER WITH AM/PM SCALE MARKS */}
      <div className="flex flex-col gap-1 pt-1">
        <div className="relative flex items-center">
          <input
            type="range"
            min="0"
            max="24"
            step="0.25"
            value={safeHour}
            onChange={(e) => setCurrentTimeHour(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500 focus:outline-none"
          />
        </div>

        {/* Continuous AM / PM Tick Labels */}
        <div className="flex justify-between text-[9.5px] sm:text-[10px] font-mono text-slate-400 px-0.5">
          <span 
            className={`cursor-pointer hover:text-sky-300 transition-colors ${safeHour <= 1.5 ? 'text-sky-400 font-extrabold' : ''}`}
            onClick={() => setCurrentTimeHour(0)}
          >
            12:00 AM
          </span>
          <span 
            className={`cursor-pointer hover:text-sky-300 transition-colors hidden sm:inline ${safeHour >= 2 && safeHour <= 4 ? 'text-sky-400 font-extrabold' : ''}`}
            onClick={() => setCurrentTimeHour(3)}
          >
            03:00 AM
          </span>
          <span 
            className={`cursor-pointer hover:text-sky-300 transition-colors ${safeHour >= 5 && safeHour <= 7 ? 'text-sky-400 font-extrabold' : ''}`}
            onClick={() => setCurrentTimeHour(6)}
          >
            06:00 AM
          </span>
          <span 
            className={`cursor-pointer hover:text-sky-300 transition-colors hidden sm:inline ${safeHour >= 8 && safeHour <= 10 ? 'text-sky-400 font-extrabold' : ''}`}
            onClick={() => setCurrentTimeHour(9)}
          >
            09:00 AM
          </span>
          <span 
            className={`cursor-pointer hover:text-sky-300 transition-colors ${safeHour >= 11 && safeHour <= 13 ? 'text-sky-400 font-extrabold' : ''}`}
            onClick={() => setCurrentTimeHour(12)}
          >
            12:00 PM
          </span>
          <span 
            className={`cursor-pointer hover:text-sky-300 transition-colors hidden sm:inline ${safeHour >= 14 && safeHour <= 16 ? 'text-sky-400 font-extrabold' : ''}`}
            onClick={() => setCurrentTimeHour(15)}
          >
            03:00 PM
          </span>
          <span 
            className={`cursor-pointer hover:text-sky-300 transition-colors ${safeHour >= 17 && safeHour <= 19 ? 'text-sky-400 font-extrabold' : ''}`}
            onClick={() => setCurrentTimeHour(18)}
          >
            06:00 PM
          </span>
          <span 
            className={`cursor-pointer hover:text-sky-300 transition-colors hidden sm:inline ${safeHour >= 20 && safeHour <= 22 ? 'text-sky-400 font-extrabold' : ''}`}
            onClick={() => setCurrentTimeHour(21)}
          >
            09:00 PM
          </span>
          <span 
            className={`cursor-pointer hover:text-sky-300 transition-colors ${safeHour >= 23 ? 'text-sky-400 font-extrabold' : ''}`}
            onClick={() => setCurrentTimeHour(24)}
          >
            12:00 AM
          </span>
        </div>
      </div>

      {/* ROW 4: DYNAMIC TIME-DEPENDENT PHYSICAL TELEMETRY READOUT */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 text-slate-300">
            <Flame className="h-3 w-3 text-rose-400" />
            <span>Diurnal Thermal ΔT:</span>
            <strong className={diurnalTempShift >= 0 ? 'text-amber-400' : 'text-cyan-400'}>
              {diurnalTempShift >= 0 ? `+${diurnalTempShift}` : diurnalTempShift} °C
            </strong>
          </div>

          <div className="flex items-center gap-1 text-slate-300">
            <Wind className="h-3 w-3 text-sky-400" />
            <span>Tidal Velocity Δ|U|:</span>
            <strong className="text-sky-300">
              {diurnalCurrentShift >= 0 ? `+${diurnalCurrentShift}` : diurnalCurrentShift} m/s
            </strong>
          </div>

          <div className="flex items-center gap-1 text-slate-400">
            <span>Model vs In-Situ Sync:</span>
            <strong className="text-emerald-400">Continuous Dynamic Coupling</strong>
          </div>
        </div>

        <div className="text-[9.5px] text-slate-400">
          Format: <span className="text-sky-400 font-bold">12-Hour AM/PM</span>
        </div>
      </div>

    </div>
  );
}
