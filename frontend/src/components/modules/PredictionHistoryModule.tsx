import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { EmptyState } from '../ui/EmptyState';
import { apiService } from '../../services/api';
import type { PredictionHistoryItem } from '../../types/api';
import { History, Search, Sparkles } from 'lucide-react';

interface PredictionHistoryModuleProps {
  onSelectPrediction?: (predId: string) => void;
}

export const PredictionHistoryModule: React.FC<PredictionHistoryModuleProps> = ({ onSelectPrediction }) => {
  const [history, setHistory] = useState<PredictionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [carrierFilter, setCarrierFilter] = useState('ALL');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await apiService.getPredictionHistory();
        setHistory(res);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.flight_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.carrier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.prediction_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = riskFilter === 'ALL' || item.risk_level === riskFilter;
    const matchesCarrier = carrierFilter === 'ALL' || item.carrier === carrierFilter;
    return matchesSearch && matchesRisk && matchesCarrier;
  });

  if (loading) return <LoadingSkeleton count={4} height="h-24" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-aviation-cyan" />
            Prediction Audit Trail & Database History
          </h2>
          <p className="text-xs text-slate-400">Searchable history of previous flight delay predictions and risk metrics saved in DB</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search flight, route, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-aviation-900 border border-aviation-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 focus:border-aviation-cyan focus:outline-none w-56"
            />
          </div>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-aviation-900 border border-aviation-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-aviation-cyan focus:outline-none font-mono"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="Low Risk">Low Risk</option>
            <option value="Moderate Risk">Moderate Risk</option>
            <option value="High Risk">High Risk</option>
            <option value="Severe Risk">Severe Risk</option>
          </select>

          <select
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            className="bg-aviation-900 border border-aviation-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-aviation-cyan focus:outline-none font-mono"
          >
            <option value="ALL">All Carriers</option>
            <option value="AA">AA (American)</option>
            <option value="DL">DL (Delta)</option>
            <option value="UA">UA (United)</option>
            <option value="WN">WN (Southwest)</option>
            <option value="AS">AS (Alaska)</option>
            <option value="B6">B6 (JetBlue)</option>
          </select>
        </div>
      </div>

      <Card>
        {filteredHistory.length === 0 ? (
          <EmptyState title="No Matching Predictions" description="No prediction logs matched your active filter criteria." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-aviation-900 border-b border-aviation-700/60 font-mono uppercase text-slate-400">
                <tr>
                  <th className="p-3">Prediction ID</th>
                  <th className="p-3">Flight Number</th>
                  <th className="p-3">Carrier</th>
                  <th className="p-3">Route</th>
                  <th className="p-3">Delay Probability</th>
                  <th className="p-3">Predicted Class</th>
                  <th className="p-3">Risk Level</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aviation-800">
                {filteredHistory.map((item) => (
                  <tr key={item.prediction_id} className="hover:bg-aviation-800/50 transition-colors">
                    <td className="p-3 font-mono text-aviation-cyan font-semibold">{item.prediction_id}</td>
                    <td className="p-3 font-bold text-white">{item.flight_number}</td>
                    <td className="p-3 font-mono text-slate-300">{item.carrier}</td>
                    <td className="p-3">{item.origin} &rarr; {item.destination}</td>
                    <td className="p-3 font-mono font-bold text-aviation-sky">
                      {(item.delay_probability * 100).toFixed(1)}%
                    </td>
                    <td className={`p-3 font-mono font-bold ${item.is_delayed ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {item.predicted_class || (item.is_delayed ? 'DELAYED' : 'ON TIME')}
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={
                          item.risk_level.includes('Severe') || item.risk_level.includes('High')
                            ? 'danger'
                            : item.risk_level.includes('Moderate')
                            ? 'warning'
                            : 'success'
                        }
                      >
                        {item.risk_level}
                      </Badge>
                    </td>
                    <td className="p-3 font-mono text-slate-400">
                      {new Date(item.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="p-3 text-right">
                      {onSelectPrediction && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSelectPrediction(item.prediction_id)}
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1" /> SHAP
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
