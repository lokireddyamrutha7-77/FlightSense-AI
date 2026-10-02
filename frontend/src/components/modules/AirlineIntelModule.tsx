import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { apiService } from '../../services/api';
import type { AirlineIntelligenceResponse } from '../../types/api';
import { Plane } from 'lucide-react';

export const AirlineIntelModule: React.FC = () => {
  const [data, setData] = useState<AirlineIntelligenceResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await apiService.getAirlineIntelligence();
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
            <Plane className="w-5 h-5 text-aviation-cyan" />
            Airline Reliability & On-Time Performance (OTP)
          </h2>
          <p className="text-xs text-slate-400">Carrier comparisons, fleet ratings, and delay share benchmarks</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.airlines.map((airline) => (
          <Card key={airline.code} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold font-mono text-aviation-cyan">{airline.code}</span>
                <span className="text-sm font-bold text-white">{airline.name}</span>
              </div>
              <Badge variant="success">Rating: {airline.fleet_reliability_rating}</Badge>
            </div>

            <div className="bg-aviation-900/80 p-3 rounded-xl border border-aviation-700/50 flex justify-between items-center">
              <span className="text-xs text-slate-400">On-Time Performance (OTP)</span>
              <span className="text-2xl font-extrabold font-mono text-emerald-400">
                {airline.on_time_performance}%
              </span>
            </div>

            <div className="space-y-1 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Avg Delay Duration:</span>
                <span className="font-mono text-amber-400">{airline.avg_delay_minutes} mins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Carrier Cause Share:</span>
                <span className="font-mono text-slate-200">{airline.carrier_delay_share}%</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
