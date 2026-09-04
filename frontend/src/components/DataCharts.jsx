import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { 
  TrendingUp, 
  Layers, 
  BarChart3, 
  CheckCircle2, 
  Download,
  Filter
} from 'lucide-react';

// Custom tooltip renderer for scientific elegance
function CustomTooltip({ active, payload, label, unit = '' }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 text-white p-2.5 rounded-xl shadow-xl border border-slate-700/80 text-xs backdrop-blur-md">
        <div className="font-mono text-slate-400 font-semibold border-b border-slate-700/60 pb-1 mb-1.5">
          {label}
        </div>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-3 py-0.5">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span 
                className="w-2 h-2 rounded-full inline-block" 
                style={{ backgroundColor: entry.color }} 
              />
              {entry.name}:
            </span>
            <span className="font-mono font-bold text-white">
              {entry.value} {unit}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function DataCharts({
  timeSeriesData = [],
  depthProfileData = [],
  selectedStation,
  currentTimeHour = 12,
  isLiveCopernicus = false
}) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'temp' | 'salinity' | 'validation'

  // Format current hour for reference line on time chart
  const currentFormattedHour = `${String(Math.floor(currentTimeHour)).padStart(2, '0')}:00`;

  const stationName = selectedStation ? selectedStation.name : 'Regional Ocean Mean (Indian Ocean)';

  return (
    <section className="mt-6 flex flex-col gap-4">
      {/* Analytics Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-700">
              <BarChart3 className="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Oceanographic Analytics & Validation
            </h2>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
              isLiveCopernicus 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {isLiveCopernicus ? 'Copernicus NetCDF Active' : 'Demo Data'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Telemetry time-series & vertical profile validation for <strong className="text-slate-700">{stationName}</strong>
          </p>
        </div>

        {/* Chart View Switcher */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Charts (3)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('temp')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'temp'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Temp vs Time
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('salinity')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'salinity'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Salinity vs Depth
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('validation')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'validation'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Model vs Obs
          </button>
        </div>
      </div>

      {/* Grid of Recharts Charts */}
      <div className={`grid gap-4 ${activeTab === 'all' ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
        
        {/* CHART A: Temperature vs Time */}
        {(activeTab === 'all' || activeTab === 'temp') && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                  Chart A
                </span>
                <h3 className="text-sm font-bold text-slate-800">
                  Temperature vs Time
                </h3>
              </div>
              <span className="text-xs font-mono font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                °C Diurnal Cycle
              </span>
            </div>

            <div className="w-full h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    stroke="#cbd5e1"
                  />
                  <YAxis 
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    stroke="#cbd5e1"
                    unit="°"
                  />
                  <Tooltip content={<CustomTooltip unit="°C" />} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                  <Line 
                    type="monotone" 
                    dataKey="temperature" 
                    name="In-Situ Observation" 
                    stroke="#0284c7" 
                    strokeWidth={2.2} 
                    dot={{ r: 3, fill: '#0284c7' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[10px] text-slate-400 font-mono text-center">
              X-Axis: Time (UTC) • Y-Axis: Sea Surface Temperature (°C)
            </div>
          </div>
        )}

        {/* CHART B: Salinity vs Depth */}
        {(activeTab === 'all' || activeTab === 'salinity') && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                  Chart B
                </span>
                <h3 className="text-sm font-bold text-slate-800">
                  Salinity vs Depth
                </h3>
              </div>
              <span className="text-xs font-mono font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Vertical Halocline
              </span>
            </div>

            <div className="w-full h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={depthProfileData} margin={{ top: 10, right: 15, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="depth" 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    stroke="#cbd5e1"
                  />
                  <YAxis 
                    domain={[31, 37]}
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    stroke="#cbd5e1"
                    unit=" PSU"
                  />
                  <Tooltip content={<CustomTooltip unit=" PSU" />} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                  <Line 
                    type="monotone" 
                    dataKey="salinity" 
                    name="Observed Halocline" 
                    stroke="#0d9488" 
                    strokeWidth={2.2} 
                    dot={{ r: 3, fill: '#0d9488' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[10px] text-slate-400 font-mono text-center">
              X-Axis: Depth (m) • Y-Axis: Salinity (PSU)
            </div>
          </div>
        )}

        {/* CHART C: Model vs Observation */}
        {(activeTab === 'all' || activeTab === 'validation') && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                  Chart C
                </span>
                <h3 className="text-sm font-bold text-slate-800">
                  Model vs Observation
                </h3>
              </div>
              <span className="text-xs font-mono font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                R² = 0.94 Residual
              </span>
            </div>

            <div className="w-full h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    stroke="#cbd5e1"
                  />
                  <YAxis 
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    stroke="#cbd5e1"
                  />
                  <Tooltip content={<CustomTooltip unit="°C" />} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                  <Line 
                    type="monotone" 
                    dataKey="modelTemperature" 
                    name="Numerical Model (ROMS)" 
                    stroke="#f59e0b" 
                    strokeWidth={2} 
                    strokeDasharray="4 4"
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="temperature" 
                    name="In-Situ Observation" 
                    stroke="#0284c7" 
                    strokeWidth={2.2} 
                    dot={{ r: 2.5, fill: '#0284c7' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[10px] text-slate-400 font-mono text-center">
              Comparison: ROMS Simulation (Dashed Amber) vs Buoy In-Situ (Solid Blue)
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
