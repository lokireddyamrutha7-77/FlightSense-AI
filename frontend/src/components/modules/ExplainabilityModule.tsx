import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { apiService } from '../../services/api';
import type { SHAPExplanationDetail, PredictionHistoryItem } from '../../types/api';
import { Sparkles, ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

interface ExplainabilityModuleProps {
  predictionId?: string;
}

export const ExplainabilityModule: React.FC<ExplainabilityModuleProps> = ({ predictionId: initialId }) => {
  const [selectedId, setSelectedId] = useState<string>(initialId || '');
  const [historyLogs, setHistoryLogs] = useState<PredictionHistoryItem[]>([]);
  const [data, setData] = useState<SHAPExplanationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load prediction history logs for dropdown selection
    const loadLogs = async () => {
      try {
        const logs = await apiService.getPredictionHistory();
        setHistoryLogs(logs);
        if (!selectedId && logs.length > 0) {
          setSelectedId(logs[0].prediction_id);
        }
      } catch (e) {
        console.error("Failed to load history logs", e);
      }
    };
    loadLogs();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const fetchExplanation = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiService.getExplainabilityDetail(selectedId);
        setData(res);
      } catch (err: any) {
        setError(err.response?.data?.detail || err.message || `Failed to fetch SHAP explanation for ID '${selectedId}'`);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchExplanation();
  }, [selectedId]);

  const topIncreasing = data?.shap_summary.filter(s => s.shap_value > 0).sort((a, b) => b.shap_value - a.shap_value) || [];
  const topDecreasing = data?.shap_summary.filter(s => s.shap_value < 0).sort((a, b) => a.shap_value - b.shap_value) || [];

  return (
    <div className="space-y-6">
      {/* Header & ID Selector */}
      <Card className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-aviation-cyan" />
            SHAP Explainability & Feature Attributions
          </h2>
          <p className="text-xs text-slate-400">
            TreeExplainer feature-level attributions for specific prediction instances
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <label className="text-slate-400 font-medium whitespace-nowrap">Prediction Log:</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="bg-aviation-900 border border-aviation-700 rounded-lg px-3 py-1.5 text-slate-200 focus:border-aviation-cyan focus:outline-none font-mono text-xs max-w-xs"
          >
            {historyLogs.map((log) => (
              <option key={log.prediction_id} value={log.prediction_id}>
                {log.prediction_id} — {log.flight_number} ({log.origin}&rarr;{log.destination})
              </option>
            ))}
          </select>
        </div>
      </Card>

      {loading && <LoadingSkeleton count={3} height="h-32" />}

      {error && (
        <Card className="border-rose-500/30">
          <div className="flex items-center space-x-3 text-rose-400 mb-1">
            <AlertTriangle className="w-5 h-5" />
            <h4 className="font-semibold text-sm">Explanation Not Available</h4>
          </div>
          <p className="text-xs text-slate-300">{error}</p>
        </Card>
      )}

      {data && !loading && (
        <>
          {/* Summary Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <div className="text-xs text-slate-400 font-mono">FLIGHT / ROUTE</div>
              <div className="text-lg font-bold text-white font-mono mt-1">
                {data.flight_number} ({data.origin} &rarr; {data.destination})
              </div>
              <div className="text-xs text-slate-400 mt-1">Carrier: {data.carrier}</div>
            </Card>

            <Card glow>
              <div className="text-xs text-aviation-cyan font-mono">PREDICTED DELAY PROBABILITY</div>
              <div className="text-2xl font-bold font-mono text-aviation-cyan mt-1">
                {(data.delay_probability * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-slate-400 mt-1">Threshold: 0.53</div>
            </Card>

            <Card>
              <div className="text-xs text-slate-400 font-mono">RISK LEVEL</div>
              <div className="mt-2">
                <Badge
                  variant={
                    data.risk_level.includes('High') || data.risk_level.includes('Severe')
                      ? 'danger'
                      : data.risk_level.includes('Moderate')
                      ? 'warning'
                      : 'success'
                  }
                >
                  {data.risk_level}
                </Badge>
              </div>
              <div className="text-xs text-slate-400 mt-2">Class: {data.is_delayed ? 'DELAYED' : 'ON-TIME'}</div>
            </Card>

            <Card>
              <div className="text-xs text-slate-400 font-mono">PREDICTED CLASS</div>
              <div className={`text-2xl font-bold font-mono mt-1 ${data.is_delayed ? 'text-rose-400' : 'text-emerald-400'}`}>
                {data.predicted_class || (data.is_delayed ? 'DELAYED' : 'ON TIME')}
              </div>
              <div className="text-xs text-slate-400 mt-1">Logged: {new Date(data.created_at).toLocaleTimeString()}</div>
            </Card>
          </div>

          {/* Top Positive vs Negative Drivers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-rose-500/30">
              <div className="flex items-center space-x-2 text-rose-400 mb-3">
                <ArrowUpRight className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">Factors Increasing Delay Risk</h3>
              </div>
              <div className="space-y-2 text-xs">
                {topIncreasing.length > 0 ? (
                  topIncreasing.map((item, idx) => (
                    <div key={idx} className="p-3 bg-aviation-900/80 border border-rose-500/20 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-200">{item.feature}</div>
                        <div className="text-slate-400 text-[11px]">{item.impact}</div>
                      </div>
                      <div className="text-right font-mono text-rose-400 font-bold text-sm">
                        +{item.shap_value.toFixed(4)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 text-xs py-2">No strong positive risk drivers detected.</div>
                )}
              </div>
            </Card>

            <Card className="border-emerald-500/30">
              <div className="flex items-center space-x-2 text-emerald-400 mb-3">
                <ArrowDownRight className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">Factors Decreasing Delay Risk</h3>
              </div>
              <div className="space-y-2 text-xs">
                {topDecreasing.length > 0 ? (
                  topDecreasing.map((item, idx) => (
                    <div key={idx} className="p-3 bg-aviation-900/80 border border-emerald-500/20 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-200">{item.feature}</div>
                        <div className="text-slate-400 text-[11px]">{item.impact}</div>
                      </div>
                      <div className="text-right font-mono text-emerald-400 font-bold text-sm">
                        {item.shap_value.toFixed(4)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 text-xs py-2">No strong mitigating factors detected.</div>
                )}
              </div>
            </Card>
          </div>

          {/* Feature Attribution Chart */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">SHAP Feature Attribution Spectrum</h3>
                <p className="text-xs text-slate-400">Directional impact of pre-flight parameters on XGBoost decision boundary</p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={data.shap_summary}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A294D" />
                  <XAxis type="number" stroke="#64748B" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="feature" type="category" stroke="#64748B" tick={{ fontSize: 11 }} width={170} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B1329', borderColor: '#263B69', borderRadius: '8px' }}
                    formatter={(val: any) => [val, 'SHAP Value']}
                  />
                  <Bar dataKey="shap_value" radius={[4, 4, 4, 4]}>
                    {data.shap_summary.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.shap_value > 0 ? '#F43F5E' : '#10B981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
