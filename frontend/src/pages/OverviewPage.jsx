import React from 'react';
import {
  FileText,
  AlertTriangle,
  MapPin,
  TrendingUp,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';

export default function OverviewPage({ summary, trends, categories, riskDist }) {
  if (!summary) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Loading summary metrics...
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Crime Records',
      value: summary.total_incidents?.toLocaleString() || '0',
      subtitle: `${summary.date_range?.start} to ${summary.date_range?.end}`,
      icon: FileText,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/20'
    },
    {
      title: 'Crime Categories',
      value: summary.distinct_crime_categories || '0',
      subtitle: `${summary.distinct_specific_offenses || 0} unique granular offenses`,
      icon: Layers,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20'
    },
    {
      title: 'Identified Hotspots',
      value: summary.hotspots_identified || '0',
      subtitle: `Top: ${summary.highest_density_hotspot_area || 'Central'}`,
      icon: MapPin,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20'
    },
    {
      title: 'ML Risk Model Accuracy',
      value: summary.risk_model_accuracy || 'N/A',
      subtitle: 'Random Forest 3-class tertiles',
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20'
    }
  ];

  const topCats = categories?.top_categories?.slice(0, 7) || [];
  const monthlyData = trends?.monthly_trends || [];
  const riskCategories = riskDist?.risk_categories || [
    { category: 'Low Risk', incident_cells_count: 584 },
    { category: 'Medium Risk', incident_cells_count: 208 },
    { category: 'High Risk', incident_cells_count: 362 }
  ];

  const getRiskColor = (cat) => {
    if (cat.includes('Low')) return '#10b981';
    if (cat.includes('Medium')) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Historical Crime Intelligence & Spatio-Temporal Risk Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Processed via Apache PySpark with geographical K-Means clustering and Random Forest classification. 
            Source dataset: Kaggle LAPD Crime Data (2020 – Present).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Top Division</span>
            <span className="text-sm font-bold text-sky-400">{summary.top_area?.name}</span>
            <span className="text-[10px] text-slate-400 ml-1.5">({summary.top_area?.incident_count} crimes)</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-xl bg-slate-900/90 border ${kpi.border} shadow-lg space-y-3 transition-transform hover:-translate-y-0.5`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{kpi.title}</span>
                <div className={`p-2 rounded-lg ${kpi.bg}`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white tracking-tight">{kpi.value}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{kpi.subtitle}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Crime Incidents Over Time (Line Chart) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-400" />
                Monthly Incident Trend
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Historical incident volume aggregated by month</p>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="period_label"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  angle={-35}
                  textAnchor="end"
                />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Line
                  type="monotone"
                  dataKey="incident_count"
                  name="Incidents"
                  stroke="#0ea5e9"
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: '#0ea5e9' }}
                  activeDot={{ r: 5, fill: '#38bdf8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Historical Risk Distribution
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Spatio-temporal unit frequency tertiles</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskCategories} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="category" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                />
                <Bar dataKey="incident_cells_count" name="Time/Area Units" radius={[6, 6, 0, 0]}>
                  {riskCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getRiskColor(entry.category)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-300">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400"></span>Low Risk:</span>
              <span className="font-mono text-emerald-400 font-medium">&le; Q33 frequency</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span>Medium Risk:</span>
              <span className="font-mono text-amber-400 font-medium">Q33 - Q66 frequency</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400"></span>High Risk:</span>
              <span className="font-mono text-red-400 font-medium">&gt; Q66 frequency</span>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: Top Crime Categories & Weekday/Weekend Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 7 Crime Categories */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                Frequently Reported Crime Categories
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Normalized crime classifications across all recorded incidents</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={topCats} margin={{ top: 5, right: 30, left: 70, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis dataKey="category" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} width={110} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                />
                <Bar dataKey="incident_count" name="Incidents" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekday vs Weekend Comparison Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              Weekday vs Weekend Dynamic
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Temporal incident distribution comparison</p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Weekday (Mon - Fri)</span>
                <span className="text-sky-400 font-bold">{summary.weekday_vs_weekend?.weekday_pct}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${summary.weekday_vs_weekend?.weekday_pct || 70}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {summary.weekday_vs_weekend?.weekday_count?.toLocaleString()} incidents ({summary.weekday_vs_weekend?.daily_avg_weekday} / day)
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Weekend (Sat - Sun)</span>
                <span className="text-purple-400 font-bold">{summary.weekday_vs_weekend?.weekend_pct}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${summary.weekday_vs_weekend?.weekend_pct || 30}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {summary.weekday_vs_weekend?.weekend_count?.toLocaleString()} incidents ({summary.weekday_vs_weekend?.daily_avg_weekend} / day)
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 block">Analytical Note:</span>
            Weekend incident density exhibits higher nightlife-correlated crimes (assault, vehicular theft), while weekday crimes concentrate in commercial burglary and identity theft.
          </div>
        </div>
      </div>
    </div>
  );
}
