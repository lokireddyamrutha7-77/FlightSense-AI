import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { apiService } from '../../services/api';
import type { RouteIntelligenceResponse } from '../../types/api';
import { MapPin } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const RouteIntelModule: React.FC = () => {
  const [data, setData] = useState<RouteIntelligenceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await apiService.getRouteIntelligence();
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Failed to load route intelligence');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSkeleton count={3} height="h-36" />;
  if (error || !data) return <div className="text-rose-400 p-4">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-aviation-cyan" />
            Route Corridor Bottleneck Intelligence
          </h2>
          <p className="text-xs text-slate-400">Analysis of high-volume flight corridors and bottleneck delay scores</p>
        </div>
        <Badge variant="info">Top 8 Domestic Corridors</Badge>
      </div>

      {/* Corridor Chart */}
      <Card>
        <h3 className="text-sm font-bold text-slate-200 mb-3">Average Delay Minutes by Route Corridor</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.routes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A294D" />
              <XAxis dataKey="route_id" stroke="#64748B" />
              <YAxis stroke="#64748B" unit=" min" />
              <Tooltip contentStyle={{ backgroundColor: '#0B1329', borderColor: '#263B69' }} />
              <Bar dataKey="avg_delay_minutes" fill="#00A8E8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Routes Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-aviation-900 border-b border-aviation-700/60 font-mono uppercase text-slate-400">
              <tr>
                <th className="p-3">Rank</th>
                <th className="p-3">Route ID</th>
                <th className="p-3">Origin &rarr; Dest</th>
                <th className="p-3">Total Flights</th>
                <th className="p-3">Avg Delay</th>
                <th className="p-3">On-Time %</th>
                <th className="p-3">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aviation-800">
              {data.routes.map((route) => (
                <tr key={route.route_id} className="hover:bg-aviation-800/40">
                  <td className="p-3 font-mono text-aviation-cyan">#{route.bottleneck_rank}</td>
                  <td className="p-3 font-bold text-white">{route.route_id}</td>
                  <td className="p-3">{route.origin} &rarr; {route.destination}</td>
                  <td className="p-3 font-mono">{route.total_flights.toLocaleString()}</td>
                  <td className="p-3 font-mono font-semibold text-amber-400">{route.avg_delay_minutes} mins</td>
                  <td className="p-3 font-mono text-emerald-400">{route.on_time_percentage}%</td>
                  <td className="p-3">
                    <Badge variant={route.delay_risk_score > 65 ? 'danger' : route.delay_risk_score > 45 ? 'warning' : 'success'}>
                      {route.delay_risk_score > 65 ? 'High Risk' : route.delay_risk_score > 45 ? 'Moderate' : 'Low Risk'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
