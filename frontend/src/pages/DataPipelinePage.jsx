import React, { useState, useEffect } from 'react';
import {
  Database,
  Server,
  Play,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Terminal,
  Layers,
  Sparkles
} from 'lucide-react';
import { fetchPipelineStatus, fetchDatasetInfo, triggerPipeline } from '../services/api';

export default function DataPipelinePage() {
  const [status, setStatus] = useState(null);
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [kClusters, setKClusters] = useState(12);

  // Poll status periodically while running
  useEffect(() => {
    let interval = null;

    async function loadData() {
      try {
        const [st, dt] = await Promise.all([
          fetchPipelineStatus(),
          fetchDatasetInfo()
        ]);
        setStatus(st);
        setDatasetInfo(dt);

        if (st.status === 'running') {
          interval = setInterval(async () => {
            const updated = await fetchPipelineStatus();
            setStatus(updated);
            if (updated.status !== 'running') {
              clearInterval(interval);
              const refreshedDt = await fetchDatasetInfo();
              setDatasetInfo(refreshedDt);
            }
          }, 2000);
        }
      } catch (err) {
        console.error("Failed to fetch pipeline info:", err);
      }
    }

    loadData();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const handleTriggerRun = async () => {
    try {
      setTriggering(true);
      await triggerPipeline(kClusters);
      // Immediately refresh status
      const updated = await fetchPipelineStatus();
      setStatus(updated);
    } catch (err) {
      alert(err.message || "Failed to trigger pipeline");
    } finally {
      setTriggering(false);
    }
  };

  const isRunning = status?.status === 'running';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-sky-400" />
            Big Data Processing Pipeline Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            End-to-End Orchestration: Ingestion &rarr; HDFS Storage &rarr; PySpark Data Cleaning &rarr; Feature Engineering &rarr; ML Models.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-2">
            <label className="text-xs text-slate-400">Hotspot K:</label>
            <input
              type="number"
              min="4"
              max="20"
              value={kClusters}
              onChange={(e) => setKClusters(Number(e.target.value))}
              disabled={isRunning}
              className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:outline-none"
            />
          </div>
          <button
            onClick={handleTriggerRun}
            disabled={isRunning || triggering}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white text-xs font-semibold shadow-lg shadow-sky-600/30 transition-all disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Pipeline Running...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Execute Pipeline</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pipeline Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Status */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-lg space-y-2">
          <span className="text-xs text-slate-400 font-medium">Pipeline Status</span>
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${
              isRunning ? 'bg-amber-400 animate-ping' : status?.status === 'completed' ? 'bg-emerald-400' : 'bg-slate-500'
            }`}></span>
            <span className="text-lg font-bold text-white capitalize">{status?.status || 'Idle'}</span>
          </div>
          <span className="text-[11px] text-slate-400 block truncate">
            Stage: {status?.current_stage || 'None'}
          </span>
        </div>

        {/* Storage Mode */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-lg space-y-2">
          <span className="text-xs text-slate-400 font-medium">Storage Infrastructure</span>
          <div className="flex items-center space-x-2">
            <Server className={`w-4 h-4 ${datasetInfo?.storage?.hdfs_connected ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className="text-sm font-bold text-white truncate">
              {datasetInfo?.storage?.mode?.split(':')[0] || 'Mode A'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block truncate">
            {datasetInfo?.storage?.hdfs_connected ? 'HDFS Connected' : 'Local Fallback'}
          </span>
        </div>

        {/* Cleaned Records */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-lg space-y-2">
          <span className="text-xs text-slate-400 font-medium">Cleaned Records</span>
          <div className="text-lg font-bold text-white font-mono">
            {datasetInfo?.processed_dataset?.record_count?.toLocaleString() || 0}
          </div>
          <span className="text-[11px] text-slate-400 block">
            Parquet & CSV Formats
          </span>
        </div>

        {/* Last Run Time */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-lg space-y-2">
          <span className="text-xs text-slate-400 font-medium">Last Completed Run</span>
          <div className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span className="truncate">{status?.last_run_time || 'Never'}</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-medium">
            Models & Summaries In Sync
          </span>
        </div>
      </div>

      {/* Progress Bar (If running or completed) */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-300 font-semibold">Active Execution Progress</span>
          <span className="text-sky-400 font-mono font-bold">{status?.progress_percent || 0}%</span>
        </div>
        <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isRunning ? 'bg-sky-500 animate-pulse' : 'bg-emerald-500'
            }`}
            style={{ width: `${status?.progress_percent || 0}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>Stage: {status?.current_stage}</span>
          <span>{isRunning ? 'Spark worker active' : 'Pipeline ready'}</span>
        </div>
      </div>

      {/* Dataset Quality Audit Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Dataset Quality Audit & Ingestion Metrics
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Computed directly by the DataLoader service during file inspection</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
            <span className="text-slate-400 block font-medium">Source Dataset</span>
            <div className="text-white font-mono font-bold truncate">
              {datasetInfo?.raw_dataset?.path?.split('\\').pop() || 'crime_data_sample.csv'}
            </div>
            <div className="text-slate-400 text-[11px]">
              Size: <b className="text-slate-200">{datasetInfo?.raw_dataset?.file_size_mb || 0} MB</b>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
            <span className="text-slate-400 block font-medium">Records Ingested</span>
            <div className="text-white font-mono font-bold">
              {datasetInfo?.raw_dataset?.total_records?.toLocaleString() || 0} rows
            </div>
            <div className="text-slate-400 text-[11px]">
              Columns: <b className="text-slate-200">{datasetInfo?.raw_dataset?.total_columns || 0} fields</b>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
            <span className="text-slate-400 block font-medium">Geographical Integrity</span>
            <div className="text-emerald-400 font-mono font-bold">
              {datasetInfo?.raw_dataset?.valid_coordinates_percentage || 0}% Valid
            </div>
            <div className="text-slate-400 text-[11px]">
              Zero-coordinate rows filtered out
            </div>
          </div>
        </div>
      </div>

      {/* Live Streaming Log Console */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-sky-400" />
            Pipeline Execution Log Stream
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">Live Session Buffer</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 font-mono text-xs text-slate-300 space-y-1.5 max-h-56 overflow-y-auto">
          {status?.logs?.map((line, idx) => (
            <div key={idx} className="flex items-start space-x-2">
              <span className="text-sky-500 select-none">&gt;</span>
              <span className={line.includes('ERROR') ? 'text-red-400' : line.includes('complete') ? 'text-emerald-400' : 'text-slate-300'}>
                {line}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
