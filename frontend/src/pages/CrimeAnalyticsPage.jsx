import React, { useState, useEffect } from 'react';
import {
  Filter,
  RotateCcw,
  BarChart3,
  Calendar,
  Clock,
  MapPin,
  TrendingUp,
  Table as TableIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { fetchCrimeTrends, fetchTimeAnalysis, fetchAreaAnalysis, fetchCrimeCategories } from '../services/api';

export default function CrimeAnalyticsPage() {
  const [filters, setFilters] = useState({
    area: 'all',
    category: 'all',
    startDate: '',
    endDate: ''
  });

  const [loading, setLoading] = useState(false);
  const [trendsData, setTrendsData] = useState([]);
  const [timeData, setTimeData] = useState(null);
  const [areaData, setAreaData] = useState(null);
  const [categoriesList, setCategoriesList] = useState([]);

  // Load initial filter data
  useEffect(() => {
    async function initData() {
      try {
        setLoading(true);
        const [timeRes, areaRes, catsRes, trendsRes] = await Promise.all([
          fetchTimeAnalysis(),
          fetchAreaAnalysis(),
          fetchCrimeCategories(),
          fetchCrimeTrends()
        ]);
        setTimeData(timeRes);
        setAreaData(areaRes);
        setCategoriesList(catsRes?.top_categories || []);
        setTrendsData(trendsRes?.monthly_trends || []);
      } catch (err) {
        console.error("Error loading analytics data:", err);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, []);

  const handleApplyFilters = async () => {
    try {
      setLoading(true);
      const res = await fetchCrimeTrends(filters);
      setTrendsData(res?.monthly_trends || []);
    } catch (err) {
      console.error("Failed to filter trends:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = async () => {
    const reset = { area: 'all', category: 'all', startDate: '', endDate: '' };
    setFilters(reset);
    try {
      setLoading(true);
      const res = await fetchCrimeTrends(reset);
      setTrendsData(res?.monthly_trends || []);
    } catch (err) {
      console.error("Failed to reset trends:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Toolbar */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-semibold text-white">Interactive Crime Pattern Filters</h2>
          </div>
          <button
            onClick={handleResetFilters}
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Area Filter */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">LAPD Division / Area</label>
            <select
              value={filters.area}
              onChange={(e) => setFilters({ ...filters, area: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option value="all">All LAPD Areas</option>
              {areaData?.all_areas?.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Crime Category Filter */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Crime Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option value="all">All Crime Types</option>
              {categoriesList.map((c) => (
                <option key={c.category} value={c.category}>{c.category}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Occurred From</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Occurred To</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
              />
              <button
                onClick={handleApplyFilters}
                disabled={loading}
                className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shrink-0 shadow-lg shadow-sky-600/30 transition-all disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filtered Monthly Trend Chart */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-400" />
              Temporal Crime Volume (Filtered Criteria)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Reflects historical incident counts and Month-over-Month (MoM) growth rates
            </p>
          </div>
          <span className="text-xs text-sky-400 font-mono font-medium px-2.5 py-1 rounded-md bg-sky-950 border border-sky-800">
            {trendsData.length} active periods
          </span>
        </div>

        <div className="h-72 w-full pt-2">
          {trendsData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No crime records match the active filter combination.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendsData} margin={{ top: 10, right: 20, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="period_label" stroke="#64748b" fontSize={10} tickLine={false} angle={-35} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="incident_count"
                  name="Incidents"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#38bdf8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Grid: Day of Week & Hourly Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Day of Week */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Incidents by Day of the Week
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Relative incident count distribution across week cycle</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeData?.day_of_week_distribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="day_of_week" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                />
                <Bar dataKey="incident_count" name="Incidents" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 24-Hour Timeline */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Diurnal Hourly Incident Curve (00:00 - 23:00)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Peak hour concentration extracted from military timestamps</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeData?.hourly_distribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="hourGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="hour_label" stroke="#64748b" fontSize={10} tickLine={false} interval={2} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="incident_count" name="Incidents" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#hourGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* LAPD Areas Ranking & Cross-Tabulation Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Areas */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-400" />
              Top 10 High-Density LAPD Divisions
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Geographic areas ranked by historical volume</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={areaData?.top_areas?.slice(0, 10) || []} margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis dataKey="area_name" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} width={85} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                />
                <Bar dataKey="incident_count" name="Incidents" fill="#a855f7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cross-Tabulation Matrix */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-sky-400" />
              Area vs Crime Category Cross-Tabulation
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Top 5 geographic divisions compared across leading crime types</p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-3.5 py-2.5">Area Division</th>
                  <th className="px-3 py-2.5 text-right">Assault</th>
                  <th className="px-3 py-2.5 text-right">Burglary</th>
                  <th className="px-3 py-2.5 text-right">Veh. Theft</th>
                  <th className="px-3 py-2.5 text-right">Theft</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                {areaData?.cross_tab_area_category?.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-3.5 py-2 font-medium text-white">{row.area_name}</td>
                    <td className="px-3 py-2 text-right font-mono text-slate-300">{row["Assault & Battery"] || 0}</td>
                    <td className="px-3 py-2 text-right font-mono text-slate-300">{row["Burglary"] || 0}</td>
                    <td className="px-3 py-2 text-right font-mono text-slate-300">{row["Vehicle Theft"] || 0}</td>
                    <td className="px-3 py-2 text-right font-mono text-slate-300">{row["Theft & Larceny"] || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
            Generated directly from Spark grouped aggregations without full memory serialization.
          </div>
        </div>
      </div>
    </div>
  );
}
