import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  BrainCircuit,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { predictRisk, fetchAreaAnalysis } from '../services/api';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const DAYS = [
  { value: 0, label: 'Monday' },
  { value: 1, label: 'Tuesday' },
  { value: 2, label: 'Wednesday' },
  { value: 3, label: 'Thursday' },
  { value: 4, label: 'Friday' },
  { value: 5, label: 'Saturday' },
  { value: 6, label: 'Sunday' },
];

const PERIODS = [
  { value: 0, label: 'Night (00:00 - 05:59)', desc: 'Late night / early morning hours' },
  { value: 1, label: 'Morning (06:00 - 11:59)', desc: 'Commute and morning operational hours' },
  { value: 2, label: 'Afternoon (12:00 - 17:59)', desc: 'Commercial and afternoon business hours' },
  { value: 3, label: 'Evening (18:00 - 23:59)', desc: 'Evening and nightlife activity peak' },
];

export default function RiskPredictionPage() {
  const [areas, setAreas] = useState([]);
  const [formData, setFormData] = useState({
    area_name: 'Central',
    month: 7,
    day_of_week: 5, // Saturday
    time_period_code: 3 // Evening
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Load available areas and run initial default prediction
  useEffect(() => {
    async function loadInitial() {
      try {
        const data = await fetchAreaAnalysis();
        const initialArea = data.all_areas && data.all_areas.length > 0 ? data.all_areas[0] : 'Central';
        if (data.all_areas && data.all_areas.length > 0) {
          setAreas(data.all_areas);
          setFormData(prev => ({ ...prev, area_name: initialArea }));
        }
        // Auto-run initial prediction
        const initialPred = await predictRisk({
          area_name: initialArea,
          month: 7,
          day_of_week: 5,
          time_period_code: 3
        });
        setResult(initialPred);
      } catch (err) {
        console.error("Failed to load initial prediction:", err);
      }
    }
    loadInitial();
  }, []);

  const handlePredict = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await predictRisk({
        area_name: formData.area_name,
        month: Number(formData.month),
        day_of_week: Number(formData.day_of_week),
        time_period_code: Number(formData.time_period_code)
      });
      setResult(res);
    } catch (err) {
      setError(err.message || "Prediction request failed");
    } finally {
      setLoading(false);
    }
  };

  const getBadgeStyle = (category) => {
    if (category === 'Low Risk') {
      return {
        bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
        bar: 'bg-emerald-500',
        text: 'text-emerald-400'
      };
    } else if (category === 'Medium Risk') {
      return {
        bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
        bar: 'bg-amber-500',
        text: 'text-amber-400'
      };
    } else {
      return {
        bg: 'bg-red-500/20 text-red-400 border-red-500/40',
        bar: 'bg-red-500',
        text: 'text-red-400'
      };
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-sky-400" />
            Crime Risk Classification Predictor
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Classifies aggregate geographical areas & time periods into historical risk quartiles using a Random Forest Classifier.
          </p>
        </div>
        <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
          <span className="text-slate-400">Model:</span> <span className="font-semibold text-sky-400">Random Forest (100 Trees)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <BrainCircuit className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-white">Select Spatio-Temporal Features</h3>
          </div>

          <form onSubmit={handlePredict} className="space-y-4">
            {/* Area */}
            <div>
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                LAPD Geographic Division
              </label>
              <select
                value={formData.area_name}
                onChange={(e) => setFormData({ ...formData, area_name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                {areas.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Month */}
            <div>
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                Month of Year
              </label>
              <select
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Day of Week */}
            <div>
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                Day of Week
              </label>
              <select
                value={formData.day_of_week}
                onChange={(e) => setFormData({ ...formData, day_of_week: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                {DAYS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            {/* Operational Time Period */}
            <div>
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                Operational Time of Day
              </label>
              <div className="space-y-2">
                {PERIODS.map((p) => (
                  <label
                    key={p.value}
                    className={`flex items-start p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      formData.time_period_code === p.value
                        ? 'bg-sky-950/60 border-sky-500/60 text-white shadow-sm'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="time_period"
                      value={p.value}
                      checked={formData.time_period_code === p.value}
                      onChange={() => setFormData({ ...formData, time_period_code: p.value })}
                      className="mt-0.5 text-sky-500 focus:ring-0 mr-2.5"
                    />
                    <div>
                      <span className="font-semibold block text-slate-200">{p.label}</span>
                      <span className="text-[10px] text-slate-400">{p.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-semibold text-xs tracking-wide shadow-lg shadow-sky-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Running Inference...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Classify Historical Risk</span>
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Prediction Results Column */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          {result ? (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6 flex-1 flex flex-col justify-between">
              {/* Prediction Result Badge */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold">
                    Inference Output
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Validated Model
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 text-center space-y-2">
                  <span className="text-xs text-slate-400 font-medium">Predicted Risk Category</span>
                  <div className="flex items-center justify-center">
                    <span className={`px-5 py-2 rounded-xl text-xl font-extrabold border tracking-wide uppercase shadow-lg ${getBadgeStyle(result.predicted_risk_category).bg}`}>
                      {result.predicted_risk_category}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 pt-1">
                    Model Confidence: <b className="text-white font-mono">{result.confidence_percentage}%</b>
                  </div>
                </div>

                {/* Class Probabilities Distribution */}
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-semibold text-slate-300 block">
                    Posterior Probability Distribution
                  </span>
                  <div className="space-y-2">
                    {Object.entries(result.class_probabilities || {}).map(([cls, prob]) => {
                      const pct = Math.round(prob * 100);
                      const style = getBadgeStyle(cls);
                      return (
                        <div key={cls} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-300">{cls}</span>
                            <span className={`font-mono font-bold ${style.text}`}>{pct}%</span>
                          </div>
                          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Analytical Explanation */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 text-xs">
                  <span className="font-semibold text-slate-200 block">Summary Explanation:</span>
                  <p className="text-slate-400 leading-relaxed">{result.explanation}</p>
                </div>
              </div>

              {/* Regulatory / Academic Disclaimer */}
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-amber-500/20 text-[11px] text-amber-300/80 space-y-1">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  Academic Purpose Disclaimer:
                </span>
                <p>{result.disclaimer}</p>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-900 border border-dashed border-slate-800 shadow-xl flex-1 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-sky-400 shadow-inner">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-base font-bold text-white">Awaiting Feature Inputs</h4>
                <p className="text-xs text-slate-400">
                  Select a geographic division, month, day, and time period, then click "Classify Historical Risk" to compute the predicted category.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
