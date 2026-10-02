import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { apiService } from '../../services/api';
import type { AnalyticsOverviewResponse } from '../../types/api';
import { BarChart3 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart as RePieChart, Pie, Cell } from 'recharts';

const COLORS = ['#00A8E8', '#F59E0B', '#3B82F6', '#EF4444', '#10B981'];

export const AnalyticsModule: React.FC = () => {
  const [data, setData] = useState<AnalyticsOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await apiService.getAnalyticsOverview();
        setData(res);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSkeleton count={3} height="h-36" />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-aviation-cyan" />
            Exploratory Data Analysis (EDA) & Historical Trends
          </h2>
          <p className="text-xs text-slate-400">Distribution of delay reasons, departure hours, and seasonal trends</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cause Breakdown Pie Chart */}
        <Card>
          <h3 className="text-sm font-bold text-slate-200 mb-4">Delay Cause Attribution Breakdown</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={data.cause_breakdown}
                  dataKey="percentage"
                  nameKey="cause"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name} (${value}%)`}
                >
                  {data.cause_breakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0B1329', borderColor: '#263B69' }} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Hourly Distribution Bar Chart */}
        <Card>
          <h3 className="text-sm font-bold text-slate-200 mb-4">Delay Probability by Scheduled Departure Hour</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hourly_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A294D" />
                <XAxis dataKey="hour" stroke="#64748B" unit="h" />
                <YAxis stroke="#64748B" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                <Tooltip contentStyle={{ backgroundColor: '#0B1329', borderColor: '#263B69' }} />
                <Bar dataKey="delay_probability" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
