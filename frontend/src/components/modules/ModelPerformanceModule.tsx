import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { apiService } from '../../services/api';
import type { ModelPerformanceMetrics } from '../../types/api';
import { Cpu, CheckCircle2, Sliders, BarChart3, LineChart as LineChartIcon } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from 'recharts';

interface CandidateReportMetric {
  model_name: string;
  decision_threshold: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  pr_auc: number;
  confusion_matrix: {
    true_negatives: number;
    false_positives: number;
    false_negatives: number;
    true_positives: number;
  };
}

// Authoritative candidate model evaluation metrics from the PBL Report
const REPORT_CANDIDATES: Record<string, CandidateReportMetric> = {
  "Logistic Regression": {
    model_name: "Logistic Regression",
    decision_threshold: 0.47,
    accuracy: 0.5717,
    precision: 0.2002,
    recall: 0.6011,
    f1_score: 0.3003,
    roc_auc: 0.6096,
    pr_auc: 0.2069,
    confusion_matrix: { true_negatives: 47601, false_positives: 36444, false_negatives: 6054, true_positives: 9121 },
  },
  "Decision Tree": {
    model_name: "Decision Tree",
    decision_threshold: 0.48,
    accuracy: 0.5460,
    precision: 0.1948,
    recall: 0.6281,
    f1_score: 0.2974,
    roc_auc: 0.6049,
    pr_auc: 0.2004,
    confusion_matrix: { true_negatives: 44648, false_positives: 39397, false_negatives: 5644, true_positives: 9531 },
  },
  "Random Forest": {
    model_name: "Random Forest",
    decision_threshold: 0.52,
    accuracy: 0.6120,
    precision: 0.2015,
    recall: 0.5210,
    f1_score: 0.2810,
    roc_auc: 0.6105,
    pr_auc: 0.2095,
    confusion_matrix: { true_negatives: 49280, false_positives: 34765, false_negatives: 6448, true_positives: 8727 },
  },
  "XGBoost": {
    model_name: "XGBoost",
    decision_threshold: 0.53,
    accuracy: 0.6436,
    precision: 0.2112,
    recall: 0.4863,
    f1_score: 0.2945,
    roc_auc: 0.6182,
    pr_auc: 0.2146,
    confusion_matrix: { true_negatives: 56474, false_positives: 27571, false_negatives: 7795, true_positives: 7380 },
  }
};

function interpolateTPR(curve: Array<{ fpr: number; tpr: number }>, targetFPR: number): number {
  if (!curve || curve.length === 0) return targetFPR;
  const sorted = [...curve].sort((a, b) => a.fpr - b.fpr);
  if (targetFPR <= sorted[0].fpr) return sorted[0].tpr;
  if (targetFPR >= sorted[sorted.length - 1].fpr) return sorted[sorted.length - 1].tpr;
  for (let i = 0; i < sorted.length - 1; i++) {
    const p1 = sorted[i];
    const p2 = sorted[i + 1];
    if (targetFPR >= p1.fpr && targetFPR <= p2.fpr) {
      if (p2.fpr === p1.fpr) return p1.tpr;
      const ratio = (targetFPR - p1.fpr) / (p2.fpr - p1.fpr);
      return p1.tpr + ratio * (p2.tpr - p1.tpr);
    }
  }
  return targetFPR;
}

function interpolatePrecision(curve: Array<{ precision: number; recall: number }>, targetRecall: number): number {
  if (!curve || curve.length === 0) return 0.1529;
  const sorted = [...curve].sort((a, b) => a.recall - b.recall);
  if (targetRecall <= sorted[0].recall) return sorted[0].precision;
  if (targetRecall >= sorted[sorted.length - 1].recall) return sorted[sorted.length - 1].precision;

  for (let i = 0; i < sorted.length - 1; i++) {
    const p1 = sorted[i];
    const p2 = sorted[i + 1];
    if (targetRecall >= p1.recall && targetRecall <= p2.recall) {
      if (p2.recall === p1.recall) return p1.precision;
      const ratio = (targetRecall - p1.recall) / (p2.recall - p1.recall);
      return p1.precision + ratio * (p2.precision - p1.precision);
    }
  }
  return 0.1529;
}

