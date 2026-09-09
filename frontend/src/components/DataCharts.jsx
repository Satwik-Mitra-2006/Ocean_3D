import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  Sparkles,
  TrendingDown
} from 'lucide-react';
import { getStationAccuracyMetrics } from '../data/mockOceanData';

export default function DataCharts({
  verticalProfile = [],
  depthProfileData = [],
  timeSeriesData = [],
  selectedStation,
  isLiveCopernicus = true,
  dataSource = 'model'
}) {
  const [activeTab, setActiveTab] = useState('vertical-profile'); // 'vertical-profile' | 'time-series' | 'current-vectors' | 'parameter-comparison'

  // Dynamic station-specific accuracy metrics (RMSE, MAE, R²)
  const stnCode = selectedStation?.code || (selectedStation?.name?.includes('CB01') ? 'CB01' : 'BD08');
  const metrics = useMemo(() => getStationAccuracyMetrics(stnCode), [stnCode]);

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

  // Depth milestones for Y-axis
  const depthTicks = [0, 200, 500, 1000, 2000];

  // Helper to map depth (0 to 2000) to SVG Y coordinate (reversed: 0 at top, 2000 at bottom)
  const mapDepthToY = (depth, height, topMargin = 20, bottomMargin = 25) => {
    const plotH = height - topMargin - bottomMargin;
    // Logarithmic/compressed scale for depth visualization (or piecewise)
    // 0-200m gets 30% of height, 200-1000 gets 40%, 1000-2000 gets 30%
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
      <div className="w-full bg-[#0b1325]/90 rounded-2xl p-4 border border-slate-800/80 shadow-md backdrop-blur-md flex flex-col">
        
        {/* Navigation Tabs Header */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 border-b border-slate-800/80 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('vertical-profile')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'vertical-profile'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 font-bold'
                : 'bg-[#080e1d] text-slate-400 hover:text-white border border-slate-800/80'
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
                : 'bg-[#080e1d] text-slate-400 hover:text-white border border-slate-800/80'
            }`}
          >
            Time Series
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('current-vectors')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'current-vectors'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 font-bold'
                : 'bg-[#080e1d] text-slate-400 hover:text-white border border-slate-800/80'
            }`}
          >
            Current Vectors
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('parameter-comparison')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'parameter-comparison'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 font-bold'
                : 'bg-[#080e1d] text-slate-400 hover:text-white border border-slate-800/80'
            }`}
          >
            Regional Comparison
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('basin-comparison')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'basin-comparison'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 font-bold'
                : 'bg-[#080e1d] text-slate-400 hover:text-white border border-slate-800/80'
            }`}
          >
            Dual Basin Comparison (AS vs BoB)
          </button>
        </div>

        {/* 3 SIDE-BY-SIDE VERTICAL PROFILE CHARTS */}
        {activeTab === 'vertical-profile' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
            
            {/* Chart 1: Temperature vs Depth */}
            <div className="bg-[#070d19]/80 rounded-xl p-2.5 border border-slate-800/70 flex flex-col">
              <div className="text-center text-xs font-bold text-slate-200 mb-1">
                Temperature vs Depth
              </div>
              <div className="relative w-full h-52">
                <svg className="w-full h-full" viewBox="0 0 240 180">
                  {/* Grid Lines */}
                  {depthTicks.map(d => {
                    const y = mapDepthToY(d, 180);
                    return (
                      <g key={d}>
                        <line x1="35" y1={y} x2="225" y2={y} stroke="#1e293b" strokeDasharray="2 2" strokeWidth="1" />
                        <text x="30" y={y + 3} textAnchor="end" fontSize="9" fill="#64748b" fontFamily="monospace">
                          {d}
                        </text>
                      </g>
                    );
                  })}

                  {/* X Axis ticks: 0, 10, 20, 30 */}
                  {[0, 10, 20, 30].map(v => {
                    const x = mapValueToX(v, 0, 32, 240);
                    return (
                      <g key={v}>
                        <line x1={x} y1="20" x2={x} y2="155" stroke="#1e293b" strokeDasharray="2 2" strokeWidth="1" />
                        <text x={x} y="170" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">
                          {v}
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
                    fill="#64748b"
                    textAnchor="middle"
                    fontFamily="sans-serif"
                  >
                    Depth (m)
                  </text>

                  {/* Data Line and Points */}
                  {(() => {
                    const coords = profilePoints.map(p => ({
                      x: mapValueToX(p.temperature, 0, 32, 240),
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
                </svg>
              </div>
              <div className="text-center text-[10px] text-slate-400 font-sans mt-0.5">
                Temperature (°C)
              </div>
            </div>

            {/* Chart 2: Salinity vs Depth */}
            <div className="bg-[#070d19]/80 rounded-xl p-2.5 border border-slate-800/70 flex flex-col">
              <div className="text-center text-xs font-bold text-slate-200 mb-1">
                Salinity vs Depth
              </div>
              <div className="relative w-full h-52">
                <svg className="w-full h-full" viewBox="0 0 240 180">
                  {/* Grid Lines */}
                  {depthTicks.map(d => {
                    const y = mapDepthToY(d, 180);
                    return (
                      <g key={d}>
                        <line x1="35" y1={y} x2="225" y2={y} stroke="#1e293b" strokeDasharray="2 2" strokeWidth="1" />
                        <text x="30" y={y + 3} textAnchor="end" fontSize="9" fill="#64748b" fontFamily="monospace">
                          {d}
                        </text>
                      </g>
                    );
                  })}

                  {/* X Axis ticks: 33, 34, 35, 36 */}
                  {[33, 34, 35, 36].map(v => {
                    const x = mapValueToX(v, 32.5, 36.5, 240);
                    return (
                      <g key={v}>
                        <line x1={x} y1="20" x2={x} y2="155" stroke="#1e293b" strokeDasharray="2 2" strokeWidth="1" />
                        <text x={x} y="170" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">
                          {v}
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
                    fill="#64748b"
                    textAnchor="middle"
                    fontFamily="sans-serif"
                  >
                    Depth (m)
                  </text>

                  {/* Data Line and Points */}
                  {(() => {
                    const coords = profilePoints.map(p => ({
                      x: mapValueToX(p.salinity, 32.5, 36.5, 240),
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
                </svg>
              </div>
              <div className="text-center text-[10px] text-slate-400 font-sans mt-0.5">
                Salinity (PSU)
              </div>
            </div>

            {/* Chart 3: Current Speed vs Depth */}
            <div className="bg-[#070d19]/80 rounded-xl p-2.5 border border-slate-800/70 flex flex-col">
              <div className="text-center text-xs font-bold text-slate-200 mb-1">
                Current Speed vs Depth
              </div>
              <div className="relative w-full h-52">
                <svg className="w-full h-full" viewBox="0 0 240 180">
                  {/* Grid Lines */}
                  {depthTicks.map(d => {
                    const y = mapDepthToY(d, 180);
                    return (
                      <g key={d}>
                        <line x1="35" y1={y} x2="225" y2={y} stroke="#1e293b" strokeDasharray="2 2" strokeWidth="1" />
                        <text x="30" y={y + 3} textAnchor="end" fontSize="9" fill="#64748b" fontFamily="monospace">
                          {d}
                        </text>
                      </g>
                    );
                  })}

                  {/* X Axis ticks: 0.0, 0.5, 1.0, 1.5 */}
                  {[0.0, 0.5, 1.0, 1.5].map(v => {
                    const x = mapValueToX(v, 0.0, 1.6, 240);
                    return (
                      <g key={v}>
                        <line x1={x} y1="20" x2={x} y2="155" stroke="#1e293b" strokeDasharray="2 2" strokeWidth="1" />
                        <text x={x} y="170" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">
                          {v.toFixed(1)}
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
                    fill="#64748b"
                    textAnchor="middle"
                    fontFamily="sans-serif"
                  >
                    Depth (m)
                  </text>

                  {/* Data Line and Points */}
                  {(() => {
                    const coords = profilePoints.map(p => ({
                      x: mapValueToX(p.current_speed, 0.0, 1.6, 240),
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
                </svg>
              </div>
              <div className="text-center text-[10px] text-slate-400 font-sans mt-0.5">
                Current Speed (m/s)
              </div>
            </div>

          </div>
        )}

        {/* Alternate Tab: Time Series */}
        {activeTab === 'time-series' && (
          <div className="p-4 text-center text-xs text-slate-400">
            <div className="font-semibold text-slate-200 mb-2">24-Hour Diurnal Telemetry Observation</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-left">
              {timeSeriesData.slice(0, 8).map((t, idx) => (
                <div key={idx} className="bg-[#070d19] p-2 rounded-lg border border-slate-800 text-[11px] font-mono">
                  <div className="text-sky-400 font-bold">{t.timeAmPm || `${t.time} UTC`}</div>
                  <div>Temp: {t.temperature} °C</div>
                  <div>Sal: {t.salinity} PSU</div>
                  <div>Speed: {t.currentSpeed} m/s</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alternate Tab: Current Vectors */}
        {activeTab === 'current-vectors' && (
          <div className="p-4 text-center text-xs text-slate-400">
            <div className="font-semibold text-slate-200 mb-1">Horizontal Velocity Field Decomposition</div>
            <p className="text-[11px] text-slate-400 font-mono">
              Zonal (uo) = 0.22 m/s (Eastward) • Meridional (vo) = 0.15 m/s (Northward) • Resultant = 0.32 m/s at 145° SE
            </p>
          </div>
        )}

        {/* Alternate Tab: Parameter Comparison */}
        {activeTab === 'parameter-comparison' && (
          <div className="p-4 text-center text-xs text-slate-400">
            <div className="font-semibold text-slate-200 mb-1">Multi-Sensor Cross-Correlation</div>
            <p className="text-[11px] text-slate-400 font-mono">
              Thermal coefficient dρ/dT = -0.21 kg/m³•°C • Haline contraction dρ/dS = +0.78 kg/m³•PSU
            </p>
          </div>
        )}

        {/* TAB 5: DUAL BASIN COMPARISON (ARABIAN SEA VS BAY OF BENGAL) */}
        {activeTab === 'basin-comparison' && (
          <div className="flex flex-col gap-3 pt-3">
            {/* Top Overview Badges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Arabian Sea Card */}
              <div className="bg-[#070d19]/90 rounded-xl p-3 border border-teal-500/30 flex flex-col gap-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-teal-300">
                    <span className="w-2 h-2 rounded-full bg-teal-400" />
                    <span>Arabian Sea (Western Basin)</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-teal-950 text-teal-400 border border-teal-800">
                    Evaporative Regime (E &gt; P)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">SURFACE SALINITY</span>
                    <strong className="text-teal-300 text-xs">36.4 PSU (High)</strong>
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">AVERAGE SST</span>
                    <strong className="text-white text-xs">27.4 °C</strong>
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">MIXED LAYER DEPTH</span>
                    <strong className="text-slate-200 text-xs">65 m (Deep)</strong>
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">BARRIER LAYER</span>
                    <strong className="text-amber-400 text-xs">Thin (~4 m)</strong>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  High evaporation driven by dry desert winds. Intense summer coastal upwelling along Somali and Kerala coasts brings cold nutrient-rich waters to the surface.
                </p>
              </div>

              {/* Bay of Bengal Card */}
              <div className="bg-[#070d19]/90 rounded-xl p-3 border border-amber-500/30 flex flex-col gap-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-300">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Bay of Bengal (Eastern Basin)</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-800">
                    Runoff Regime (P + R &gt; E)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">SURFACE SALINITY</span>
                    <strong className="text-amber-300 text-xs">32.2 PSU (Low)</strong>
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">AVERAGE SST</span>
                    <strong className="text-rose-400 text-xs">29.2 °C (Warm)</strong>
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">MIXED LAYER DEPTH</span>
                    <strong className="text-slate-200 text-xs">22 m (Shallow)</strong>
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">BARRIER LAYER</span>
                    <strong className="text-rose-400 text-xs">Thick (~38 m)</strong>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Enormous freshwater influx from Ganga &amp; Brahmaputra rivers forms a buoyant low-salinity surface lens, suppressing vertical mixing and fueling intense tropical cyclones.
                </p>
              </div>
            </div>

            {/* Side-by-Side SVG Thermohaline Profile Chart */}
            <div className="bg-[#070d19]/80 rounded-xl p-3 border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Comparative Vertical Stratification (0 - 2000m)</span>
                <div className="flex items-center gap-3 text-[10px] font-mono">
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-1 bg-teal-400 rounded-full" />
                    <span className="text-teal-300">Arabian Sea Salinity</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-1 bg-amber-400 rounded-full" />
                    <span className="text-amber-300">Bay of Bengal Salinity</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-1 bg-rose-400 rounded-full" />
                    <span className="text-rose-300">BoB SST (&gt;28°C)</span>
                  </div>
                </div>
              </div>

              <div className="relative w-full h-44">
                <svg className="w-full h-full" viewBox="0 0 540 160">
                  {/* Depth Y Grid */}
                  {[0, 200, 500, 1000, 2000].map(d => {
                    const y = mapDepthToY(d, 160, 15, 20);
                    return (
                      <g key={d}>
                        <line x1="45" y1={y} x2="525" y2={y} stroke="#1e293b" strokeDasharray="2 2" strokeWidth="1" />
                        <text x="38" y={y + 3} textAnchor="end" fontSize="9" fill="#64748b" fontFamily="monospace">
                          {d}m
                        </text>
                      </g>
                    );
                  })}

                  {/* Arabian Sea Salinity Curve (Teal) */}
                  <path
                    d="M 450 15 C 455 35, 440 60, 420 85 C 400 115, 380 130, 375 140"
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth="2.5"
                  />

                  {/* Bay of Bengal Salinity Curve (Amber) */}
                  <path
                    d="M 160 15 C 220 30, 360 60, 400 85 C 390 115, 378 130, 375 140"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                  />

                  {/* Bay of Bengal Temperature Curve (Rose) */}
                  <path
                    d="M 500 15 C 480 30, 380 50, 240 85 C 160 115, 120 130, 95 140"
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />

                  {/* Legend annotation */}
                  <text x="60" y="30" fontSize="9" fill="#f59e0b" fontFamily="sans-serif">
                    ← Freshwater Lens (Low Salinity &amp; High Heat)
                  </text>
                  <text x="310" y="30" fontSize="9" fill="#14b8a6" fontFamily="sans-serif">
                    High Surface Evaporation →
                  </text>
                </svg>
              </div>

              {/* Bottom Insight Takeaway */}
              <div className="bg-sky-950/40 border border-sky-500/30 rounded-lg p-2 text-[11px] text-sky-200">
                <strong>Oceanographic Science Takeaway:</strong> The Bay of Bengal's thick freshwater barrier layer acts as a thermal blanket, keeping surface temperatures consistently &gt;28.5°C and fueling rapid cyclone intensification. Conversely, the Arabian Sea experiences intense evaporative cooling and coastal upwelling, keeping it generally more resilient to convective storms.
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
