import React from 'react';
import { HealthBadge } from './HealthBadge';
import { Plane, User, LogOut, Bookmark } from 'lucide-react';
import type { UserResponse } from '../../types/api';

interface HeaderProps {
  activeModuleTitle: string;
  currentUser: UserResponse | null;
  onNavigateModule: (module: any) => void;
  onOpenAuthModal: (mode?: 'signin' | 'signup') => void;
  onLogout: () => void;
  onOpenLanding: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeModuleTitle,
  currentUser,
  onNavigateModule,
  onOpenAuthModal,
  onLogout,
  onOpenLanding,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-aviation-900/90 backdrop-blur-md border-b border-aviation-700/60 px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button
          onClick={onOpenLanding}
          className="flex items-center space-x-2 text-aviation-sky hover:text-white transition-all group"
          title="Return to Public Landing Page"
        >
          <div className="p-1.5 bg-aviation-sky/10 border border-aviation-sky/30 rounded-lg group-hover:border-aviation-cyan">
            <Plane className="w-5 h-5 text-aviation-cyan transform -rotate-45" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono">
            FlightSense <span className="text-aviation-cyan">AI</span>
          </h1>
        </button>

        <span className="text-slate-600">/</span>
        <h2 className="text-sm font-semibold text-slate-300">{activeModuleTitle}</h2>
      </div>

      <div className="flex items-center space-x-5">
        <HealthBadge />

        <div className="flex items-center space-x-3 border-l border-aviation-700/60 pl-4">
          {currentUser ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onNavigateModule('saved-flights')}
                className="p-2 text-slate-300 hover:text-aviation-cyan hover:bg-aviation-800 rounded-lg transition-all"
                title="View My Saved Flights"
              >
                <Bookmark className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigateModule('profile')}
                className="flex items-center space-x-2 bg-aviation-800 hover:bg-aviation-750 border border-aviation-cyan/40 px-3 py-1.5 rounded-xl transition-all"
                title="Open My Customer Profile"
              >
                <User className="w-4 h-4 text-aviation-cyan" />
                <span className="text-xs font-mono font-bold text-slate-200">
                  {currentUser.full_name || currentUser.email || currentUser.phone_number || 'My Profile'}
                </span>
              </button>

              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                title="Logout Account"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onOpenAuthModal('signin')}
                className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition-all"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuthModal('signup')}
                className="flex items-center space-x-1.5 bg-aviation-cyan text-aviation-900 hover:bg-aviation-cyan/90 font-bold px-3 py-1.5 rounded-xl text-xs transition-all shadow-md"
              >
                <User className="w-3.5 h-3.5" />
                <span>Get Started</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

