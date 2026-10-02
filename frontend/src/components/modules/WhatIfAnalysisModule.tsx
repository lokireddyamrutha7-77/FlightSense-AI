import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { apiService } from '../../services/api';
import type { WhatIfSimulationRequest, WhatIfSimulationResponse } from '../../types/api';
import { Sliders, TrendingUp } from 'lucide-react';

export const WhatIfAnalysisModule: React.FC = () => {
  const [formData, setFormData] = useState<WhatIfSimulationRequest>({
    flight_number: 'AA-1042',
    carrier: 'AA',
    origin: 'JFK',
    destination: 'LAX',
    scheduled_departure: '2026-10-15T08:00:00Z',
    distance_miles: 2475,
    simulated_carrier: 'AA',
    simulated_origin: 'JFK',
    simulated_destination: 'LAX',
    simulated_scheduled_departure: '2026-10-15T18:30:00Z',
    simulated_distance_miles: 2475,
  });

  const [result, setResult] = useState<WhatIfSimulationResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    try {
      setLoading(true);
      const res = await apiService.simulateWhatIf(formData);
      setResult(res);
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
      <Card className="lg:col-span-5 space-y-4">
        <div className="flex items-center space-x-2 text-aviation-cyan">
          <Sliders className="w-5 h-5" />
          <h3 className="text-base font-bold text-white">Pre-Flight Scenario Parameters</h3>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-3 bg-aviation-900/60 border border-aviation-700/40 rounded-lg space-y-2">
            <span className="font-semibold text-slate-300">Baseline Flight Settings</span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <label className="block text-slate-400">Baseline Carrier</label>
                <input
                  type="text"
                  name="carrier"
                  value={formData.carrier}
                  onChange={handleChange}
                  className="w-full bg-aviation-900 border border-aviation-700 rounded px-2 py-1 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400">Baseline Departure</label>
                <input
                  type="text"
                  name="scheduled_departure"
                  value={formData.scheduled_departure}
                  onChange={handleChange}
                  className="w-full bg-aviation-900 border border-aviation-700 rounded px-2 py-1 text-slate-200 font-mono text-[10px]"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-aviation-900/80 border border-aviation-cyan/40 rounded-lg space-y-3">
            <span className="font-bold text-aviation-cyan">Simulated Pre-Flight Scenario Changes</span>
            
            <div>
              <label className="block text-slate-300 font-medium mb-1">Simulated Carrier</label>
              <select
                name="simulated_carrier"
                value={formData.simulated_carrier || formData.carrier}
                onChange={handleChange}
                className="w-full bg-aviation-900 border border-aviation-700 rounded-lg px-3 py-1.5 text-slate-200"
              >
                <option value="AA">AA (American Airlines)</option>
                <option value="DL">DL (Delta Air Lines)</option>
                <option value="UA">UA (United Airlines)</option>
                <option value="WN">WN (Southwest Airlines)</option>
                <option value="B6">B6 (JetBlue Airways)</option>
                <option value="AS">AS (Alaska Airlines)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Simulated Departure Time</label>
              <input
                type="text"
                name="simulated_scheduled_departure"
                value={formData.simulated_scheduled_departure || ''}
                onChange={handleChange}
                placeholder="YYYY-MM-DDTHH:MM:SSZ"
                className="w-full bg-aviation-900 border border-aviation-700 rounded-lg px-3 py-1.5 text-slate-200 font-mono text-[11px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Simulated Origin</label>
                <input
                  type="text"
                  name="simulated_origin"
                  value={formData.simulated_origin || formData.origin}
                  onChange={handleChange}
                  className="w-full bg-aviation-900 border border-aviation-700 rounded-lg px-2 py-1 text-slate-200 uppercase"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Simulated Destination</label>
                <input
                  type="text"
                  name="simulated_destination"
                  value={formData.simulated_destination || formData.destination}
                  onChange={handleChange}
                  className="w-full bg-aviation-900 border border-aviation-700 rounded-lg px-2 py-1 text-slate-200 uppercase"
                />
              </div>
            </div>
          </div>

          <Button onClick={handleSimulate} isLoading={loading} className="w-full">
            Simulate Pre-Flight Scenario
          </Button>
        </div>
      </Card>

      <div className="lg:col-span-7 space-y-6">
        {result ? (
          <Card glow className="space-y-6">
            <h3 className="text-sm font-bold text-white">Pre-Flight Scenario Impact Analysis</h3>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-aviation-900/80 rounded-xl border border-aviation-700/50">
                <div className="text-xs text-slate-400">BASELINE DELAY PROBABILITY</div>
                <div className="text-2xl font-bold font-mono text-slate-200 mt-1">
                  {(result.baseline.delay_probability * 100).toFixed(1)}%
                </div>
                <Badge variant="neutral" className="mt-2">{result.baseline.predicted_class || result.baseline.risk_level}</Badge>
              </div>

              <div className="p-4 bg-aviation-900/80 rounded-xl border border-aviation-cyan/40">
                <div className="text-xs text-aviation-cyan font-bold">SIMULATED SCENARIO PROBABILITY</div>
                <div className="text-2xl font-bold font-mono text-aviation-cyan mt-1">
                  {(result.simulated.delay_probability * 100).toFixed(1)}%
                </div>
                <Badge variant={result.simulated.is_delayed ? 'danger' : 'success'} className="mt-2">
                  {result.simulated.predicted_class || result.simulated.risk_level}
                </Badge>
              </div>
            </div>

            <div className="p-3 bg-aviation-900/60 rounded-xl border border-aviation-700/40 text-xs text-slate-300 space-y-2 font-mono">
              <div className="flex justify-between">
                <span>Delay Probability Shift:</span>
                <span className={`font-bold ${result.comparison.probability_delta > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {result.comparison.probability_delta > 0 ? `+${(result.comparison.probability_delta * 100).toFixed(1)}%` : `${(result.comparison.probability_delta * 100).toFixed(1)}%`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Class Prediction Changed:</span>
                <span className="font-bold text-slate-200">{result.comparison.class_changed ? 'YES' : 'NO'}</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans border-t border-aviation-700/40 pt-2 mt-2">
                {result.comparison.summary}
              </p>
            </div>
          </Card>
        ) : (
          <Card className="h-full flex flex-col items-center justify-center p-8 text-center">
            <TrendingUp className="w-12 h-12 text-aviation-cyan/60 mb-3" />
            <h4 className="text-base font-bold text-white">Pre-Flight What-If Simulator</h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Simulate how modifying legitimate pre-flight parameters (carrier, origin, departure time) impacts XGBoost delay risk predictions.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};
