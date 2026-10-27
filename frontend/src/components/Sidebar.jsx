import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  MapPin,
  ShieldAlert,
  BrainCircuit,
  Database,
  BookOpen,
  ChevronRight
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
  { id: 'analytics', label: 'Crime Analytics', icon: BarChart3 },
  { id: 'hotspots', label: 'Hotspot Explorer', icon: MapPin },
  { id: 'prediction', label: 'Risk Prediction', icon: ShieldAlert },
  { id: 'evaluation', label: 'Model Evaluation', icon: BrainCircuit },
  { id: 'pipeline', label: 'Data Pipeline', icon: Database },
  { id: 'viva', label: 'Viva & Architecture', icon: BookOpen },
];

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
      <div className="p-4 space-y-6">
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Navigation
          </p>
          <nav className="space-y-1 mt-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-sky-600/20 text-sky-400 border border-sky-500/30 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-sky-400" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Project Context Box */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
          <p className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
            <span>Stack Overview</span>
            <span className="text-[10px] text-sky-400 font-mono">B.Tech Mini-Project</span>
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-medium">Hadoop HDFS</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-medium">Apache Spark</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-medium">K-Means</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-medium">Random Forest</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-medium">FastAPI</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-medium">React + Vite</span>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-800/80">
        <div className="text-[11px] text-slate-400 text-center">
          Department of Computer Engineering<br/>
          <span className="text-slate-400 font-medium">Big Data Analytics Academic Review</span>
        </div>
      </div>
    </aside>
  );
}