export const ModelPerformanceModule: React.FC = () => {
  const [data, setData] = useState<ModelPerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await apiService.getModelPerformance();
        setData(res);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSkeleton count={3} height="h-32" />;
  if (!data) return null;

  const candidatesFromApi = data.candidate_models_comparison || {};

  // 1. Four-Model Performance Metric Comparison Chart Data (Part 6)
  const fourModelComparisonData = [
    { metric: 'Accuracy', 'Logistic Regression': 57.17, 'Decision Tree': 54.60, 'Random Forest': 61.20, 'XGBoost': 64.36 },
    { metric: 'Precision', 'Logistic Regression': 20.02, 'Decision Tree': 19.48, 'Random Forest': 20.15, 'XGBoost': 21.12 },
    { metric: 'Recall', 'Logistic Regression': 60.11, 'Decision Tree': 62.81, 'Random Forest': 52.10, 'XGBoost': 48.63 },
    { metric: 'F1-score', 'Logistic Regression': 30.03, 'Decision Tree': 29.74, 'Random Forest': 28.10, 'XGBoost': 29.45 },
    { metric: 'ROC-AUC', 'Logistic Regression': 60.96, 'Decision Tree': 60.49, 'Random Forest': 61.05, 'XGBoost': 61.82 },
  ];

  // 2. ROC Curves Data for 4 Candidate Models (Part 3)
  const rocSteps = 50;
  const lrROC = candidatesFromApi["Logistic Regression"]?.roc_curve || [];
  const dtROC = candidatesFromApi["Decision Tree"]?.roc_curve || [];
  const rfROC = candidatesFromApi["Random Forest"]?.roc_curve || [];
  const xgbROC = candidatesFromApi["XGBoost"]?.roc_curve || data.feature_importances ? (candidatesFromApi["XGBoost"]?.roc_curve || []) : [];

  const rocChartData = Array.from({ length: rocSteps + 1 }, (_, i) => {
    const fpr = Number((i / rocSteps).toFixed(2));
    return {
      fpr,
      "Logistic Regression (AUC 0.610)": Number(interpolateTPR(lrROC, fpr).toFixed(4)),
      "Decision Tree (AUC 0.605)": Number(interpolateTPR(dtROC, fpr).toFixed(4)),
      "Random Forest (AUC 0.611)": Number(interpolateTPR(rfROC, fpr).toFixed(4)),
      "XGBoost (AUC 0.618)": Number(interpolateTPR(xgbROC, fpr).toFixed(4)),
      "Random classifier": fpr,
    };
  });

  // 3. Precision-Recall Curves Data for 4 Candidate Models (Part 4)
  const prSteps = 50;
  const lrPR = candidatesFromApi["Logistic Regression"]?.pr_curve || [];
  const dtPR = candidatesFromApi["Decision Tree"]?.pr_curve || [];
  const rfPR = candidatesFromApi["Random Forest"]?.pr_curve || [];
  const xgbPR = candidatesFromApi["XGBoost"]?.pr_curve || [];

  const prChartData = Array.from({ length: prSteps + 1 }, (_, i) => {
    const recall = Number((i / prSteps).toFixed(2));
    return {
      recall,
      "Logistic Regression (PR-AUC 0.207)": Number(interpolatePrecision(lrPR, recall).toFixed(4)),
      "Decision Tree (PR-AUC 0.200)": Number(interpolatePrecision(dtPR, recall).toFixed(4)),
      "Random Forest (PR-AUC 0.209)": Number(interpolatePrecision(rfPR, recall).toFixed(4)),
      "XGBoost (PR-AUC 0.215)": Number(interpolatePrecision(xgbPR, recall).toFixed(4)),
      "Test base rate (15.29%)": 0.1529,
    };
  });

  // 4. Top 15 Feature Importances (Part 5)
  const top15FeatureImportances = [...(data.feature_importances || [])].slice(0, 15).reverse();

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-aviation-850 border border-aviation-cyan/40 rounded-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-aviation-cyan/20 rounded-xl text-aviation-cyan">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-white">Model Evaluation & Benchmark Comparison</h2>
              <Badge variant="success">Production: XGBoost</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluated on 99,220 holdout test samples with pre-flight leakage prevention.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs bg-aviation-900 px-3 py-1.5 rounded-lg border border-aviation-700/60 font-mono">
          <Sliders className="w-4 h-4 text-amber-400" />
          <span className="text-slate-300">Decision Threshold: <strong className="text-amber-400">0.53</strong></span>
        </div>
      </div>

      {/* 2. Primary Production XGBoost Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card glow className="text-center p-3">
          <div className="text-[10px] text-slate-400 font-mono uppercase">ROC-AUC</div>
          <div className="text-xl font-extrabold font-mono text-aviation-cyan mt-1">
            61.82%
          </div>
        </Card>
        <Card className="text-center p-3">
          <div className="text-[10px] text-slate-400 font-mono uppercase">PR-AUC</div>
          <div className="text-xl font-extrabold font-mono text-emerald-400 mt-1">
            21.46%
          </div>
        </Card>
        <Card className="text-center p-3">
          <div className="text-[10px] text-slate-400 font-mono uppercase">ACCURACY</div>
          <div className="text-xl font-extrabold font-mono text-blue-400 mt-1">
            64.36%
          </div>
        </Card>
        <Card className="text-center p-3">
          <div className="text-[10px] text-slate-400 font-mono uppercase">PRECISION</div>
          <div className="text-xl font-extrabold font-mono text-amber-400 mt-1">
            21.12%
          </div>
        </Card>
        <Card className="text-center p-3">
          <div className="text-[10px] text-slate-400 font-mono uppercase">RECALL</div>
          <div className="text-xl font-extrabold font-mono text-purple-400 mt-1">
            48.63%
          </div>
        </Card>
        <Card className="text-center p-3">
          <div className="text-[10px] text-slate-400 font-mono uppercase">F1 SCORE</div>
          <div className="text-xl font-extrabold font-mono text-rose-400 mt-1">
            29.45%
          </div>
        </Card>
      </div>

      {/* 3. Candidate Models Comparison Table (Part 2) */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Candidate Models Evaluation Benchmarks</h3>
            <p className="text-xs text-slate-400">Standardized evaluation metrics across 4 machine learning architectures (PBL Report)</p>
          </div>
          <Badge variant="info">4 Models Benchmarked</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-aviation-900 border-b border-aviation-700/60 font-mono uppercase text-slate-400">
              <tr>
                <th className="p-3">Model Architecture</th>
                <th className="p-3">Threshold</th>
                <th className="p-3">Accuracy</th>
                <th className="p-3">Precision</th>
                <th className="p-3">Recall</th>
                <th className="p-3">F1 Score</th>
                <th className="p-3">ROC-AUC</th>
                <th className="p-3">PR-AUC</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aviation-800">
              {Object.entries(REPORT_CANDIDATES).map(([name, model]) => {
                const isSelected = name === "XGBoost";
                return (
                  <tr key={name} className={`hover:bg-aviation-800/50 ${isSelected ? 'bg-aviation-cyan/10 font-medium' : ''}`}>
                    <td className="p-3 font-bold text-white flex items-center space-x-2">
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-aviation-cyan" />}
                      <span>{name}</span>
                    </td>
                    <td className="p-3 font-mono text-slate-300">{model.decision_threshold.toFixed(2)}</td>
                    <td className="p-3 font-mono text-slate-200">{(model.accuracy * 100).toFixed(2)}%</td>
                    <td className="p-3 font-mono text-amber-400 font-semibold">{(model.precision * 100).toFixed(2)}%</td>
                    <td className="p-3 font-mono text-purple-400 font-semibold">{(model.recall * 100).toFixed(2)}%</td>
                    <td className="p-3 font-mono text-rose-400 font-semibold">{(model.f1_score * 100).toFixed(2)}%</td>
                    <td className="p-3 font-mono text-aviation-cyan font-bold">{(model.roc_auc * 100).toFixed(2)}%</td>
                    <td className="p-3 font-mono text-emerald-400 font-semibold">{(model.pr_auc * 100).toFixed(2)}%</td>
                    <td className="p-3 text-right">
                      {isSelected ? (
                        <Badge variant="success">Selected Model</Badge>
                      ) : (
                        <Badge variant="neutral">Candidate</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 4. NEW Four-Color Model Comparison Bar Chart (Part 6 - Dark Theme) */}
      <Card>
        <div className="flex items-center justify-between border-b border-aviation-700/60 pb-3 mb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-aviation-cyan" />
              <span>Model Performance Metric Comparison Across Candidate Architectures</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Grouped evaluation metric comparison for Logistic Regression, Decision Tree, Random Forest, and XGBoost
            </p>
          </div>
          <Badge variant="info">PBL Report Figure</Badge>
        </div>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fourModelComparisonData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A294D" />
              <XAxis dataKey="metric" stroke="#64748B" tick={{ fontSize: 12, fill: '#94A3B8', fontWeight: 600 }} />
              <YAxis stroke="#64748B" tick={{ fontSize: 11, fill: '#94A3B8' }} unit="%" domain={[0, 80]} label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', fill: '#94A3B8', fontSize: 12, fontWeight: 600 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0B1329', borderColor: '#263B69', color: '#F1F5F9', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)' }}
                formatter={(val: any) => [`${val}%`, 'Score']}
              />
              <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px', color: '#94A3B8' }} />
              <Bar dataKey="Logistic Regression" fill="#2563EB" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Decision Tree" fill="#DC2626" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Random Forest" fill="#D97706" radius={[3, 3, 0, 0]} />
              <Bar dataKey="XGBoost" fill="#059669" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 5. ROC & PR Curves (Part 3 & Part 4 - Dark Theme) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Figure 6.2 ROC Curves */}
        <Card>
          <div className="border-b border-aviation-700/60 pb-2 mb-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <LineChartIcon className="w-4 h-4 text-aviation-cyan" />
              <span>Receiver Operating Characteristic (ROC) Curves</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Figure 6.2 ROC Curves of the Candidate Models
            </p>
          </div>
          <div className="h-72 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rocChartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A294D" />
                <XAxis
                  dataKey="fpr"
                  stroke="#64748B"
                  tick={{ fontSize: 10, fill: '#64748B' }}
                  domain={[0, 1]}
                  label={{ value: 'False positive rate', position: 'insideBottom', offset: -12, fill: '#94A3B8', fontSize: 11, fontWeight: 600 }}
                />
                <YAxis
                  stroke="#64748B"
                  tick={{ fontSize: 10, fill: '#64748B' }}
                  domain={[0, 1]}
                  label={{ value: 'True positive rate', angle: -90, position: 'insideLeft', offset: 10, fill: '#94A3B8', fontSize: 11, fontWeight: 600 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B1329', borderColor: '#263B69', color: '#F1F5F9', borderRadius: '8px' }}
                />
                <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '11px', color: '#94A3B8' }} />
                <Line type="monotone" dataKey="Logistic Regression (AUC 0.610)" stroke="#2563EB" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Decision Tree (AUC 0.605)" stroke="#DC2626" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Random Forest (AUC 0.611)" stroke="#D97706" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="XGBoost (AUC 0.618)" stroke="#059669" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="Random classifier" stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Figure 6.3 Precision-Recall Curves */}
        <Card>
          <div className="border-b border-aviation-700/60 pb-2 mb-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <LineChartIcon className="w-4 h-4 text-emerald-400" />
              <span>Precision–Recall Curves</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Figure 6.3 Precision–Recall Curves of the Candidate Models
            </p>
          </div>
          <div className="h-72 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={prChartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A294D" />
                <XAxis
                  dataKey="recall"
                  stroke="#64748B"
                  tick={{ fontSize: 10, fill: '#64748B' }}
                  domain={[0, 1]}
                  label={{ value: 'Recall', position: 'insideBottom', offset: -12, fill: '#94A3B8', fontSize: 11, fontWeight: 600 }}
                />
                <YAxis
                  stroke="#64748B"
                  tick={{ fontSize: 10, fill: '#64748B' }}
                  domain={[0, 0.4]}
                  label={{ value: 'Precision', angle: -90, position: 'insideLeft', offset: 10, fill: '#94A3B8', fontSize: 11, fontWeight: 600 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B1329', borderColor: '#263B69', color: '#F1F5F9', borderRadius: '8px' }}
                />
                <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '11px', color: '#94A3B8' }} />
                <Line type="monotone" dataKey="Logistic Regression (PR-AUC 0.207)" stroke="#2563EB" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Decision Tree (PR-AUC 0.200)" stroke="#DC2626" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Random Forest (PR-AUC 0.209)" stroke="#D97706" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="XGBoost (PR-AUC 0.215)" stroke="#059669" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="Test base rate (15.29%)" stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 6. Top 15 Global Feature Importances (Part 5 - Dark Theme) */}
      <Card>
        <div className="border-b border-aviation-700/60 pb-2 mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Top 15 Global Feature Importances</h3>
            <p className="text-xs text-slate-400 mt-0.5">Figure 6.5 Top 15 Feature Importances of the XGBoost Model</p>
          </div>
          <Badge variant="info">XGBoost Model</Badge>
        </div>
        <div className="h-96 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={top15FeatureImportances} margin={{ top: 10, right: 30, left: 100, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A294D" />
              <XAxis
                type="number"
                stroke="#64748B"
                tick={{ fontSize: 10, fill: '#64748B' }}
                label={{ value: 'Normalized XGBoost feature importance', position: 'insideBottom', offset: -12, fill: '#94A3B8', fontSize: 11, fontWeight: 600 }}
              />
              <YAxis
                dataKey="feature"
                type="category"
                stroke="#64748B"
                tick={{ fontSize: 10, fill: '#64748B' }}
                width={130}
                label={{ value: 'Feature', angle: -90, position: 'insideLeft', offset: -80, fill: '#94A3B8', fontSize: 11, fontWeight: 600 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0B1329', borderColor: '#263B69', color: '#F1F5F9', borderRadius: '8px' }}
                formatter={(val: any) => [Number(val).toFixed(4), 'Normalized Importance']}
              />
              <Bar dataKey="importance" fill="#00A8E8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 7. XGBoost Confusion Matrix (Threshold = 0.53) */}
      <Card>
        <h3 className="text-sm font-bold text-slate-200 mb-4">XGBoost Confusion Matrix (Decision Threshold = 0.53)</h3>
        <div className="grid grid-cols-2 gap-3 text-center text-xs font-mono">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
            <div className="text-slate-400">TRUE NEGATIVES (ON TIME)</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              {data.confusion_matrix.true_negatives.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Correctly predicted on-time</div>
          </div>
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl">
            <div className="text-slate-400">FALSE POSITIVES</div>
            <div className="text-2xl font-bold text-rose-400 mt-1">
              {data.confusion_matrix.false_positives.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">False delay alarms</div>
          </div>
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <div className="text-slate-400">FALSE NEGATIVES</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">
              {data.confusion_matrix.false_negatives.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Missed delays</div>
          </div>
          <div className="p-4 bg-aviation-cyan/10 border border-aviation-cyan/30 rounded-xl">
            <div className="text-slate-400">TRUE POSITIVES (DELAYED)</div>
            <div className="text-2xl font-bold text-aviation-cyan mt-1">
              {data.confusion_matrix.true_positives.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Correctly predicted delays</div>
          </div>
        </div>
      </Card>
    </div>
  );
};
