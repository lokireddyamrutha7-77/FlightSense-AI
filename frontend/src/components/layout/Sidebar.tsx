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
  Bookmark,
  User,
} from 'lucide-react';

export type ModuleId =
  | 'dashboard'
  | 'prediction'
  | 'saved-flights'
  | 'route-intel'
  | 'airport-intel'
  | 'airline-intel'
  | 'analytics'
  | 'model-perf'
  | 'history'
  | 'what-if'
  | 'explainability'
  | 'map'
  | 'profile';

interface SidebarProps {
  activeModule: ModuleId;
  onSelectModule: (module: ModuleId) => void;
  onOpenPublicLanding?: () => void;
}

export interface NavigationItem {
  id: ModuleId;
  label: string;
  icon: React.ElementType;
  badge?: string;
  isPrimary?: boolean;
}

export const navigationItems: NavigationItem[] = [
  { id: 'prediction', label: 'Flight Prediction', icon: PlaneTakeoff, badge: 'PRIMARY', isPrimary: true },
  { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
  { id: 'saved-flights', label: 'My Saved Flights', icon: Bookmark },
  { id: 'history', label: 'Prediction History', icon: History },
  { id: 'explainability', label: 'SHAP Explainability', icon: Sparkles },
  { id: 'what-if', label: 'What-If Simulation', icon: Sliders },
  { id: 'route-intel', label: 'Route Intelligence', icon: MapPin },
  { id: 'map', label: 'Interactive Map', icon: Compass },
  { id: 'airport-intel', label: 'Airport Congestion', icon: Building2 },
  { id: 'airline-intel', label: 'Airline Reliability', icon: Plane },
  { id: 'analytics', label: 'Analytics / EDA', icon: BarChart3 },
  { id: 'model-perf', label: 'Model Metrics', icon: Cpu },
  { id: 'profile', label: 'My Account / Profile', icon: User },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeModule, onSelectModule, onOpenPublicLanding }) => {
  return (
    <aside className="w-64 bg-aviation-850/95 border-r border-aviation-700/60 min-h-[calc(100vh-57px)] p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-3">
        {/* Section Title */}
        <div className="px-3 text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
          Aviation Platform Navigation
        </div>

        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            const isPrimary = item.isPrimary;

            return (
              <button
                key={item.id}
                onClick={() => onSelectModule(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isPrimary
                    ? isActive
                      ? 'bg-gradient-to-r from-aviation-cyan to-blue-600 text-aviation-900 font-bold border border-aviation-cyan shadow-lg shadow-aviation-cyan/20'
                      : 'bg-aviation-cyan/15 text-aviation-cyan border border-aviation-cyan/40 font-bold hover:bg-aviation-cyan/25 shadow-md shadow-aviation-cyan/10'
                    : isActive
                    ? 'bg-aviation-800 text-white border border-aviation-700 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-aviation-800/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isPrimary && !isActive ? 'text-aviation-cyan' : ''}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      isPrimary
                        ? isActive
                          ? 'bg-aviation-900 text-aviation-cyan'
                          : 'bg-aviation-cyan/20 text-aviation-cyan border border-aviation-cyan/30'
                        : 'bg-aviation-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="space-y-2 pt-4">
        {onOpenPublicLanding && (
          <button
            onClick={onOpenPublicLanding}
            className="w-full text-center text-xs font-mono text-slate-400 hover:text-aviation-cyan py-1.5 rounded-lg border border-aviation-700/50 bg-aviation-900/50 hover:bg-aviation-800 transition-all"
          >
            ← View Public Landing Page
          </button>
        )}

        <div className="p-3 bg-aviation-900/80 rounded-xl border border-aviation-700/50 text-xs text-slate-400 space-y-1">
          <div className="font-semibold text-slate-300 flex items-center justify-between">
            <span>FlightSense AI</span>
            <span className="text-[10px] text-aviation-sky font-mono">v2.0 Production</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Real XGBoost Model (0.53 Threshold) | MySQL / SQLite Database.
          </p>
        </div>
      </div>
    </aside>
  );
};

