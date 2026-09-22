import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Link, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Database, 
  Layers, 
  Globe2, 
  Activity, 
  Server,
  Sparkles
} from 'lucide-react';
import { oceanDataService } from '../services/oceanDataService';

export default function DataIngestionModal({ isOpen, onClose, onIngestSuccess }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'opendap'
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ingestResult, setIngestResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [opendapUrl, setOpendapUrl] = useState('https://tds.incois.gov.in/thredds/dodsC/INCOIS/MODELS/ROMS/INDIAN_OCEAN/FORECAST/2026/run.nc');

  if (!isOpen) return null;

  const handleFileProcess = async (file) => {
    if (!file) return;
    setIsLoading(true);
    setErrorMessage('');
    setIngestResult(null);

    try {
      const res = await oceanDataService.ingestFile(file);
      setIngestResult(res);
      if (onIngestSuccess) {
        onIngestSuccess(res);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error parsing file format');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpendapConnect = async (e) => {
    e.preventDefault();
    if (!opendapUrl.trim()) return;
    setIsLoading(true);
    setErrorMessage('');
    setIngestResult(null);

    try {
      const res = await oceanDataService.ingestOpendap(opendapUrl.trim());
      setIngestResult(res);
      if (onIngestSuccess) {
        onIngestSuccess(res);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Could not connect to remote OPeNDAP catalog');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b1325] border border-cyan-500/30 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#070e1c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Multi-Format Ocean Data Ingestion
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                  CF-1.8 & OGC WMS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Automated parser for NetCDF-4, CSV/ASCII profiles, and remote OPeNDAP / ERDDAP streams
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ingestion Mode Tabs */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-800/80 text-xs">
          <button
            type="button"
            onClick={() => { setActiveTab('upload'); setIngestResult(null); }}
            className={`pb-2.5 px-3 font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload File (.nc / .csv / .txt)</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('opendap'); setIngestResult(null); }}
            className={`pb-2.5 px-3 font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'opendap'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Remote OPeNDAP / TDS Stream</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col gap-4">
          {activeTab === 'upload' ? (
            <div>
              {/* Drag and Drop Box */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const f = e.dataTransfer.files[0];
                  if (f) handleFileProcess(f);
                }}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-cyan-400 bg-cyan-950/30 shadow-lg shadow-cyan-500/20'
                    : 'border-slate-700/80 bg-slate-900/40 hover:border-cyan-500/50 hover:bg-slate-900/70'
                }`}
                onClick={() => document.getElementById('file-upload-input')?.click()}
              >
                <input
                  id="file-upload-input"
                  type="file"
                  accept=".nc,.nc4,.csv,.txt,.dat"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileProcess(f);
                  }}
                />
                <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-300 mb-3 shadow-inner">
                  <UploadCloud className="w-6 h-6 animate-bounce" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">
                  Drag & Drop Ocean Dataset Here
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mb-3">
                  Supports NetCDF-4 binary grids (<code className="text-cyan-300">.nc</code>), WMO Argo profile tables (<code className="text-cyan-300">.csv</code>), or CTD casts (<code className="text-cyan-300">.txt</code>).
                </p>
                <span className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-500/30 transition-all">
                  Browse from Computer
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleOpendapConnect} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5 text-cyan-400" />
                  Remote OPeNDAP / THREDDS / ERDDAP Endpoint URL:
                </label>
                <input
                  type="url"
                  value={opendapUrl}
                  onChange={(e) => setOpendapUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-200 focus:outline-none focus:border-cyan-400"
                  placeholder="https://tds.incois.gov.in/thredds/dodsC/..."
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Automatically queries remote headers and streams variable grids without client downloads.
                </span>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5" />}
                  <span>Connect & Parse Stream</span>
                </button>
              </div>
            </form>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl flex items-center gap-3 text-cyan-300 text-xs font-mono animate-pulse">
              <Activity className="w-4 h-4 animate-spin shrink-0" />
              <span>Parsing CF-1.8 metadata dimensions and coordinate bounding boxes...</span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl flex items-center gap-2 text-rose-300 text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Ingest Result Card */}
          {ingestResult && (
            <div className="p-4 bg-[#071325] border border-emerald-500/40 rounded-xl flex flex-col gap-2.5 animate-in fade-in duration-300 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {ingestResult.format_detected}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  CF-1.8 Compliant
                </span>
              </div>

              <p className="text-xs text-slate-200">{ingestResult.message}</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-mono">
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[9px]">Variables</span>
                  <span className="text-sky-300 font-bold">{ingestResult.variables_mapped?.length || 5} Extracted</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[9px]">Time Slices</span>
                  <span className="text-amber-300 font-bold">{ingestResult.time_steps_count} Steps</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[9px]">Lat Bounds</span>
                  <span className="text-teal-300 font-bold">{ingestResult.spatial_bounds?.lat_min}°N – {ingestResult.spatial_bounds?.lat_max}°N</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[9px]">Lon Bounds</span>
                  <span className="text-teal-300 font-bold">{ingestResult.spatial_bounds?.lon_min}°E – {ingestResult.spatial_bounds?.lon_max}°E</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-slate-400 font-mono">Mapped Parameters:</span>
                {ingestResult.variables_mapped?.map((v, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                    {v}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#070e1c] flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[10px]">Ministry of Earth Sciences • INCOIS Data Standards</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
