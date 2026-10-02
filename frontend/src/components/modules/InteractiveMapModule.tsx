import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { MapPin } from 'lucide-react';

interface AirportNode {
  code: string;
  name: string;
  city: string;
  x: number; // SVG X %
  y: number; // SVG Y %
  delayRate: number;
  flightVolume: number;
  congestion: number;
}

const AIRPORTS: AirportNode[] = [
  { code: 'JFK', name: 'John F. Kennedy Intl', city: 'New York, NY', x: 88, y: 32, delayRate: 21.4, flightVolume: 420000, congestion: 84 },
  { code: 'BOS', name: 'Boston Logan Intl', city: 'Boston, MA', x: 93, y: 26, delayRate: 19.8, flightVolume: 180000, congestion: 72 },
  { code: 'ATL', name: 'Hartsfield-Jackson Atlanta', city: 'Atlanta, GA', x: 74, y: 62, delayRate: 18.2, flightVolume: 890000, congestion: 78 },
  { code: 'ORD', name: 'Chicago O\'Hare Intl', city: 'Chicago, IL', x: 67, y: 34, delayRate: 23.6, flightVolume: 740000, congestion: 92 },
  { code: 'DFW', name: 'Dallas/Fort Worth Intl', city: 'Dallas, TX', x: 52, y: 68, delayRate: 20.1, flightVolume: 670000, congestion: 81 },
  { code: 'DEN', name: 'Denver Intl', city: 'Denver, CO', x: 39, y: 44, delayRate: 17.5, flightVolume: 580000, congestion: 69 },
  { code: 'LAX', name: 'Los Angeles Intl', city: 'Los Angeles, CA', x: 14, y: 58, delayRate: 16.9, flightVolume: 610000, congestion: 75 },
  { code: 'SFO', name: 'San Francisco Intl', city: 'San Francisco, CA', x: 10, y: 42, delayRate: 22.8, flightVolume: 430000, congestion: 88 },
  { code: 'SEA', name: 'Seattle-Tacoma Intl', city: 'Seattle, WA', x: 15, y: 16, delayRate: 14.2, flightVolume: 390000, congestion: 62 },
  { code: 'MIA', name: 'Miami Intl', city: 'Miami, FL', x: 83, y: 84, delayRate: 19.1, flightVolume: 350000, congestion: 71 },
];

const ROUTES = [
  { from: 'JFK', to: 'LAX', delayRate: 22.4, risk: 'High' },
  { from: 'ORD', to: 'ATL', delayRate: 24.1, risk: 'High' },
  { from: 'DFW', to: 'ORD', delayRate: 19.8, risk: 'Moderate' },
  { from: 'DEN', to: 'SFO', delayRate: 18.5, risk: 'Moderate' },
  { from: 'ATL', to: 'MIA', delayRate: 16.2, risk: 'Low' },
  { from: 'SEA', to: 'LAX', delayRate: 13.9, risk: 'Low' },
];

export const InteractiveMapModule: React.FC = () => {
  const [selectedAirport, setSelectedAirport] = useState<AirportNode>(AIRPORTS[0]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-aviation-cyan" />
            Supported Dataset Airport Locations & Flight Corridors
          </h2>
          <p className="text-xs text-slate-400">
            Visualization of major US hub airport locations and high-density flight corridors present in historical dataset
          </p>
        </div>
        <Badge variant="info">Supported Dataset Hubs</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Map Visual */}
        <Card className="lg:col-span-8 p-4 relative overflow-hidden bg-aviation-900 border-aviation-700/60">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
            <span>DATASET VISUALIZATION: MAJOR US HUB CORRIDORS</span>
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span><span>High Risk (&ge;20%)</span></span>
              <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span><span>Moderate (17-20%)</span></span>
              <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span><span>Low (&lt;17%)</span></span>
            </div>
          </div>

          <div className="relative w-full h-[380px] bg-aviation-950/80 rounded-xl border border-aviation-800 p-4">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Route lines */}
              {ROUTES.map((route, idx) => {
                const a1 = AIRPORTS.find((a) => a.code === route.from);
                const a2 = AIRPORTS.find((a) => a.code === route.to);
                if (!a1 || !a2) return null;
                const strokeColor = route.risk === 'High' ? '#F43F5E' : route.risk === 'Moderate' ? '#F59E0B' : '#10B981';
                return (
                  <line
                    key={idx}
                    x1={`${a1.x}%`}
                    y1={`${a1.y}%`}
                    x2={`${a2.x}%`}
                    y2={`${a2.y}%`}
                    stroke={strokeColor}
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    opacity="0.6"
                  />
                );
              })}
            </svg>

            {/* Airport Nodes */}
            {AIRPORTS.map((ap) => {
              const isSelected = selectedAirport.code === ap.code;
              const bgColor = ap.delayRate >= 20 ? 'bg-rose-500' : ap.delayRate >= 17 ? 'bg-amber-400' : 'bg-emerald-400';
              return (
                <button
                  key={ap.code}
                  onClick={() => setSelectedAirport(ap)}
                  style={{ left: `${ap.x}%`, top: `${ap.y}%` }}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center space-x-1.5 p-1 rounded-full transition-all duration-200 group ${
                    isSelected ? 'scale-125 z-20 ring-4 ring-aviation-cyan/50' : 'hover:scale-110 z-10'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full ${bgColor} shadow-md flex items-center justify-center text-[8px] font-bold text-slate-950`}>
                    {ap.code[0]}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-200 bg-aviation-900/90 px-1.5 py-0.5 rounded border border-aviation-700 shadow">
                    {ap.code}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Selected Airport Detail Panel */}
        <Card glow className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between border-b border-aviation-700/60 pb-3">
            <div>
              <span className="text-xs font-mono text-slate-400">SELECTED HUB AIRPORT</span>
              <h3 className="text-xl font-bold text-white font-mono">{selectedAirport.code}</h3>
              <p className="text-xs text-slate-300">{selectedAirport.name}</p>
            </div>
            <Badge variant={selectedAirport.delayRate >= 20 ? 'danger' : 'warning'}>
              {selectedAirport.city}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-aviation-900/80 rounded-xl border border-aviation-700/50">
              <div className="text-[11px] text-slate-400">Delay Rate</div>
              <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                {selectedAirport.delayRate}%
              </div>
            </div>
            <div className="p-3 bg-aviation-900/80 rounded-xl border border-aviation-700/50">
              <div className="text-[11px] text-slate-400">Congestion Score</div>
              <div className="text-2xl font-bold font-mono text-aviation-cyan mt-1">
                {selectedAirport.congestion} / 100
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 bg-aviation-900/60 rounded border border-aviation-700/40">
              <span className="text-slate-400">Annual Flight Volume:</span>
              <span className="font-mono text-white font-bold">{selectedAirport.flightVolume.toLocaleString()} flights</span>
            </div>
            <div className="flex justify-between p-2 bg-aviation-900/60 rounded border border-aviation-700/40">
              <span className="text-slate-400">Peak Congestion Period:</span>
              <span className="font-mono text-amber-400">17:00 - 20:00 UTC</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
