import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { apiService } from '../../services/api';
import type { AnalyticsOverviewResponse, PredictionHistoryItem } from '../../types/api';
import { Plane, AlertTriangle, TrendingUp, ChevronRight, Activity } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';

interface DashboardModuleProps {
  onNavigate: (module: any) => void;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({ onNavigate }) => {
  const [data, setData] = useState<AnalyticsOverviewResponse | null>(null);
  const [history, setHistory] = useState<PredictionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [overview, histData] = await Promise.all([
          apiService.getAnalyticsOverview(),
          apiService.getPredictionHistory().catch(() => [])
        ]);
        setData(overview);
        setHistory(histData.slice(0, 5));
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard overview data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSkeleton count={4} height="h-32" />;

  if (error || !data) {
    return (
      <Card className="border-rose-500/30">
        <div className="flex items-center space-x-3 text-rose-400 mb-2">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="font-semibold text-lg">Failed to Load Dashboard</h3>
        </div>
        <p className="text-sm text-slate-300 mb-4">{error}</p>
        <Button size="sm" onClick={() => window.location.reload()}>Retry Connection</Button>
      </Card>
    );
  }

  const COLORS = ['#00A8E8', '#F59E0B', '#EF4444', '#10B981', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* PRIMARY FEATURE HERO BANNER: Flight Delay Prediction Visual Emphasis */}
      <div className="bg-gradient-to-r from-aviation-850 via-aviation-900 to-aviation-850 border-2 border-aviation-cyan/50 rounded-2xl p-6 shadow-2xl shadow-aviation-cyan/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-aviation-cyan/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-aviation-cyan text-aviation-900 font-extrabold uppercase tracking-wider">
                PRIMARY PLATFORM FEATURE
              </span>
              <span className="text-xs text-aviation-sky font-mono font-semibold">XGBoost ML Engine</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold text-white font-mono tracking-tight">
              FLIGHT DELAY PREDICTION
            </h2>

            <p className="text-xs md:text-sm text-slate-300 font-sans leading-relaxed">
              Enter flight details &rarr; Get delay probability &rarr; See risk level &rarr; Understand key SHAP factors.
            </p>
          </div>

          <button
            onClick={() => onNavigate('prediction')}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-aviation-cyan to-blue-600 hover:from-aviation-cyan/90 hover:to-blue-500 text-aviation-900 font-extrabold px-6 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-aviation-cyan/25 transform hover:-translate-y-0.5 shrink-0"
          >
            <Plane className="w-5 h-5 transform -rotate-45" />
            <span>Launch Delay Prediction</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card glow>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono font-medium">TOTAL FLIGHTS ANALYZED</span>
            <Plane className="w-4 h-4 text-aviation-cyan" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {data.total_flights_analyzed.toLocaleString()}
          </div>
          <div className="text-xs text-emerald-400 mt-1 font-medium">Dataset Coverage: 2015-2026</div>
        </Card>

        <Card>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono font-medium">HISTORICAL DELAY RATE</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            {(data.overall_delay_rate * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-slate-400 mt-1">Arrival Delay &ge; 15 mins</div>
        </Card>

        <Card>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono font-medium">PRODUCTION MODEL</span>
            <Activity className="w-4 h-4 text-aviation-sky" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            XGBoost
          </div>
          <div className="text-xs text-slate-400 mt-1">ROC-AUC: <strong className="text-aviation-cyan">0.6182</strong> | F1: <strong className="text-amber-400">0.2945</strong></div>
        </Card>

        <Card>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono font-medium">PRIMARY DELAY DRIVER</span>
            <TrendingUp className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-sm font-semibold text-slate-100 truncate mt-1">
            {data.top_delay_reason}
          </div>
          <Badge variant="warning" className="mt-2">High Impact</Badge>
        </Card>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Monthly Delay Rate Trend</h3>
              <p className="text-xs text-slate-400">Historical delay probability across calendar months</p>
            </div>
            <Badge variant="info">5.7M Flights</Badge>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthly_trends}>
                <defs>
                  <linearGradient id="colorDelay" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00A8E8" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#00A8E8" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A294D" />
                <XAxis dataKey="month" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B1329', borderColor: '#263B69', borderRadius: '8px' }}
                  formatter={(val: any) => [`${(val * 100).toFixed(1)}%`, 'Delay Rate']}
                />
                <Area type="monotone" dataKey="delay_rate" stroke="#00A8E8" strokeWidth={2} fillOpacity={1} fill="url(#colorDelay)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="mb-4">
            <h3 className="text-base font-bold text-white">Delay Cause Distribution</h3>
            <p className="text-xs text-slate-400">Attribution across operational delay factors</p>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.cause_breakdown}
                  dataKey="percentage"
                  nameKey="cause"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={45}
                  paddingAngle={4}
                  label={({ name, value }: any) => `${(name || '').split(' ')[0]} ${value}%`}
                >
                  {data.cause_breakdown.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B1329', borderColor: '#263B69', borderRadius: '8px' }}
                  formatter={(val: any) => [`${val}%`, 'Share']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Hourly Departure Pattern & Recent Audited Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="mb-4">
            <h3 className="text-base font-bold text-white">Hourly Departure Delay Probability</h3>
            <p className="text-xs text-slate-400">Risk progression throughout the departure day (0-23h)</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hourly_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A294D" />
                <XAxis dataKey="hour" stroke="#64748B" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B1329', borderColor: '#263B69', borderRadius: '8px' }}
                  formatter={(val: any) => [`${(val * 100).toFixed(1)}%`, 'Delay Risk']}
                />
                <Bar dataKey="delay_probability" fill="#38BDF8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Recent Audited Predictions</h3>
              <p className="text-xs text-slate-400">Real-time XGBoost inference logs saved to DB</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => onNavigate('history')}>
              View All History <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          {history.length > 0 ? (
            <div className="space-y-2 text-xs">
              {history.map((item) => (
                <div
                  key={item.prediction_id}
                  className="flex items-center justify-between p-2.5 bg-aviation-800/60 border border-aviation-700/50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="font-mono font-bold text-aviation-cyan">{item.flight_number}</div>
                    <div className="text-slate-300 font-medium">{item.origin} &rarr; {item.destination}</div>
                    <span className="text-slate-500 font-mono">({item.carrier})</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right font-mono">
                      <div className="text-white font-bold">{(item.delay_probability * 100).toFixed(1)}%</div>
                      <div className="text-[10px] text-slate-400">{item.predicted_class || (item.is_delayed ? 'DELAYED' : 'ON TIME')}</div>
                    </div>
                    <Badge
                      variant={
                        item.risk_level.includes('High') || item.risk_level.includes('Severe')
                          ? 'danger'
                          : item.risk_level.includes('Moderate')
                          ? 'warning'
                          : 'success'
                      }
                    >
                      {item.risk_level}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">
              No recent prediction logs stored in database yet.
              <div className="mt-2">
                <Button size="sm" onClick={() => onNavigate('prediction')}>
                  Run First Prediction
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
