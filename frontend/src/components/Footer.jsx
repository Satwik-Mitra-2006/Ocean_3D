import React from 'react';
import { Waves, Monitor, Lightbulb } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full mt-2 py-2 px-2 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-sans select-none relative">


      {/* 3 Pillars matching mockup */}
      <div className="flex items-center gap-6 sm:gap-8 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/70 border border-cyan-500/30 text-cyan-300">
            <Waves className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">EXPLORE</span>
            <span className="font-extrabold tracking-tight text-white text-[11px]">THE OCEAN</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/70 border border-cyan-500/30 text-cyan-300">
            <Monitor className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">UNDERSTAND</span>
            <span className="font-extrabold tracking-tight text-white text-[11px]">THE CHANGE</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/70 border border-cyan-500/30 text-cyan-300">
            <Lightbulb className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">BUILD</span>
            <span className="font-extrabold tracking-tight text-white text-[11px]">A SAFER TOMORROW</span>
          </div>
        </div>
      </div>

      {/* MoES / INCOIS Quote */}
      <div className="text-right">
        <p className="text-[11px] text-slate-300 italic font-medium">
          &ldquo;Data Today. A Safer Tomorrow.&rdquo;
        </p>
        <p className="text-[9.5px] font-mono text-cyan-400/80 mt-0.5">
          &mdash; Ministry of Earth Sciences
        </p>
      </div>
    </footer>
  );
}
