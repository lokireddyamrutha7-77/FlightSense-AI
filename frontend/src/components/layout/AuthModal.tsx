import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { apiService } from '../../services/api';
import type { UserResponse } from '../../types/api';
import { ShieldCheck, User, Mail, Lock, X, AlertTriangle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserResponse) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await apiService.login(email, password);
        localStorage.setItem('flightsense_token', res.access_token);
        localStorage.setItem('flightsense_user', JSON.stringify(res.user));
        onSuccess(res.user);
        onClose();
      } else {
        const res = await apiService.register(email, password, fullName);
        localStorage.setItem('flightsense_token', res.access_token);
        localStorage.setItem('flightsense_user', JSON.stringify(res.user));
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <Card glow className="w-full max-w-md relative space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-aviation-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-aviation-sky">
          <ShieldCheck className="w-6 h-6" />
          <h3 className="text-lg font-bold text-white">
            {mode === 'login' ? 'FlightSense Sign In' : 'Create FlightSense Account'}
          </h3>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-aviation-700/60 font-medium text-xs">
          <button
            onClick={() => { setMode('login'); setError(null); }}
            className={`py-2 px-4 border-b-2 font-semibold transition-all ${
              mode === 'login'
                ? 'border-aviation-cyan text-aviation-cyan'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('register'); setError(null); }}
            className={`py-2 px-4 border-b-2 font-semibold transition-all ${
              mode === 'register'
                ? 'border-aviation-cyan text-aviation-cyan'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'register' && (
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-aviation-900 border border-aviation-700 rounded-lg pl-9 pr-3 py-2 text-slate-200 focus:border-aviation-cyan focus:outline-none"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="email"
                placeholder="analyst@airline.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-aviation-900 border border-aviation-700 rounded-lg pl-9 pr-3 py-2 text-slate-200 focus:border-aviation-cyan focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-aviation-900 border border-aviation-700 rounded-lg pl-9 pr-3 py-2 text-slate-200 focus:border-aviation-cyan focus:outline-none"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" className="w-full" isLoading={loading}>
            {mode === 'login' ? 'Sign In to Dashboard' : 'Register Account'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
