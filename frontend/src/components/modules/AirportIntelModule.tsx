import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { apiService } from '../../services/api';
import type { AirportIntelligenceResponse } from '../../types/api';
import { Building2 } from 'lucide-react';

export const AirportIntelModule: React.FC = () => {
  const [data, setData] = useState<AirportIntelligenceResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await apiService.getAirportIntelligence();
        setData(res);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSkeleton count={3} height="h-32" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-aviation-cyan" />
            Airport Congestion & Delay Matrix
          </h2>
          <p className="text-xs text-slate-400">Ground operations, airspace congestion, and weather sensitivity</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data?.airports.map((airport) => (
          <Card key={airport.code} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold font-mono text-aviation-cyan">{airport.code}</span>
              <Badge variant={airport.weather_impact_level === 'High' ? 'danger' : 'neutral'}>
                Weather: {airport.weather_impact_level}
              </Badge>
            </div>
            <div className="text-xs font-semibold text-slate-200">{airport.name}</div>
            <div className="text-[11px] text-slate-400">{airport.city}</div>

            <div className="border-t border-aviation-700/50 pt-2 mt-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Congestion Score:</span>
                <span className="font-mono font-bold text-amber-400">{airport.congestion_score}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Avg Departure Delay:</span>
                <span className="font-mono text-slate-200">{airport.avg_dep_delay} mins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Avg Arrival Delay:</span>
                <span className="font-mono text-slate-200">{airport.avg_arr_delay} mins</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
