import React, { useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Clock, 
  Sun, 
  Moon, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

export default function TimeControls({
  currentTimeHour,
  setCurrentTimeHour,
  isPlaying,
  setIsPlaying
}) {
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 2x, 4x

  // Animation loop when playing
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTimeHour(prev => {
          const next = prev + 0.25 * playbackSpeed;
          return next > 24 ? 0 : +(next.toFixed(2));
        });
      }, 300);
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

  const formattedHours = String(Math.floor(currentTimeHour)).padStart(2, '0');
  const formattedMins = String(Math.floor((currentTimeHour % 1) * 60)).padStart(2, '0');
  const timestampString = `2026-09-03 ${formattedHours}:${formattedMins} UTC`;

  const isDaytime = currentTimeHour >= 6 && currentTimeHour <= 18;

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Left: Time Title & Current Timestamp */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono block leading-none">
                Temporal Dimension
              </span>
              <span className="text-sm font-extrabold text-slate-900 font-mono">
                Time
              </span>
            </div>
          </div>

          <div className="h-7 w-px bg-slate-200 hidden sm:block" />

          {/* Current Timestamp Badge */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 font-mono text-xs">
            {isDaytime ? (
              <Sun className="h-3.5 w-3.5 text-amber-500" />
            ) : (
              <Moon className="h-3.5 w-3.5 text-indigo-400" />
            )}
            <span className="font-bold text-slate-800">{timestampString}</span>
            <span className="text-[10px] text-slate-400 font-medium">
              ({formattedHours}:00)
            </span>
          </div>
        </div>

        {/* Center: Play / Pause / Skip controls */}
        <div className="flex items-center gap-1.5 self-center">
          <button
            type="button"
            onClick={handleStepBack}
            title="Step Back 1 Hour"
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <SkipBack className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsPlaying(prev => !prev)}
            title={isPlaying ? "Pause Forecast" : "Play Forecast"}
            className={`flex items-center justify-center h-9 w-9 rounded-xl font-bold transition-all shadow-sm cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-sky-600 hover:bg-sky-700 text-white'
            }`}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={handleStepForward}
            title="Step Forward 1 Hour"
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <SkipForward className="h-4 w-4" />
          </button>

          {/* Playback speed selector */}
          <div className="ml-2 flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-[10px] font-mono font-bold text-slate-600">
            {[1, 2, 4].map(spd => (
              <button
                key={spd}
                type="button"
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                  playbackSpeed === spd
                    ? 'bg-white text-sky-700 shadow-2xs'
                    : 'hover:text-slate-900'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Right: Reset Time quick button */}
        <button
          type="button"
          onClick={() => {
            setIsPlaying(false);
            setCurrentTimeHour(12);
          }}
          className="hidden lg:flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" />
          Reset to Noon (12:00)
        </button>
      </div>

      {/* Main Horizontal Time Slider */}
      <div className="mt-3 pt-2">
        <div className="relative flex items-center">
          <input
            type="range"
            min="0"
            max="24"
            step="0.25"
            value={currentTimeHour}
            onChange={(e) => setCurrentTimeHour(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600 focus:outline-none"
          />
        </div>

        {/* Time Scale Marks (Requirement 6: 00:00, 06:00, 12:00, 18:00, 24:00) */}
        <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-1.5 px-0.5">
          <span 
            className={`cursor-pointer hover:text-sky-600 font-medium ${currentTimeHour <= 3 ? 'text-sky-700 font-bold' : ''}`}
            onClick={() => setCurrentTimeHour(0)}
          >
            00:00
          </span>
          <span 
            className={`cursor-pointer hover:text-sky-600 font-medium ${currentTimeHour >= 4.5 && currentTimeHour <= 7.5 ? 'text-sky-700 font-bold' : ''}`}
            onClick={() => setCurrentTimeHour(6)}
          >
            06:00
          </span>
          <span 
            className={`cursor-pointer hover:text-sky-600 font-medium ${currentTimeHour >= 10.5 && currentTimeHour <= 13.5 ? 'text-sky-700 font-bold' : ''}`}
            onClick={() => setCurrentTimeHour(12)}
          >
            12:00
          </span>
          <span 
            className={`cursor-pointer hover:text-sky-600 font-medium ${currentTimeHour >= 16.5 && currentTimeHour <= 19.5 ? 'text-sky-700 font-bold' : ''}`}
            onClick={() => setCurrentTimeHour(18)}
          >
            18:00
          </span>
          <span 
            className={`cursor-pointer hover:text-sky-600 font-medium ${currentTimeHour >= 22.5 ? 'text-sky-700 font-bold' : ''}`}
            onClick={() => setCurrentTimeHour(24)}
          >
            24:00
          </span>
        </div>
      </div>
    </div>
  );
}
