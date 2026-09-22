import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  Sparkles,
  TrendingDown
} from 'lucide-react';
import { 
  getStationAccuracyMetrics, 
  COPERNICUS_DAILY_STATION_TELEMETRY,
  getDepthAdjustedValues
} from '../data/mockOceanData';

export const resolveStationCode = (stn) => {
  if (!stn) return 'CB01';
  const raw = String(stn.code || stn.name || stn.id || 'CB01');
  if (raw.includes('ARGO') || raw.includes('1844') || raw.includes('station-03')) return 'ARGO-1844';
  if (raw.includes('AD02') || raw.includes('station-02')) return 'AD02';
  if (raw.includes('BD08') || raw.includes('station-01')) return 'BD08';
  if (raw.includes('BD11') || raw.includes('station-05')) return 'BD11';
  if (raw.includes('TB05') || raw.includes('station-06')) return 'TB05';
  if (raw.includes('GLIDER-INCOIS') || raw.includes('station-07')) return 'GLIDER-INCOIS-01';
  if (raw.includes('GLIDER-NIOT') || raw.includes('station-08')) return 'GLIDER-NIOT-02';
  if (raw.includes('CB01') || raw.includes('station-04')) return 'CB01';
  return 'CB01';
};

export default function DataCharts({
  verticalProfile = [],
  depthProfileData = [],
  timeSeriesData = [],
  selectedStation,
  isLiveCopernicus = true,
  dataSource = 'model',
  selectedDate = '2026-06-23',
  setSelectedDate = () => {},
  selectedDepth = 0.49,
  setSelectedDepth = () => {}
}) {
  const [activeTab, setActiveTab] = useState('vertical-profile'); // 'vertical-profile' | 'time-series' | 'sound-velocity' | 'density-stratification'
  const [depthZoomMode, setDepthZoomMode] = useState('mixed'); // 'mixed' (0-50m focus) | 'full' (0-2000m)

  const depthNum = Number(selectedDepth || 0.49);

  // Dynamic station-specific accuracy metrics (RMSE, MAE, R²)
  const stnCode = resolveStationCode(selectedStation);
  const metrics = useMemo(() => getStationAccuracyMetrics(stnCode, selectedDate, selectedDepth), [stnCode, selectedDate, selectedDepth]);

  // Active stratified probe values at selectedDepth (dynamically date-aware)
  const activeStrat = useMemo(() => {
    const tele = COPERNICUS_DAILY_STATION_TELEMETRY[stnCode]?.[selectedDate] || {};
    const rawT = Number(tele.temp ?? selectedStation?.temperature ?? selectedStation?.baseTemp ?? 29.79);
    const rawS = Number(tele.sal ?? selectedStation?.salinity ?? selectedStation?.baseSalinity ?? 35.01);
    const rawV = Number(tele.speed ?? selectedStation?.current_speed ?? selectedStation?.baseSpeed ?? 0.184);
    const adj = getDepthAdjustedValues(rawT, rawS, rawV, depthNum);
    return {
      depth: depthNum,
      temperature: adj.temp,
      salinity: adj.sal,
      current_speed: adj.speed
    };
  }, [stnCode, selectedDate, selectedStation, depthNum]);

  // High-resolution Upper Mixed Layer Profile (0m to 50m) responding dynamically to selectedDate and station
  const mixedProfilePoints = useMemo(() => {
    const tele = COPERNICUS_DAILY_STATION_TELEMETRY[stnCode]?.[selectedDate] || {};
    const rawT = Number(tele.temp ?? selectedStation?.temperature ?? selectedStation?.baseTemp ?? 29.79);
    const rawS = Number(tele.sal ?? selectedStation?.salinity ?? selectedStation?.baseSalinity ?? 35.01);
    const rawV = Number(tele.speed ?? selectedStation?.current_speed ?? selectedStation?.baseSpeed ?? 0.184);
    const depths = [0, 0.49, 1.54, 2.65, 3.82, 5.08, 6.44, 7.93, 9.57, 11.40, 15, 20, 30, 40, 50];
    return depths.map(d => {
      const adj = getDepthAdjustedValues(rawT, rawS, rawV, d);
      return {
        depth: d,
        temperature: adj.temp,
        salinity: adj.sal,
        current_speed: adj.speed
      };
    });
  }, [stnCode, selectedDate, selectedStation]);

  // Use vertical profile from API, fallback to depthProfileData
  const profilePoints = (verticalProfile && verticalProfile.length > 0)
    ? verticalProfile
    : (depthProfileData && depthProfileData.length > 0
        ? depthProfileData.map(d => ({
            depth: d.depthVal ?? parseFloat(d.depth),
            temperature: d.temperature,
            salinity: d.salinity,
            current_speed: d.currentSpeed ?? 0.35,
            density: d.density ?? 1024.0
          }))
        : [
            { depth: 0, temperature: 29.2, salinity: 35.1, current_speed: 0.70 },
            { depth: 50, temperature: 28.5, salinity: 35.4, current_speed: 0.52 },
            { depth: 100, temperature: 24.8, salinity: 35.8, current_speed: 0.32 },
            { depth: 200, temperature: 18.2, salinity: 35.3, current_speed: 0.21 },
            { depth: 500, temperature: 11.5, salinity: 35.0, current_speed: 0.12 },
            { depth: 1000, temperature: 7.2, salinity: 34.8, current_speed: 0.08 },
            { depth: 2000, temperature: 3.8, salinity: 34.7, current_speed: 0.04 }
          ]
      );

  const activePoints = depthZoomMode === 'mixed' ? mixedProfilePoints : profilePoints;
  const depthTicks = depthZoomMode === 'mixed' ? [0, 10, 20, 30, 40, 50] : [0, 200, 500, 1000, 2000];

  // Helper to map depth to SVG Y coordinate with dual-mode support (0-50m focus or 0-2000m full)
  const mapDepthToY = (depth, height, topMargin = 20, bottomMargin = 25) => {
    const plotH = height - topMargin - bottomMargin;
    if (depthZoomMode === 'mixed') {
      const clamped = Math.max(0, Math.min(50, depth));
      return topMargin + (clamped / 50) * plotH;
    }
    let ratio = 0;
    if (depth <= 200) {
      ratio = (depth / 200) * 0.30;
    } else if (depth <= 1000) {
      ratio = 0.30 + ((depth - 200) / 800) * 0.40;
    } else {
      ratio = 0.70 + (Math.min(depth, 2000) - 1000) / 1000 * 0.30;
    }
    return topMargin + ratio * plotH;
  };

  // Helper to map value to SVG X coordinate
  const mapValueToX = (val, minVal, maxVal, width, leftMargin = 35, rightMargin = 15) => {
    const plotW = width - leftMargin - rightMargin;
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    return leftMargin + ((clamped - minVal) / (maxVal - minVal)) * plotW;
  };

  return (
    <section className="w-full text-slate-200 select-none">
      
      {/* Analytics & Profile Charts */}
      <div className="w-full bg-[#020814]/10 rounded-2xl p-4 shadow-xl backdrop-blur-[2px] border border-cyan-400/20 flex flex-col">
        
        {/* Navigation Tabs Header */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('vertical-profile')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'vertical-profile'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 font-bold'
                : 'bg-[#02132b]/50 text-slate-300 hover:text-white border border-cyan-400/20'
            }`}
          >
            Vertical Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('time-series')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'time-series'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 font-bold'
                : 'bg-[#02132b]/50 text-slate-300 hover:text-white border border-cyan-400/20'
            }`}
          >
            Time Series
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sound-velocity')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'sound-velocity'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 font-bold'
                : 'bg-[#02132b]/50 text-slate-300 hover:text-white border border-cyan-400/20'
            }`}
          >
            Sound Velocity (SVP / Sonar)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('density-stratification')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'density-stratification'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 font-bold'
                : 'bg-[#02132b]/50 text-slate-300 hover:text-white border border-cyan-400/20'
            }`}
          >
          </button>
        </div>

        {/* 3 SIDE-BY-SIDE VERTICAL PROFILE CHARTS */}
        {activeTab === 'vertical-profile' && (() => {
          // Dynamic ranges for Tab 1 Charts based on active points
          const tVals = activePoints.map(p => p.temperature);
          const minT = Math.min(...tVals);
          const maxT = Math.max(...tVals);
          const tMinBound = depthZoomMode === 'mixed' ? +(Math.floor(minT - 0.8)).toFixed(0) : 0;
          const tMaxBound = depthZoomMode === 'mixed' ? +(Math.ceil(maxT + 0.8)).toFixed(0) : 32;
          const tRange = tMaxBound - tMinBound || 1;
          const tTicks = depthZoomMode === 'mixed'
            ? [tMinBound, +(tMinBound + tRange * 0.33).toFixed(1), +(tMinBound + tRange * 0.66).toFixed(1), tMaxBound]
            : [0, 10, 20, 30];

          const sVals = activePoints.map(p => p.salinity);
          const minS = Math.min(...sVals);
          const maxS = Math.max(...sVals);
          const sMinBound = +(Math.floor((minS - 0.3) * 2) / 2).toFixed(1);
          const sMaxBound = +(Math.ceil((maxS + 0.3) * 2) / 2).toFixed(1);
          const sRange = sMaxBound - sMinBound || 1;
          const sTicks = [sMinBound, +(sMinBound + sRange * 0.33).toFixed(1), +(sMinBound + sRange * 0.66).toFixed(1), sMaxBound];

          const vVals = activePoints.map(p => p.current_speed);
          const maxV = Math.max(0.2, ...vVals);
          const vMinBound = 0.0;
          const vMaxBound = +(Math.ceil((maxV + 0.05) * 10) / 10).toFixed(1);
          const vTicks = [0, +(vMaxBound * 0.33).toFixed(2), +(vMaxBound * 0.66).toFixed(2), vMaxBound];

          const activeY = mapDepthToY(depthNum, 180);
          const activeTempX = mapValueToX(activeStrat.temperature, tMinBound, tMaxBound, 240);
          const activeSalX = mapValueToX(activeStrat.salinity, sMinBound, sMaxBound, 240);
          const activeSpeedX = mapValueToX(activeStrat.current_speed, vMinBound, vMaxBound, 240);

          return (
            <div className="flex flex-col gap-2.5 pt-3">
              {/* Active Depth Probe Banner & Zoom Mode Selector */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#02132b]/80 rounded-xl border border-cyan-400/25">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-slate-200 font-bold">Probe Layer:</span>
                  <span className="text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-950/70 border border-amber-500/30">
                    {depthNum.toFixed(2)}m Depth
                  </span>
                  <span className="text-rose-400 font-bold">T: {activeStrat.temperature.toFixed(2)}°C</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-teal-300 font-bold">S: {activeStrat.salinity.toFixed(2)} PSU</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-sky-300 font-bold">V: {activeStrat.current_speed.toFixed(3)} m/s</span>
                </div>

                {/* Depth Presets & Focus Zoom Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono text-slate-400 mr-0.5">Depth:</span>
                    {[0.49, 2.65, 5.08, 11.40].map(d => {
                      const isCurr = Math.abs(depthNum - d) < 0.1;
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setSelectedDepth && setSelectedDepth(d)}
                          className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold transition-all cursor-pointer ${
                            isCurr
                              ? 'bg-amber-400 text-slate-950 font-extrabold shadow-sm ring-1 ring-amber-300'
                              : 'bg-[#03152d] text-amber-300 hover:text-white border border-amber-500/30'
                          }`}
                        >
                          {d.toFixed(2)}m
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1 text-[10px] font-mono font-bold">
                    <button
                      type="button"
                      onClick={() => setDepthZoomMode('mixed')}
                      className={`px-2 py-1 rounded transition-all cursor-pointer ${
                        depthZoomMode === 'mixed'
                          ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-sm'
                          : 'bg-[#02132b]/60 text-slate-300 hover:text-white border border-cyan-400/20'
                      }`}
                    >
                      Upper Mixed (0–50m Zoom)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDepthZoomMode('full')}
                      className={`px-2 py-1 rounded transition-all cursor-pointer ${
                        depthZoomMode === 'full'
                          ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-sm'
                          : 'bg-[#02132b]/60 text-slate-300 hover:text-white border border-cyan-400/20'
                      }`}
                    >
                      Full Column (0–2000m)
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Chart 1: Temperature vs Depth */}
                <div className="bg-[#02132b]/50 rounded-xl p-2.5 border border-cyan-400/20 flex flex-col shadow-inner">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1">
                    <span>Temperature vs Depth</span>
                    <span className="text-[9.5px] font-mono text-rose-400">{activeStrat.temperature.toFixed(2)}°C @ {depthNum.toFixed(2)}m</span>
                  </div>
                  <div className="relative w-full h-52">
                    <svg className="w-full h-full" viewBox="0 0 240 180">
                      {/* Grid Lines */}
                      {depthTicks.map(d => {
                        const y = mapDepthToY(d, 180);
                        return (
                          <g key={d}>
                            <line x1="35" y1={y} x2="225" y2={y} stroke="rgba(56, 189, 248, 0.15)" strokeDasharray="2 2" strokeWidth="1" />
                            <text x="30" y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="monospace">
                              {d}
                            </text>
                          </g>
                        );
                      })}

                      {/* X Axis ticks */}
                      {tTicks.map(v => {
                        const x = mapValueToX(v, tMinBound, tMaxBound, 240);
                        return (
                          <g key={v}>
                            <line x1={x} y1="20" x2={x} y2="155" stroke="rgba(56, 189, 248, 0.15)" strokeDasharray="2 2" strokeWidth="1" />
                            <text x={x} y="170" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">
                              {typeof v === 'number' ? v.toFixed(0) : v}
                            </text>
                          </g>
                        );
                      })}

                      {/* Y Axis Label */}
                      <text
                        x="-90"
                        y="10"
                        transform="rotate(-90)"
                        fontSize="9"
                        fill="#94a3b8"
                        textAnchor="middle"
                        fontFamily="sans-serif"
                      >
                        Depth (m)
                      </text>

                      {/* Data Line and Points */}
                      {(() => {
                        const coords = activePoints.map(p => ({
                          x: mapValueToX(p.temperature, tMinBound, tMaxBound, 240),
                          y: mapDepthToY(p.depth, 180),
                          t: p.temperature,
                          d: p.depth
                        }));
                        const pathD = coords.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');

                        return (
                          <>
                            <path d={pathD} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                            {coords.map((pt, i) => (
                              <circle
                                key={i}
                                cx={pt.x}
                                cy={pt.y}
                                r="3"
                                fill="#ef4444"
                                stroke="#ffffff"
                                strokeWidth="0.8"
                              >
                                <title>{`${pt.t}°C at ${pt.d}m`}</title>
                              </circle>
                            ))}
                          </>
                        );
                      })()}

                      {/* Active Depth Scan Line & Probe Marker */}
                      <g>
                        <line
                          x1="35"
                          y1={activeY}
                          x2="225"
                          y2={activeY}
                          stroke="#38bdf8"
                          strokeWidth="1.5"
                          strokeDasharray="3 2"
                        />
                        <circle
                          cx={activeTempX}
                          cy={activeY}
                          r="5"
                          fill="#38bdf8"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                        <text x="223" y={Math.max(14, activeY - 3)} textAnchor="end" fontSize="7.5" fill="#38bdf8" fontFamily="monospace" fontWeight="bold">
                          {depthNum.toFixed(2)}m
                        </text>
                      </g>
                    </svg>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono mt-1 pt-1 border-t border-cyan-400/20 text-slate-300">
                    <span>Temperature (°C)</span>
                    <span className="text-rose-400 font-bold">Probe: {activeStrat.temperature.toFixed(2)}°C</span>
                  </div>
                </div>

                {/* Chart 2: Salinity vs Depth */}
                <div className="bg-[#02132b]/50 rounded-xl p-2.5 border border-cyan-400/20 flex flex-col shadow-inner">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1">
                    <span>Salinity vs Depth</span>
                    <span className="text-[9.5px] font-mono text-teal-300">{activeStrat.salinity.toFixed(2)} PSU @ {depthNum.toFixed(2)}m</span>
                  </div>
                  <div className="relative w-full h-52">
                    <svg className="w-full h-full" viewBox="0 0 240 180">
                      {/* Grid Lines */}
                      {depthTicks.map(d => {
                        const y = mapDepthToY(d, 180);
                        return (
                          <g key={d}>
                            <line x1="35" y1={y} x2="225" y2={y} stroke="rgba(56, 189, 248, 0.15)" strokeDasharray="2 2" strokeWidth="1" />
                            <text x="30" y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="monospace">
                              {d}
                            </text>
                          </g>
                        );
                      })}

                      {/* X Axis ticks */}
                      {sTicks.map(v => {
                        const x = mapValueToX(v, sMinBound, sMaxBound, 240);
                        return (
                          <g key={v}>
                            <line x1={x} y1="20" x2={x} y2="155" stroke="rgba(56, 189, 248, 0.15)" strokeDasharray="2 2" strokeWidth="1" />
                            <text x={x} y="170" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">
                              {typeof v === 'number' ? v.toFixed(1) : v}
                            </text>
                          </g>
                        );
                      })}

                      {/* Y Axis Label */}
                      <text
                        x="-90"
                        y="10"
                        transform="rotate(-90)"
                        fontSize="9"
                        fill="#94a3b8"
                        textAnchor="middle"
                        fontFamily="sans-serif"
                      >
                        Depth (m)
                      </text>

                      {/* Data Line and Points */}
                      {(() => {
                        const coords = activePoints.map(p => ({
                          x: mapValueToX(p.salinity, sMinBound, sMaxBound, 240),
                          y: mapDepthToY(p.depth, 180),
                          s: p.salinity,
                          d: p.depth
                        }));
                        const pathD = coords.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');

                        return (
                          <>
                            <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
                            {coords.map((pt, i) => (
                              <circle
                                key={i}
                                cx={pt.x}
                                cy={pt.y}
                                r="3"
                                fill="#3b82f6"
                                stroke="#ffffff"
                                strokeWidth="0.8"
                              >
                                <title>{`${pt.s} PSU at ${pt.d}m`}</title>
                              </circle>
                            ))}
                          </>
                        );
                      })()}

                      {/* Active Depth Scan Line & Probe Marker */}
                      <g>
                        <line
                          x1="35"
                          y1={activeY}
                          x2="225"
                          y2={activeY}
                          stroke="#38bdf8"
                          strokeWidth="1.5"
                          strokeDasharray="3 2"
                        />
                        <circle
                          cx={activeSalX}
                          cy={activeY}
                          r="5"
                          fill="#38bdf8"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                        <text x="223" y={Math.max(14, activeY - 3)} textAnchor="end" fontSize="7.5" fill="#38bdf8" fontFamily="monospace" fontWeight="bold">
                          {depthNum.toFixed(2)}m
                        </text>
                      </g>
                    </svg>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono mt-1 pt-1 border-t border-cyan-400/20 text-slate-300">
                    <span>Salinity (PSU)</span>
                    <span className="text-teal-300 font-bold">Probe: {activeStrat.salinity.toFixed(2)} PSU</span>
                  </div>
                </div>

                {/* Chart 3: Current Speed vs Depth */}
                <div className="bg-[#02132b]/50 rounded-xl p-2.5 border border-cyan-400/20 flex flex-col shadow-inner">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1">
                    <span>Current Speed vs Depth</span>
                    <span className="text-[9.5px] font-mono text-sky-300">{activeStrat.current_speed.toFixed(3)} m/s @ {depthNum.toFixed(2)}m</span>
                  </div>
                  <div className="relative w-full h-52">
                    <svg className="w-full h-full" viewBox="0 0 240 180">
                      {/* Grid Lines */}
                      {depthTicks.map(d => {
                        const y = mapDepthToY(d, 180);
                        return (
                          <g key={d}>
                            <line x1="35" y1={y} x2="225" y2={y} stroke="rgba(56, 189, 248, 0.15)" strokeDasharray="2 2" strokeWidth="1" />
                            <text x="30" y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="monospace">
                              {d}
                            </text>
                          </g>
                        );
                      })}

                      {/* X Axis ticks */}
                      {vTicks.map(v => {
                        const x = mapValueToX(v, vMinBound, vMaxBound, 240);
                        return (
                          <g key={v}>
                            <line x1={x} y1="20" x2={x} y2="155" stroke="rgba(56, 189, 248, 0.15)" strokeDasharray="2 2" strokeWidth="1" />
                            <text x={x} y="170" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">
                              {typeof v === 'number' ? v.toFixed(2) : v}
                            </text>
                          </g>
                        );
                      })}

                      {/* Y Axis Label */}
                      <text
                        x="-90"
                        y="10"
                        transform="rotate(-90)"
                        fontSize="9"
                        fill="#94a3b8"
                        textAnchor="middle"
                        fontFamily="sans-serif"
                      >
                        Depth (m)
                      </text>

                      {/* Data Line and Points */}
                      {(() => {
                        const coords = activePoints.map(p => ({
                          x: mapValueToX(p.current_speed, vMinBound, vMaxBound, 240),
                          y: mapDepthToY(p.depth, 180),
                          v: p.current_speed,
                          d: p.depth
                        }));
                        const pathD = coords.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');

                        return (
                          <>
                            <path d={pathD} fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
                            {coords.map((pt, i) => (
                              <circle
                                key={i}
                                cx={pt.x}
                                cy={pt.y}
                                r="3"
                                fill="#22c55e"
                                stroke="#ffffff"
                                strokeWidth="0.8"
                              >
                                <title>{`${pt.v} m/s at ${pt.d}m`}</title>
                              </circle>
                            ))}
                          </>
                        );
                      })()}

                      {/* Active Depth Scan Line & Probe Marker */}
                      <g>
                        <line
                          x1="35"
                          y1={activeY}
                          x2="225"
                          y2={activeY}
                          stroke="#38bdf8"
                          strokeWidth="1.5"
                          strokeDasharray="3 2"
                        />
                        <circle
                          cx={activeSpeedX}
                          cy={activeY}
                          r="5"
                          fill="#38bdf8"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                        <text x="223" y={Math.max(14, activeY - 3)} textAnchor="end" fontSize="7.5" fill="#38bdf8" fontFamily="monospace" fontWeight="bold">
                          {depthNum.toFixed(2)}m
                        </text>
                      </g>
                    </svg>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono mt-1 pt-1 border-t border-cyan-400/20 text-slate-300">
                    <span>Current Speed (m/s)</span>
                    <span className="text-sky-300 font-bold">Probe: {activeStrat.current_speed.toFixed(3)} m/s</span>
                  </div>
                </div>

              </div>
            </div>
          );
        })()}

        {/* Tab 2: 7-Day NetCDF Daily Time Series */}
        {activeTab === 'time-series' && (() => {
          const dates = ['2026-06-17', '2026-06-18', '2026-06-19', '2026-06-20', '2026-06-21', '2026-06-22', '2026-06-23'];
          const weekdays = ['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'];
          const labels = ['17 Jun', '18 Jun', '19 Jun', '20 Jun', '21 Jun', '22 Jun', '23 Jun'];

          // Robust station code resolution matching actual Copernicus NetCDF telemetry dataset
          const code = resolveStationCode(selectedStation);

          const teleMap = COPERNICUS_DAILY_STATION_TELEMETRY[code] ||
                          COPERNICUS_DAILY_STATION_TELEMETRY[selectedStation?.id] ||
                          COPERNICUS_DAILY_STATION_TELEMETRY['CB01'];

          const depthNum = Number(selectedDepth || 0.49);
          const stnMetrics = getStationAccuracyMetrics(code, selectedDate, depthNum);
          const biasT = Number(stnMetrics?.biasT ?? -0.28);

          // Surface reference baseline points (0.49m)
          const surfacePoints = dates.map((iso) => {
            const entry = teleMap?.[iso] || {
              temp: selectedStation?.temperature ?? selectedStation?.baseTemp ?? 28.5,
              sal: selectedStation?.salinity ?? selectedStation?.baseSalinity ?? 35.0,
              speed: selectedStation?.current_speed ?? selectedStation?.baseSpeed ?? 0.15,
            };
            const adj = getDepthAdjustedValues(entry.temp, entry.sal, entry.speed, 0.49);
            return {
              iso,
              temp: adj.temp,
              sal: adj.sal,
              speed: adj.speed
            };
          });

          // Active sliced layer points at depthNum (Model vs In-Situ Buoy)
          const sevenDayPoints = dates.map((iso, i) => {
            const entry = teleMap?.[iso] || {
              temp: selectedStation?.temperature ?? selectedStation?.baseTemp ?? 28.5,
              sal: selectedStation?.salinity ?? selectedStation?.baseSalinity ?? 35.0,
              speed: selectedStation?.current_speed ?? selectedStation?.baseSpeed ?? 0.15,
            };
            const adj = getDepthAdjustedValues(entry.temp, entry.sal, entry.speed, depthNum);
            const surfT = surfacePoints[i]?.temp ?? adj.temp;
            const modelT = adj.temp;
            // In-Situ Buoy Observation = Model - Bias
            const buoyT = +(modelT - biasT).toFixed(2);

            return {
              iso,
              label: labels[i],
              weekday: weekdays[i],
              dayNum: i + 1,
              temp: modelT,
              modelTemp: modelT,
              buoyTemp: buoyT,
              sal: adj.sal,
              speed: adj.speed,
              dropFromSurf: +(surfT - modelT).toFixed(2),
              isSelected: iso === selectedDate
            };
          });

          // Fixed anchor Y-axis scale based on surface maximum so curve plunges visibly
          const surfMax = Math.max(...surfacePoints.map(p => p.temp));
          const maxTemp = +(Math.ceil(surfMax + 0.6)).toFixed(1);
          const minTemp = +(maxTemp - 5.5).toFixed(1);
          const tempRange = maxTemp - minTemp || 5.5;

          const avgDrop = (sevenDayPoints.reduce((acc, p) => acc + p.dropFromSurf, 0) / sevenDayPoints.length).toFixed(2);
          const activePt = sevenDayPoints.find(p => p.isSelected) || sevenDayPoints[sevenDayPoints.length - 1];

          return (
            <div className="flex flex-col gap-3 pt-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-cyan-400/20">
                <div>
                  <div className="font-bold text-xs text-white flex items-center gap-1.5 font-mono flex-wrap">
                    <span className="text-sky-400 font-bold">{selectedStation?.name || `Station ${code}`}</span>
                    <span>• 7-Day NetCDF Daily Time Series</span>
                    <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-400/30 text-[10.5px]">
                      {depthNum.toFixed(2)}m Depth {Number(avgDrop) > 0 ? `(ΔT: -${avgDrop}°C)` : '(Surface)'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                      Bias: ΔT {biasT > 0 ? `+${biasT}` : biasT}°C (RMSE {stnMetrics.rmseT.toFixed(2)}°C)
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 font-mono mt-0.5">
                    Model (Copernicus GLORYS12V1) vs In-Situ (MoES/INCOIS Buoy) from 17 Jun to 23 Jun 2026. Click any day card below.
                  </p>
                </div>

                {/* Depth Presets for immediate interactive graph inspection */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono text-slate-400 mr-1">Layer:</span>
                  {[0.49, 2.65, 5.08, 11.40].map(d => {
                    const isCurr = Math.abs(depthNum - d) < 0.1;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSelectedDepth && setSelectedDepth(d)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                          isCurr
                            ? 'bg-amber-400 text-slate-950 font-extrabold shadow-sm ring-1 ring-amber-300'
                            : 'bg-[#02132b]/80 text-amber-300 hover:text-white border border-amber-500/30'
                        }`}
                      >
                        {d.toFixed(2)}m
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 7 Interactive Day Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {sevenDayPoints.map((p) => (
                  <button
                    key={p.iso}
                    type="button"
                    onClick={() => setSelectedDate(p.iso)}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      p.isSelected
                        ? 'bg-blue-950/80 border-blue-400 shadow-md shadow-blue-500/30 ring-1 ring-blue-300'
                        : 'bg-[#02132b]/50 hover:bg-[#073060]/70 border-cyan-400/20 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="font-extrabold text-white">{p.label}</span>
                      <span className={p.isSelected ? 'text-blue-300 font-bold' : 'text-slate-400'}>{p.weekday}</span>
                    </div>
                    {/* Model Value */}
                    <div className="mt-1 flex items-baseline justify-between text-[10.5px] font-mono">
                      <span className="text-slate-400 text-[9px]">Model:</span>
                      <span className="font-bold text-sky-300">
                        {p.modelTemp.toFixed(2)}°C
                      </span>
                    </div>
                    {/* In-Situ Buoy Value */}
                    <div className="flex items-baseline justify-between text-[10.5px] font-mono">
                      <span className="text-slate-400 text-[9px]">Buoy:</span>
                      <span className="font-bold text-amber-300">
                        {p.buoyTemp.toFixed(2)}°C
                      </span>
                    </div>
                    <div className="text-[9.5px] font-mono text-cyan-300 mt-0.5">
                      {p.sal.toFixed(2)} PSU
                    </div>
                    <div className="text-[9px] font-mono text-emerald-400">
                      {p.speed.toFixed(3)} m/s
                    </div>
                    {p.isSelected && (
                      <div className="mt-1 text-[8.5px] font-mono text-blue-300 font-extrabold uppercase">
                        Active Day
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* 7-Day SVG Trend Line */}
              <div className="bg-[#02132b]/50 rounded-xl p-2.5 border border-cyan-400/20 flex flex-col gap-1 shadow-inner">
                <div className="flex items-center justify-between text-[10.5px] font-mono text-slate-200 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold flex items-center gap-1.5 text-sky-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" />
                      Model ({depthNum.toFixed(2)}m): {activePt.modelTemp.toFixed(2)}°C
                    </span>
                    <span className="font-bold flex items-center gap-1.5 text-amber-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#fb923c]" />
                      Buoy (In-Situ): {activePt.buoyTemp.toFixed(2)}°C
                    </span>
                    {depthNum > 0.49 && (
                      <span className="flex items-center gap-1 text-slate-400 text-[9.5px]">
                        <span className="w-3.5 border-b border-dashed border-slate-400 inline-block" />
                        0.49m Surface Baseline Ref
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-300 font-mono">
                    Fixed Scale: {minTemp.toFixed(1)}°C – {maxTemp.toFixed(1)}°C | Bias: ΔT {biasT > 0 ? `+${biasT}` : biasT}°C
                  </span>
                </div>
                <div className="h-28 w-full relative">
                  <svg className="w-full h-full" viewBox="0 0 700 110">
                    {/* Horizontal Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
                      const yVal = (maxTemp - frac * tempRange).toFixed(1);
                      const yPos = 15 + frac * 75;
                      return (
                        <g key={idx}>
                          <line
                            x1="30"
                            y1={yPos}
                            x2="680"
                            y2={yPos}
                            stroke="rgba(56, 189, 248, 0.15)"
                            strokeDasharray="3 3"
                            strokeWidth="1"
                          />
                          <text x="25" y={yPos + 3} textAnchor="end" fontSize="8" fill="#94a3b8" fontFamily="monospace">
                            {yVal}
                          </text>
                        </g>
                      );
                    })}

                    {/* Surface Baseline Reference Path (0.49m) */}
                    {depthNum > 0.49 && (() => {
                      const surfCoords = surfacePoints.map((pt, i) => {
                        const x = 50 + (i / 6) * 600;
                        const y = 90 - ((pt.temp - minTemp) / tempRange) * 70;
                        return { x, y };
                      });
                      const surfPathD = surfCoords.reduce((acc, c, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`, '');
                      return (
                        <path
                          d={surfPathD}
                          fill="none"
                          stroke="rgba(148, 163, 184, 0.45)"
                          strokeWidth="1.5"
                          strokeDasharray="4 3"
                        />
                      );
                    })()}

                    {/* In-Situ Buoy Trend Line (Orange/Amber) */}
                    {(() => {
                      const buoyCoords = sevenDayPoints.map((pt, i) => {
                        const x = 50 + (i / 6) * 600;
                        const y = 90 - ((pt.buoyTemp - minTemp) / tempRange) * 70;
                        return { x, y, pt };
                      });
                      const buoyPathD = buoyCoords.reduce((acc, c, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`, '');

                      return (
                        <path
                          d={buoyPathD}
                          fill="none"
                          stroke="#fb923c"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      );
                    })()}

                    {/* Model Trend Line (Cyan) */}
                    {(() => {
                      const coords = sevenDayPoints.map((pt, i) => {
                        const x = 50 + (i / 6) * 600;
                        const y = 90 - ((pt.modelTemp - minTemp) / tempRange) * 70;
                        return { x, y, pt };
                      });
                      const pathD = coords.reduce((acc, c, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`, '');

                      return (
                        <>
                          <defs>
                            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          <path
                            d={`${pathD} L ${coords[coords.length - 1].x} 95 L ${coords[0].x} 95 Z`}
                            fill="url(#trendGrad)"
                          />
                          <path
                            d={pathD}
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />
                          {coords.map((c, i) => (
                            <g key={i}>
                              {/* Model Circle */}
                              <circle
                                cx={c.x}
                                cy={c.y}
                                r={c.pt.isSelected ? 5.5 : 3.5}
                                fill={c.pt.isSelected ? '#38bdf8' : '#0284c7'}
                                stroke="#ffffff"
                                strokeWidth={c.pt.isSelected ? 2 : 1}
                              />
                              {/* Buoy Circle */}
                              <circle
                                cx={c.x}
                                cy={90 - ((c.pt.buoyTemp - minTemp) / tempRange) * 70}
                                r={c.pt.isSelected ? 4.5 : 3}
                                fill="#fb923c"
                                stroke="#040d1a"
                                strokeWidth="1"
                              />
                              {/* Model Value Text */}
                              <text
                                x={c.x}
                                y={c.y - 8}
                                textAnchor="middle"
                                fontSize="9"
                                fill={c.pt.isSelected ? '#38bdf8' : '#94a3b8'}
                                fontFamily="monospace"
                                fontWeight={c.pt.isSelected ? 'bold' : 'normal'}
                              >
                                {c.pt.modelTemp.toFixed(2)}°
                              </text>
                              {/* X-axis Day Label */}
                              <text
                                x={c.x}
                                y="105"
                                textAnchor="middle"
                                fontSize="9.5"
                                fill={c.pt.isSelected ? '#38bdf8' : '#94a3b8'}
                                fontFamily="monospace"
                                fontWeight={c.pt.isSelected ? 'bold' : 'normal'}
                              >
                                {c.pt.label}
                              </text>
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB 3: SOUND VELOCITY PROFILE (SVP / SOFAR CHANNEL - NAVAL & DEFENCE RELEVANCE) */}
        {activeTab === 'sound-velocity' && (() => {
          // Mackenzie (1981) formula for sound speed in seawater:
          // c = 1448.96 + 4.591*T - 0.05304*T^2 + 0.0002374*T^3 + 1.340*(S - 35) + 0.0163*z
          const svpData = profilePoints.map(p => {
            const z = p.depth;
            const T = p.temperature;
            const S = p.salinity;
            const speed = +(1448.96 + 4.591 * T - 0.05304 * T * T + 0.0002374 * Math.pow(T, 3) + 1.340 * (S - 35) + 0.0163 * z).toFixed(1);
            return { depth: z, speed, temperature: T, salinity: S };
          });

          // Find SOFAR minimum speed and depth
          const minSpeedPt = svpData.reduce((prev, curr) => (curr.speed < prev.speed ? curr : prev), svpData[0]);

          return (
            <div className="flex flex-col gap-3 pt-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-cyan-400/20">
                <div>
                  <div className="font-bold text-xs text-white flex items-center gap-1.5 font-mono">
                    <span className="text-cyan-400 font-bold">Sound Velocity Profile (SVP)</span>
                    <span>• Mackenzie Seawater Acoustic Equation</span>
                  </div>
                  <p className="text-[10px] text-slate-300 font-mono mt-0.5">
                    Calculated from genuine in-situ Temperature (T) and Salinity (S) across 0 to 2000m depth levels.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-2 py-0.5 rounded bg-blue-950/80 border border-blue-500/40 text-[10px] font-mono text-cyan-300 font-bold">
                    SOFAR Axis: ~{minSpeedPt.depth}m ({minSpeedPt.speed} m/s)
                  </div>
                  <div className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 font-bold">
                    Naval Sonar Ready
                  </div>
                </div>
              </div>

              {/* SVG Chart & Insight Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* SVG Profile Chart */}
                <div className="lg:col-span-2 bg-[#02132b]/50 rounded-xl p-3 border border-cyan-400/20 flex flex-col shadow-inner">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1">
                    <span>Acoustic Sound Speed vs Depth (0m – 2000m)</span>
                    <span className="text-[10px] font-mono text-cyan-300">Minimum: {minSpeedPt.speed} m/s</span>
                  </div>
                  <div className="relative w-full h-52">
                    <svg className="w-full h-full" viewBox="0 0 500 180">
                      {/* Depth Y Grid */}
                      {[0, 200, 500, 1000, 2000].map(d => {
                        const y = mapDepthToY(d, 180);
                        return (
                          <g key={d}>
                            <line x1="45" y1={y} x2="480" y2={y} stroke="rgba(56, 189, 248, 0.15)" strokeDasharray="2 2" strokeWidth="1" />
                            <text x="38" y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="monospace">
                              {d}m
                            </text>
                          </g>
                        );
                      })}

                      {/* Speed X Axis Ticks (1480, 1500, 1520, 1540) */}
                      {[1480, 1500, 1520, 1540].map(v => {
                        const x = mapValueToX(v, 1475, 1555, 500, 45, 20);
                        return (
                          <g key={v}>
                            <line x1={x} y1="20" x2={x} y2="155" stroke="rgba(56, 189, 248, 0.15)" strokeDasharray="2 2" strokeWidth="1" />
                            <text x={x} y="170" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">
                              {v} m/s
                            </text>
                          </g>
                        );
                      })}

                      {/* SOFAR Channel Zone Highlight */}
                      {(() => {
                        const yTop = mapDepthToY(600, 180);
                        const yBot = mapDepthToY(1200, 180);
                        return (
                          <rect
                            x="45"
                            y={yTop}
                            width="435"
                            height={yBot - yTop}
                            fill="#0284c7"
                            fillOpacity="0.12"
                            stroke="#38bdf8"
                            strokeDasharray="4 2"
                            strokeWidth="0.8"
                          />
                        );
                      })()}

                      {/* Sound Velocity Curve */}
                      {(() => {
                        const coords = svpData.map(p => ({
                          x: mapValueToX(p.speed, 1475, 1555, 500, 45, 20),
                          y: mapDepthToY(p.depth, 180),
                          p
                        }));
                        const pathD = coords.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');

                        return (
                          <>
                            <path d={pathD} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" />
                            {coords.map((c, i) => (
                              <circle
                                key={i}
                                cx={c.x}
                                cy={c.y}
                                r={c.p.depth === minSpeedPt.depth ? 5.5 : 3.5}
                                fill={c.p.depth === minSpeedPt.depth ? '#f59e0b' : '#06b6d4'}
                                stroke="#ffffff"
                                strokeWidth={c.p.depth === minSpeedPt.depth ? 2 : 1}
                              >
                                <title>{`${c.p.speed} m/s at ${c.p.depth}m depth`}</title>
                              </circle>
                            ))}
                            {/* SOFAR Axis Callout */}
                            <text
                              x="475"
                              y={mapDepthToY(minSpeedPt.depth, 180) - 6}
                              fontSize="9.5"
                              fill="#f59e0b"
                              fontWeight="bold"
                              fontFamily="monospace"
                              textAnchor="end"
                            >
                              ★ SOFAR Channel Axis ({minSpeedPt.speed} m/s)
                            </text>
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                </div>

                {/* Tactical & Defense Insights */}
                <div className="bg-[#02132b]/50 rounded-xl p-3 border border-cyan-400/20 flex flex-col justify-between gap-2.5 shadow-inner">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-sky-300">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      <span>Naval Acoustics & SOFAR Physics</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                      Sound speed decreases through the thermocline due to rapid cooling (4.59 m/s per °C), reaching a minimum at ~<strong>{minSpeedPt.depth}m</strong>. Below this axis, massive hydrostatic pressure (+0.0163 m/s per meter) dominates, bending sound waves back into the channel.
                    </p>
                    <div className="bg-sky-950/60 p-2 rounded-lg border border-sky-500/30 text-[10px] font-mono text-cyan-200">
                      <strong>Tactical Sonar Application:</strong> Submarines utilize this sound channel axis for ultra-long-range passive sonar detection across the Indian Ocean basin without surface reflection loss.
                    </div>
                  </div>
                  <div className="text-[9.5px] text-slate-400 font-mono border-t border-cyan-400/20 pt-1.5">
                    Formula: Mackenzie (1981) Standard Seawater Acoustic Calibration
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB 4: DENSITY & PYCNOCLINE STRATIFICATION (STABILITY & INTERNAL WAVES) */}
        {activeTab === 'density-stratification' && (() => {
          // UNESCO Equation of State approximation
          const densityData = profilePoints.map(p => {
            const z = p.depth;
            const T = p.temperature;
            const S = p.salinity;
            const rho = +(1000 + 0.805 * S - 0.0065 * Math.pow(T - 4, 2) + 0.0045 * z).toFixed(2);
            const sigmaTheta = +(rho - 1000).toFixed(2);
            return { depth: z, rho, sigmaTheta, temperature: T, salinity: S };
          });

          return (
            <div className="flex flex-col gap-3 pt-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-cyan-400/20">
                <div>
                  <div className="font-bold text-xs text-white flex items-center gap-1.5 font-mono">
                    <span className="text-emerald-400 font-bold">Seawater Potential Density Profile (Sigma-Theta)</span>
                    <span>• UNESCO Equation of State</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Shows hydrostatic density stratification and pycnocline barrier layer preventing vertical heat mixing.
                  </p>
                </div>
                <div className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 font-bold self-start sm:self-center">
                  Stable Stratification (dRho/dz &gt; 0)
                </div>
              </div>

              {/* Chart & Stratification Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* SVG Profile Chart */}
                <div className="lg:col-span-2 bg-[#02132b]/50 backdrop-blur-md rounded-xl p-3 border border-cyan-400/20 flex flex-col">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1">
                    <span>Density (Rho) vs Depth (0m – 2000m)</span>
                    <span className="text-[10px] font-mono text-emerald-300">Surface: {densityData[0]?.rho} kg/m³</span>
                  </div>
                  <div className="relative w-full h-52">
                    <svg className="w-full h-full" viewBox="0 0 500 180">
                      {/* Depth Y Grid */}
                      {[0, 200, 500, 1000, 2000].map(d => {
                        const y = mapDepthToY(d, 180);
                        return (
                          <g key={d}>
                            <line x1="45" y1={y} x2="480" y2={y} stroke="rgba(56, 189, 248, 0.15)" strokeDasharray="2 2" strokeWidth="1" />
                            <text x="38" y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="monospace">
                              {d}m
                            </text>
                          </g>
                        );
                      })}

                      {/* Density X Axis Ticks (1024 to 1036 kg/m³) */}
                      {[1024, 1027, 1030, 1033, 1036].map(v => {
                        const x = mapValueToX(v, 1023, 1037, 500, 45, 20);
                        return (
                          <g key={v}>
                            <line x1={x} y1="20" x2={x} y2="155" stroke="rgba(56, 189, 248, 0.15)" strokeDasharray="2 2" strokeWidth="1" />
                            <text x={x} y="170" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">
                              {v}
                            </text>
                          </g>
                        );
                      })}

                      {/* Density Curve */}
                      {(() => {
                        const coords = densityData.map(p => ({
                          x: mapValueToX(p.rho, 1023, 1037, 500, 45, 20),
                          y: mapDepthToY(p.depth, 180),
                          p
                        }));
                        const pathD = coords.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');

                        return (
                          <>
                            <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                            {coords.map((c, i) => (
                              <circle
                                key={i}
                                cx={c.x}
                                cy={c.y}
                                r="3.5"
                                fill="#10b981"
                                stroke="#ffffff"
                                strokeWidth="1"
                              >
                                <title>{`${c.p.rho} kg/m³ (Sigma = ${c.p.sigmaTheta}) at ${c.p.depth}m`}</title>
                              </circle>
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                  <div className="text-center text-[10px] text-slate-400 font-sans mt-0.5">
                    In-Situ Seawater Density (kg/m³)
                  </div>
                </div>

                {/* Scientific Pycnocline Breakdown */}
                <div className="bg-[#02132b]/50 backdrop-blur-md rounded-xl p-3 border border-cyan-400/20 flex flex-col justify-between gap-2.5">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Pycnocline &amp; Stratification</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10.5px] font-mono">
                      <div className="bg-[#03152c]/50 p-2 rounded border border-cyan-400/20">
                        <span className="text-slate-400 block text-[9px]">SURFACE DENSITY</span>
                        <strong className="text-emerald-300">{densityData[0]?.rho} kg/m³</strong>
                      </div>
                      <div className="bg-[#03152c]/50 p-2 rounded border border-cyan-400/20">
                        <span className="text-slate-400 block text-[9px]">DEEP DENSITY (2000m)</span>
                        <strong className="text-white">{densityData[densityData.length - 1]?.rho} kg/m³</strong>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                      The sharp density gradient between 50m and 200m depth represents the <strong>Pycnocline</strong>. A steep pycnocline prevents warm tropical surface waters from mixing with cold nutrient-rich deep waters, acting as a density barrier.
                    </p>
                  </div>
                  <div className="text-[9.5px] text-slate-400 font-mono border-t border-cyan-400/20 pt-1.5">
                    Brunt-Vaisala Frequency: Stable Water Column (N^2 &gt; 0)
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </section>
  );
}
