import React, { useState } from 'react';
import { 
  X, 
  Database, 
  Server, 
  CheckCircle2, 
  Layers, 
  FileCode, 
  ExternalLink,
  Code,
  RefreshCw,
  Clock,
  Compass,
  Layers as LayersIcon
} from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, backendHealth, onRefresh }) {
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const isLive = Boolean(backendHealth?.dataset_available);
  const metadata = backendHealth?.metadata;

  const handleTestConnection = async () => {
    setIsTesting(true);
    if (onRefresh) {
      await onRefresh();
    }
    setTimeout(() => setIsTesting(false), 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isLive ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'}`}>
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Ocean3D Platform & Backend Architecture
              </h3>
              <p className="text-xs text-slate-500">
                FastAPI, Copernicus NetCDF-4 & In-Situ Ocean Pipeline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4 text-xs">
          {/* Backend Status Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Database className="h-4 w-4 text-sky-600" />
                FastAPI Server Connection
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                isLive 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {isLive ? '● COPERNICUS NETCDF MOUNTED' : '○ CLIENT DEMO MODE'}
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              FastAPI backend running on <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[11px] text-slate-800">http://127.0.0.1:8000</code>.
              Connected endpoints: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[11px] text-slate-800">/api/health</code>, <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[11px] text-slate-800">/api/ocean/grid</code>, <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[11px] text-slate-800">/api/stations</code>.
            </p>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <RefreshCw className={`h-3 w-3 text-sky-600 ${isTesting ? 'animate-spin' : ''}`} />
                <span>Test API Health</span>
              </button>
              <span className="text-[11px] font-mono text-slate-500">
                Status: {backendHealth?.status || 'Unknown'}
              </span>
            </div>
          </div>

          {/* Copernicus Marine Real NetCDF Dataset Info */}
          {metadata && (
            <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200/80">
              <h4 className="font-bold text-teal-900 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
                Mounted Copernicus Reanalysis Dataset
              </h4>
              <div className="font-mono text-[11px] text-slate-700 space-y-1.5 bg-white p-3 rounded-lg border border-teal-200/60">
                <div className="flex justify-between">
                  <span className="text-slate-400">Dataset ID:</span>
                  <span className="text-teal-800 font-bold">{metadata.dataset_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Variables:</span>
                  <span className="text-slate-800 font-semibold">{metadata.variables?.join(', ')}</span>
                </div>
                {metadata.time_range && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Time Bounds:</span>
                    <span className="text-slate-800 font-semibold">
                      {metadata.time_range.start?.split('T')[0]} → {metadata.time_range.end?.split('T')[0]}
                    </span>
                  </div>
                )}
                {metadata.depth_range && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Depth Span:</span>
                    <span className="text-slate-800 font-semibold">
                      {metadata.depth_range.min}m to {metadata.depth_range.max}m
                    </span>
                  </div>
                )}
                {metadata.spatial_bounds && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Spatial Domain:</span>
                    <span className="text-slate-800 font-semibold">
                      Lat {metadata.spatial_bounds.lat_min}°-{metadata.spatial_bounds.lat_max}°N • Lon {metadata.spatial_bounds.lon_min}°-{metadata.spatial_bounds.lon_max}°E
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* End-to-End Scientific Architecture */}
          <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-100">
            <h4 className="font-bold text-sky-900 mb-2 flex items-center gap-1.5">
              <FileCode className="h-4 w-4 text-sky-700" />
              End-to-End Ocean Pipeline Architecture
            </h4>
            <div className="font-mono text-[11px] text-slate-700 space-y-1 bg-white p-3 rounded-lg border border-sky-200/60">
              <div className="text-sky-700 font-bold">React 19 + Three.js / R3F (3D Indian Ocean Globe)</div>
              <div className="text-slate-400 pl-4">↓ HTTP REST API (/api/ocean/grid, /api/stations)</div>
              <div className="text-slate-800 font-semibold pl-4">Python FastAPI Server (Uvicorn Async)</div>
              <div className="text-slate-400 pl-8">↓ xarray / NumPy / netCDF4 Engine</div>
              <div className="text-teal-700 font-semibold pl-8">Copernicus Marine Reanalysis (.nc file in backend/data)</div>
              <div className="text-emerald-700 font-semibold pl-8">+ INCOIS In-Situ Observation Telemetry</div>
            </div>
          </div>

          {/* Hackathon Metadata */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span>Project: Smart India Hackathon — Ocean3D</span>
            <span className="font-mono">React 19 • Three.js • FastAPI</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
