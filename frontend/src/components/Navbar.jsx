import React from 'react';
import { Database, RefreshCw, Server, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Navbar({ health, onRefresh, loading }) {
  const isHdfs = health?.hdfs_connected;
  const executionMode = health?.execution_mode || "Mode A: Local Development";
  const datasetAvailable = health?.dataset_status?.processed_dataset_available;

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center shadow-lg shadow-sky-600/30">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              CrimeLens <span className="text-sky-400 font-medium text-xs px-2 py-0.5 rounded bg-sky-950/80 border border-sky-800/60">BDA 2.0</span>
            </h1>
            <p className="text-xs text-slate-400">Big Data Crime Pattern Analysis & Risk Prediction</p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Storage / Cluster Mode Badge */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
          <Server className={`w-3.5 h-3.5 ${isHdfs ? "text-emerald-400" : "text-amber-400"}`} />
          <span className="text-slate-300 font-medium">{executionMode}</span>
          <span className={`w-2 h-2 rounded-full ${isHdfs ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}></span>
        </div>

        {/* Dataset Status */}
        <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
          {datasetAvailable ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300 font-medium">Dataset Ready</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-300 font-medium">Needs Processing</span>
            </>
          )}
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-sky-400" : ""}`} />
          <span className="hidden md:inline">Refresh Data</span>
        </button>
      </div>
    </header>
  );
}
