import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  KeyRound,
  Bookmark,
  Save,
  LogOut,
  Activity
} from 'lucide-react';
import { apiService } from '../../services/api';
import type { CustomerProfileResponse } from '../../types/api';

interface ProfileModuleProps {
  onLogout: () => void;
  onNavigateSavedFlights: () => void;
}

export const ProfileModule: React.FC<ProfileModuleProps> = ({ onLogout, onNavigateSavedFlights }) => {
  const [profile, setProfile] = useState<CustomerProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit fields
  const [fullName, setFullName] = useState('');
  const [airportsStr, setAirportsStr] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  // Change Password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getCustomerProfile();
      setProfile(data);
      setFullName(data.full_name || '');
      setAirportsStr((data.preferred_airports || []).join(', '));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load customer profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateMsg(null);

    const airports = airportsStr
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s.length > 0);

    try {
      const updated = await apiService.updateCustomerProfile({
        full_name: fullName,
        preferred_airports: airports,
      });
      setProfile(updated);
      setUpdateMsg('Profile updated successfully!');
    } catch (err: any) {
      setUpdateMsg(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);

    if (newPassword.length < 6) {
      setPwdMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPwdLoading(true);
    try {
      const res = await apiService.changePassword(oldPassword, newPassword);
      setPwdMsg({ type: 'success', text: res.message });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwdMsg({ type: 'error', text: err.response?.data?.detail || 'Password change failed.' });
    } finally {
      setPwdLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 font-mono text-sm">
        Loading customer account profile...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-sm">
        {error || 'Profile could not be loaded.'}
      </div>
    );
  }

  const stats = profile.stats || {
    total_predictions: 0,
    delayed_predictions_count: 0,
    most_checked_airline: 'N/A',
    most_checked_route: 'N/A',
    most_checked_airport: 'N/A',
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-aviation-850 border border-aviation-700/80 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-aviation-cyan to-blue-600 flex items-center justify-center text-aviation-900 font-bold font-mono text-2xl shadow-lg shadow-aviation-cyan/20">
            {profile.full_name
              ? profile.full_name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
              : 'FS'}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold font-mono text-white">
                {profile.full_name || 'Customer Account'}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-aviation-cyan/20 text-aviation-cyan font-bold">
                User #{profile.user_id}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
              {profile.email && (
                <div className="flex items-center space-x-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{profile.email}</span>
                  {profile.email_verified && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                      Verified
                    </span>
                  )}
                </div>
              )}

              {profile.phone_number && (
                <div className="flex items-center space-x-1 border-l border-aviation-700 pl-3">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{profile.phone_number}</span>
                  {profile.phone_verified && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                      Verified
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onNavigateSavedFlights}
            className="flex items-center space-x-2 bg-aviation-800 hover:bg-aviation-750 text-slate-200 border border-aviation-700 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
          >
            <Bookmark className="w-4 h-4 text-aviation-cyan" />
            <span>Saved Flights</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center space-x-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Account Statistics Grid (Derived from actual user data) */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold font-mono text-slate-300 uppercase tracking-wider flex items-center space-x-2">
          <Activity className="w-4 h-4 text-aviation-cyan" />
          <span>Personal Prediction History Summary</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          <div className="bg-aviation-850 border border-aviation-700/80 p-4 rounded-xl text-center space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Total Predictions</span>
            <div className="text-2xl font-bold font-mono text-white">{stats.total_predictions}</div>
          </div>

          <div className="bg-aviation-850 border border-aviation-700/80 p-4 rounded-xl text-center space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Delayed Risk Flights</span>
            <div className="text-2xl font-bold font-mono text-amber-400">{stats.delayed_predictions_count}</div>
          </div>

          <div className="bg-aviation-850 border border-aviation-700/80 p-4 rounded-xl text-center space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Top Airline</span>
            <div className="text-lg font-bold font-mono text-aviation-cyan truncate">{stats.most_checked_airline}</div>
          </div>

          <div className="bg-aviation-850 border border-aviation-700/80 p-4 rounded-xl text-center space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Top Route</span>
            <div className="text-xs font-bold font-mono text-aviation-sky truncate">{stats.most_checked_route}</div>
          </div>

          <div className="bg-aviation-850 border border-aviation-700/80 p-4 rounded-xl text-center space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Top Hub Airport</span>
            <div className="text-lg font-bold font-mono text-blue-400 truncate">{stats.most_checked_airport}</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Editable Info & Password Change */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Editable Profile Information */}
        <div className="bg-aviation-850 border border-aviation-700/80 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center space-x-2 text-white font-mono font-bold text-base border-b border-aviation-700 pb-3">
            <User className="w-5 h-5 text-aviation-cyan" />
            <span>Account Profile Information</span>
          </div>

          {updateMsg && (
            <div className="p-3 bg-aviation-cyan/15 border border-aviation-cyan/40 rounded-xl text-aviation-cyan text-xs font-mono">
              {updateMsg}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full name"
                className="w-full bg-aviation-900 border border-aviation-700 rounded-xl px-3.5 py-2 text-slate-100 text-sm focus:border-aviation-cyan focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Preferred Airport Codes (Comma-separated)</label>
              <input
                type="text"
                value={airportsStr}
                onChange={(e) => setAirportsStr(e.target.value)}
                placeholder="JFK, LAX, ORD"
                className="w-full bg-aviation-900 border border-aviation-700 rounded-xl px-3.5 py-2 text-slate-100 text-sm focus:border-aviation-cyan focus:outline-none font-mono"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isUpdating}
                className="flex items-center space-x-2 bg-aviation-cyan text-aviation-900 hover:bg-aviation-cyan/90 font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>{isUpdating ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-aviation-850 border border-aviation-700/80 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center space-x-2 text-white font-mono font-bold text-base border-b border-aviation-700 pb-3">
            <KeyRound className="w-5 h-5 text-aviation-cyan" />
            <span>Security & Change Password</span>
          </div>

          {pwdMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-mono ${
                pwdMsg.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/40 text-rose-400'
              }`}
            >
              {pwdMsg.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-aviation-900 border border-aviation-700 rounded-xl px-3.5 py-2 text-slate-100 text-sm focus:border-aviation-cyan focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full bg-aviation-900 border border-aviation-700 rounded-xl px-3.5 py-2 text-slate-100 text-sm focus:border-aviation-cyan focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full bg-aviation-900 border border-aviation-700 rounded-xl px-3.5 py-2 text-slate-100 text-sm focus:border-aviation-cyan focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={pwdLoading}
                className="flex items-center space-x-2 bg-aviation-800 hover:bg-aviation-750 border border-aviation-cyan/40 text-aviation-cyan font-bold px-5 py-2.5 rounded-xl text-xs transition-all"
              >
                <KeyRound className="w-4 h-4" />
                <span>{pwdLoading ? 'Updating Password...' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
