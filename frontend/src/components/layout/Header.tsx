import React, { useState, useEffect } from 'react';
import { HealthBadge } from './HealthBadge';
import { AuthModal } from './AuthModal';
import { Plane, User, LogOut } from 'lucide-react';
import type { UserResponse } from '../../types/api';

interface HeaderProps {
  activeModuleTitle: string;
}

export const Header: React.FC<HeaderProps> = ({ activeModuleTitle }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('flightsense_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('flightsense_user');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('flightsense_token');
    localStorage.removeItem('flightsense_user');
    setUser(null);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-aviation-900/90 backdrop-blur-md border-b border-aviation-700/60 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-aviation-sky">
            <Plane className="w-6 h-6 transform -rotate-45" />
            <h1 className="text-xl font-bold tracking-tight text-white font-mono">
              FlightSense <span className="text-aviation-cyan">AI</span>
            </h1>
          </div>
          <span className="text-slate-600">/</span>
          <h2 className="text-sm font-semibold text-slate-300">{activeModuleTitle}</h2>
        </div>

        <div className="flex items-center space-x-5">
          <HealthBadge />

          <div className="flex items-center space-x-3 border-l border-aviation-700/60 pl-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-aviation-800 border border-aviation-cyan/40 px-3 py-1 rounded-lg">
                  <User className="w-4 h-4 text-aviation-cyan" />
                  <span className="text-xs font-mono font-bold text-slate-200">{user.full_name || user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                  title="Logout Session"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center space-x-2 bg-aviation-cyan/15 border border-aviation-cyan/40 text-aviation-cyan hover:bg-aviation-cyan/25 px-3 py-1 rounded-lg text-xs font-semibold transition-all"
              >
                <User className="w-4 h-4" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(u) => setUser(u)}
      />
    </>
  );
};
