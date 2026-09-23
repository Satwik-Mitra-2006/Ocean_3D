import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sparkles } from 'lucide-react';
import { THEMES } from '../themeConfig';

export default function ThemeSwitcher({ currentTheme, onSelectTheme }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeTheme = THEMES[currentTheme] || THEMES['deep-navy'];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Change Background & Dashboard Color Theme"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/40 text-slate-200 text-xs font-semibold transition-all shadow-sm cursor-pointer hover:border-indigo-400/50"
      >
        <Palette className="h-3.5 w-3.5 text-indigo-400" />
        <span className="hidden md:inline text-[11.5px]">{activeTheme.name}</span>
        <span
          className="w-2.5 h-2.5 rounded-full border border-white/40 shrink-0 ml-0.5"
          style={{ backgroundColor: activeTheme.swatch }}
        />
      </button>

      {/* Floating Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 p-2 rounded-2xl bg-[#0e1322]/95 backdrop-blur-xl border border-indigo-500/30 shadow-[0_12px_40px_rgba(0,0,0,0.6)] z-50 text-white animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1.5 border-b border-slate-700/40 flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-xs font-bold text-slate-200">Dashboard Theme</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">5 Options</span>
          </div>

          <div className="flex flex-col gap-1">
            {Object.values(THEMES).map((th) => {
              const isSelected = th.id === currentTheme;
              return (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => {
                    onSelectTheme(th.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/25 border border-indigo-500/50 text-white shadow-sm'
                      : 'hover:bg-slate-800/60 border border-transparent text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-5 h-5 rounded-lg border border-white/20 shadow-inner shrink-0"
                      style={{ backgroundColor: th.swatch }}
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold leading-tight">{th.name}</span>
                        {th.tag && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 font-mono">
                            {th.tag}
                          </span>
                        )}
                      </div>
                      <span className="text-[10.5px] text-slate-400 font-mono">{th.subtitle}</span>
                    </div>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-indigo-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
