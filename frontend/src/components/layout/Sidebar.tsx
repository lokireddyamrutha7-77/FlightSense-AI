import React from 'react';
import {
  LayoutDashboard,
  PlaneTakeoff,
  MapPin,
  Building2,
  Plane,
  BarChart3,
  Cpu,
  History,
  Sliders,
  Sparkles,
  Compass,
} from 'lucide-react';

export type ModuleId =
  | 'dashboard'
  | 'prediction'
  | 'route-intel'
  | 'airport-intel'
  | 'airline-intel'
  | 'analytics'
  | 'model-perf'
  | 'history'
  | 'what-if'
  | 'explainability'
  | 'map';

interface SidebarProps {
  activeModule: ModuleId;
  onSelectModule: (module: ModuleId) => void;
}

export interface NavigationItem {
  id: ModuleId;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

export const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
  { id: 'prediction', label: 'Delay Prediction', icon: PlaneTakeoff, badge: 'XGBoost' },
  { id: 'explainability', label: 'SHAP Explainability', icon: Sparkles },
  { id: 'what-if', label: 'What-If Simulation', icon: Sliders },
  { id: 'route-intel', label: 'Route Intelligence', icon: MapPin },
  { id: 'map', label: 'Interactive Map', icon: Compass },
  { id: 'airport-intel', label: 'Airport Congestion', icon: Building2 },
  { id: 'airline-intel', label: 'Airline Reliability', icon: Plane },
  { id: 'analytics', label: 'Analytics / EDA', icon: BarChart3 },
  { id: 'model-perf', label: 'Model Metrics', icon: Cpu },
  { id: 'history', label: 'Prediction Audit', icon: History },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeModule, onSelectModule }) => {
  return (
    <aside className="w-64 bg-aviation-850/95 border-r border-aviation-700/60 min-h-[calc(100vh-57px)] p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
          Commercial Flight Analytics Navigation
        </div>
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectModule(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-aviation-cyan/15 text-aviation-cyan border border-aviation-cyan/30 shadow-md shadow-aviation-cyan/5 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-aviation-800/80'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-aviation-cyan' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-aviation-cyan/20 text-aviation-cyan font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-3 bg-aviation-900/80 rounded-xl border border-aviation-700/50 text-xs text-slate-400 space-y-1">
        <div className="font-semibold text-slate-300 flex items-center justify-between">
          <span>FlightSense Platform</span>
          <span className="text-[10px] text-aviation-sky font-mono">v2.0 Production</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Real XGBoost Model (0.53 Threshold) | MySQL / SQLite Database.
        </p>
      </div>
    </aside>
  );
};
