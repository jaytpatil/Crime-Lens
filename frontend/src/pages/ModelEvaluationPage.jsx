import React, { useEffect, useState } from 'react';
import {
  BrainCircuit,
  TrendingUp,
  CheckCircle2,
  Table as TableIcon,
  BarChart3,
  Layers,
  Sliders,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { fetchModelMetrics } from '../services/api';

export default function ModelEvaluationPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchModelMetrics();
        setMetrics(data);
      } catch (err) {
        console.error("Failed to load model metrics:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs">Loading model evaluation metrics...</div>;
  }

  if (!metrics) {
    return (
      <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
        <h4 className="text-white font-bold text-sm">Model Metrics Unavailable</h4>
        <p className="text-xs text-slate-400">Trigger the pipeline to train and evaluate the machine learning models.</p>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Random Forest Accuracy',
      value: `${(metrics.accuracy * 100).toFixed(1)}%`,
      subtitle: `Outperforms baseline (${(metrics.baseline_accuracy * 100).toFixed(1)}%)`,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      border: 'border-emerald-500/30'
    },
    {
      title: 'Macro F1-Score',
      value: metrics.f1_macro?.toFixed(4),
      subtitle: `Weighted F1: ${metrics.f1_weighted?.toFixed(4)}`,
      icon: TrendingUp,
      color: 'text-sky-400',
      border: 'border-sky-500/30'
    },
    {
      title: 'Macro Precision',
      value: metrics.precision_macro?.toFixed(4),
      subtitle: 'Harmonic balanced across classes',
      icon: ShieldCheck,
      color: 'text-purple-400',
      border: 'border-purple-500/30'
    },
    {
      title: 'Macro Recall',
      value: metrics.recall_macro?.toFixed(4),
      subtitle: 'Sensitivity across risk tertiles',
      icon: BrainCircuit,
      color: 'text-amber-400',
      border: 'border-amber-500/30'
    }
  ];

  const cmLabels = metrics.confusion_matrix?.labels || ["Low Risk", "Medium Risk", "High Risk"];
  const cmMatrix = metrics.confusion_matrix?.matrix || [[0,0,0],[0,0,0],[0,0,0]];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-sky-400" />
            Machine Learning Model Evaluation & Diagnostics
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Validation of 3-class Random Forest Classifier against Multinomial Logistic Regression baseline on held-out test split (20%).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
            <span className="text-slate-400">Split:</span> <span className="font-mono text-white font-bold">{metrics.train_samples} train / {metrics.test_samples} test</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, idx) => {
          const Icon = k.icon;
          return (
            <div key={idx} className={`p-4 rounded-xl bg-slate-900 border ${k.border} shadow-lg space-y-2`}>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{k.title}</span>
                <Icon className={`w-4 h-4 ${k.color}`} />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">{k.value}</div>
              <div className="text-[11px] text-slate-400">{k.subtitle}</div>
            </div>
          );
        })}
      </div>

      {/* Confusion Matrix & Feature Importance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3x3 Confusion Matrix */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-sky-400" />
                Confusion Matrix (3x3 Multiclass)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">True Historical Labels vs Predicted Labels on Test Split</p>
            </div>
          </div>

          <div className="pt-2">
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-center text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-semibold text-slate-400">
                    <th className="p-3 text-left">Actual \ Predicted</th>
                    {cmLabels.map((label) => (
                      <th key={label} className="p-3 font-semibold">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {cmMatrix.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-slate-900/40">
                      <td className="p-3 text-left font-medium text-slate-300 bg-slate-900/40">
                        {cmLabels[rowIdx]}
                      </td>
                      {row.map((val, colIdx) => {
                        const isDiagonal = rowIdx === colIdx;
                        return (
                          <td
                            key={colIdx}
                            className={`p-3 font-mono font-bold text-sm ${
                              isDiagonal
                                ? 'bg-sky-600/20 text-sky-400 border border-sky-500/30'
                                : val > 0
                                ? 'text-slate-400'
                                : 'text-slate-600'
                            }`}
                          >
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-sky-500/40 border border-sky-400"></span>
                Diagonal = Correct Predictions
              </span>
              <span>Total Test Units: {metrics.test_samples}</span>
            </div>
          </div>
        </div>

        {/* Feature Importance Bar Chart */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              Gini Feature Importance
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Random Forest relative feature contribution weights</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={metrics.feature_importances || []}
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis dataKey="feature" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} width={110} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                />
                <Bar dataKey="importance" name="Importance" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                  {metrics.feature_importances?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#38bdf8' : '#8b5cf6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Thresholds & Data Leakage Prevention Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quantile Cutoffs */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            Quantile Risk Thresholds (Learned from Training Set Only)
          </h3>
          <p className="text-xs text-slate-400">
            Cutoffs computed strictly on the training partition to avoid target data leakage:
          </p>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 text-center">
              <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold block">Low Risk</span>
              <span className="text-lg font-bold text-white font-mono">&le; {metrics.thresholds?.q33_low_cutoff}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Bottom 33.3% count</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/30 text-center">
              <span className="text-[10px] uppercase font-mono text-amber-400 font-bold block">Medium Risk</span>
              <span className="text-lg font-bold text-white font-mono">{metrics.thresholds?.q33_low_cutoff} – {metrics.thresholds?.q66_med_cutoff}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Mid 33.3% count</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-red-500/30 text-center">
              <span className="text-[10px] uppercase font-mono text-red-400 font-bold block">High Risk</span>
              <span className="text-lg font-bold text-white font-mono">&gt; {metrics.thresholds?.q66_med_cutoff}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Top 33.3% count</span>
            </div>
          </div>
        </div>

        {/* Methodology & Limitations Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              Methodological Integrity & Academic Transparency
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {metrics.academic_notes}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 block">Baseline Model Comparison:</span>
            <span>Multinomial Logistic Regression achieved <b>{(metrics.baseline_accuracy * 100).toFixed(1)}%</b> accuracy. The non-linear Random Forest ensemble improves classification accuracy to <b>{(metrics.accuracy * 100).toFixed(1)}%</b> by capturing temporal interactions between hours, days, and division boundaries.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
