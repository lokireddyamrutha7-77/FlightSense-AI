import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { apiService } from '../../services/api';
import type { FlightPredictionRequest, FlightPredictionResponse } from '../../types/api';
import { Plane, Sparkles, Clock } from 'lucide-react';

export const DelayPredictionModule: React.FC = () => {
  const [formData, setFormData] = useState<FlightPredictionRequest>({
    flight_number: 'AA-1042',
    carrier: 'AA',
    origin: 'JFK',
    destination: 'LAX',
    scheduled_departure: '2026-10-15T14:30:00Z',
    distance_miles: 2475,
  });

  const [prediction, setPrediction] = useState<FlightPredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.predictDelay(formData);
      setPrediction(res);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate prediction');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Prediction Input Form */}
      <Card className="lg:col-span-5 space-y-4">
        <div className="flex items-center space-x-2 text-aviation-sky mb-2">
          <Plane className="w-5 h-5 transform -rotate-45" />
          <h3 className="text-base font-bold text-white">Pre-Flight Prediction Parameters</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Flight Number</label>
              <input
                type="text"
                name="flight_number"
                value={formData.flight_number}
                onChange={handleChange}
                className="w-full bg-aviation-900 border border-aviation-700 rounded-lg px-3 py-2 text-slate-200 focus:border-aviation-cyan focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Carrier Code</label>
              <select
                name="carrier"
                value={formData.carrier}
                onChange={handleChange}
                className="w-full bg-aviation-900 border border-aviation-700 rounded-lg px-3 py-2 text-slate-200 focus:border-aviation-cyan focus:outline-none"
              >
                <option value="AA">AA (American Airlines)</option>
                <option value="DL">DL (Delta Air Lines)</option>
                <option value="UA">UA (United Airlines)</option>
                <option value="WN">WN (Southwest Airlines)</option>
                <option value="B6">B6 (JetBlue Airways)</option>
                <option value="AS">AS (Alaska Airlines)</option>
                <option value="NK">NK (Spirit Airlines)</option>
                <option value="F9">F9 (Frontier Airlines)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Origin Airport</label>
              <input
                type="text"
                name="origin"
                value={formData.origin}
                onChange={handleChange}
                className="w-full bg-aviation-900 border border-aviation-700 rounded-lg px-3 py-2 text-slate-200 uppercase focus:border-aviation-cyan focus:outline-none"
                maxLength={4}
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Destination Airport</label>
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                className="w-full bg-aviation-900 border border-aviation-700 rounded-lg px-3 py-2 text-slate-200 uppercase focus:border-aviation-cyan focus:outline-none"
                maxLength={4}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Scheduled Departure</label>
              <input
                type="text"
                name="scheduled_departure"
                value={formData.scheduled_departure}
                onChange={handleChange}
                placeholder="YYYY-MM-DDTHH:MM:SSZ"
                className="w-full bg-aviation-900 border border-aviation-700 rounded-lg px-3 py-2 text-slate-200 focus:border-aviation-cyan focus:outline-none font-mono text-[11px]"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Distance (Miles)</label>
              <input
                type="number"
                name="distance_miles"
                value={formData.distance_miles}
                onChange={handleChange}
                className="w-full bg-aviation-900 border border-aviation-700 rounded-lg px-3 py-2 text-slate-200 focus:border-aviation-cyan focus:outline-none"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" isLoading={loading}>
            Run XGBoost Pre-Flight Prediction
          </Button>
        </form>
      </Card>

      {/* Prediction Output & SHAP Factors */}
      <div className="lg:col-span-7 space-y-6">
        {prediction ? (
          <>
            <Card glow className="space-y-4">
              <div className="flex items-center justify-between border-b border-aviation-700/60 pb-3">
                <div>
                  <span className="text-xs font-mono text-slate-400">PREDICTION ID</span>
                  <div className="text-lg font-bold font-mono text-aviation-cyan">{prediction.prediction_id}</div>
                </div>
                <Badge
                  variant={
                    prediction.risk_level === 'Severe Risk' || prediction.risk_level === 'High Risk'
                      ? 'danger'
                      : prediction.risk_level === 'Moderate Risk'
                      ? 'warning'
                      : 'success'
                  }
                >
                  {prediction.risk_level}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-aviation-900/80 rounded-xl border border-aviation-700/50">
                  <div className="text-xs text-slate-400">Delay Probability</div>
                  <div className="text-3xl font-extrabold font-mono text-aviation-cyan mt-1">
                    {(prediction.delay_probability * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="p-3 bg-aviation-900/80 rounded-xl border border-aviation-700/50">
                  <div className="text-xs text-slate-400">Predicted Class</div>
                  <div className={`text-xl font-extrabold font-mono mt-2 ${prediction.is_delayed ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {prediction.predicted_class || (prediction.is_delayed ? 'DELAYED' : 'ON TIME')}
                  </div>
                </div>
                <div className="p-3 bg-aviation-900/80 rounded-xl border border-aviation-700/50">
                  <div className="text-xs text-slate-400">Threshold (0.53)</div>
                  <div className="text-base font-bold text-slate-200 mt-2">
                    {prediction.is_delayed ? 'Exceeds Threshold' : 'Below Threshold'}
                  </div>
                </div>
              </div>

              {prediction.is_mock_data && (
                <div className="text-[11px] text-slate-400 bg-aviation-900/60 p-2 rounded border border-aviation-700/40 text-center font-mono">
                  [DEV FALLBACK] Standardized response format using production threshold 0.53
                </div>
              )}
            </Card>

            {/* SHAP Feature Attributions */}
            <Card className="space-y-3">
              <div className="flex items-center space-x-2 text-aviation-cyan">
                <Sparkles className="w-5 h-5" />
                <h4 className="text-sm font-bold text-white">Top Feature Risk Drivers (SHAP)</h4>
              </div>
              <div className="space-y-2">
                {prediction.shap_summary.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-aviation-900/60 rounded-lg border border-aviation-700/40 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{item.feature}</div>
                      <div className="text-slate-400 text-[11px]">{item.impact}</div>
                    </div>
                    <div className="text-right font-mono">
                      <span className={`font-bold ${item.shap_value > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {item.shap_value > 0 ? `+${item.shap_value}` : item.shap_value}
                      </span>
                      {item.feature_value && (
                        <div className="text-[10px] text-slate-400">{item.feature_value}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        ) : (
          <Card className="h-full flex flex-col items-center justify-center p-8 text-center">
            <Clock className="w-12 h-12 text-aviation-sky/60 mb-3" />
            <h4 className="text-base font-bold text-white">Ready for Inference</h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Fill in valid pre-flight route details (carrier, origin, destination, scheduled departure, distance), then run XGBoost prediction.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};
