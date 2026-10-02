import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import type { HealthResponse } from '../../types/api';
import { Activity, AlertTriangle } from 'lucide-react';

export const HealthBadge: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const data = await apiService.checkHealth();
      setHealth(data);
      setError(false);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000); // Check every 15 sec
    return () => clearInterval(interval);
  }, []);

  if (loading && !health) {
    return (
      <div className="flex items-center space-x-2 px-3 py-1 bg-aviation-800 border border-aviation-700 rounded-full text-xs text-slate-400">
        <Activity className="w-3.5 h-3.5 animate-spin text-aviation-sky" />
        <span>Connecting Backend...</span>
      </div>
    );
  }

  if (error || !health) {
    return (
      <button 
        onClick={fetchHealth}
        className="flex items-center space-x-2 px-3 py-1 bg-rose-500/10 border border-rose-500/30 rounded-full text-xs text-rose-400 hover:bg-rose-500/20 transition-all"
        title="Backend unreachable. Click to retry connection."
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>Backend Offline (Retry)</span>
      </button>
    );
  }

  return (
    <div className="flex items-center space-x-3 bg-aviation-850 border border-aviation-700/80 px-3 py-1.5 rounded-full text-xs">
      <div className="flex items-center space-x-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-medium text-emerald-400">API Operational</span>
      </div>
      <span className="text-slate-600">|</span>
      <span className="text-slate-300">Model: <strong className="text-aviation-cyan">{health.ml_model_status}</strong></span>
    </div>
  );
};
