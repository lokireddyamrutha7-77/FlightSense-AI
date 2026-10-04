import React, { useState, useEffect } from 'react';
import { X, Mail, Phone, Lock, User, CheckCircle, AlertCircle, KeyRound } from 'lucide-react';
import { apiService } from '../../services/api';
import type { UserResponse } from '../../types/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserResponse) => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess, initialMode = 'signin' }) => {
  const [tab, setTab] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [signupType, setSignupType] = useState<'email' | 'phone'>('email');
  
  // Step 1: Request Credentials / OTP, Step 2: Verify OTP
  const [step, setStep] = useState<'input' | 'verify_otp' | 'reset_password'>('input');

  // Form Fields
  const [target, setTarget] = useState(''); // email or phone
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    setTab(initialMode);
    setStep('input');
    setError(null);
    setSuccessMsg(null);
  }, [initialMode, isOpen]);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!isOpen) return null;

  const resetForm = () => {
    setError(null);
    setSuccessMsg(null);
    setDevOtp(null);
    setOtpCode('');
  };

  // 1. SIGN IN SUBMIT
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiService.login(target, password);
      localStorage.setItem('flightsense_token', res.access_token);
      localStorage.setItem('flightsense_user', JSON.stringify(res.user));
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email/phone number or password.');
    } finally {
      setLoading(false);
    }
  };

  // 2. REQUEST SIGNUP OTP
  const handleRequestSignupOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!target.trim()) {
      setError(`Please enter your ${signupType === 'email' ? 'email address' : 'phone number'}.`);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.requestSignupOTP(target.trim(), signupType, 'signup');
      setSuccessMsg(res.message);
      if (res.dev_otp) {
        setDevOtp(res.dev_otp);
      }
      setCooldown(res.cooldown_seconds || 60);
      setStep('verify_otp');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send verification OTP.');
    } finally {
      setLoading(false);
    }
  };

  // 3. VERIFY SIGNUP OTP & CREATE ACCOUNT
  const handleVerifySignupOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (otpCode.trim().length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.verifySignupOTP({
        target: target.trim(),
        target_type: signupType,
        otp_code: otpCode.trim(),
        password,
        full_name: fullName.trim() || undefined,
      });

      localStorage.setItem('flightsense_token', res.access_token);
      localStorage.setItem('flightsense_user', JSON.stringify(res.user));
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Verification failed. Please check your OTP.');
    } finally {
      setLoading(false);
    }
  };

  // 4. FORGOT PASSWORD REQUEST
  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!target.trim()) {
      setError('Please enter your registered email or phone number.');
      return;
    }

    const type = target.includes('@') ? 'email' : 'phone';
    setLoading(true);

    try {
      const res = await apiService.forgotPassword(target.trim(), type);
      setSuccessMsg(res.message);
      if (res.dev_otp) setDevOtp(res.dev_otp);
      setCooldown(res.cooldown_seconds || 60);
      setStep('reset_password');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Could not send password reset OTP.');
    } finally {
      setLoading(false);
    }
  };

  // 5. RESET PASSWORD SUBMIT
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.resetPassword(target.trim(), otpCode.trim(), password);
      setSuccessMsg(res.message);
      setTab('signin');
      setStep('input');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (cooldown > 0) return;
    setError(null);
    setLoading(true);
    try {
      const res = await apiService.requestSignupOTP(target.trim(), signupType, tab === 'forgot' ? 'reset_password' : 'signup');
      setSuccessMsg('New OTP code sent!');
      if (res.dev_otp) setDevOtp(res.dev_otp);
      setCooldown(60);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Could not resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-aviation-950/80 backdrop-blur-md">
      <div className="bg-aviation-850 border border-aviation-700/80 w-full max-w-md rounded-2xl shadow-2xl p-6 sm:p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-aviation-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header Tabs */}
        <div className="flex border-b border-aviation-700 mb-6">
          <button
            onClick={() => { setTab('signin'); setStep('input'); resetForm(); }}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all font-mono ${
              tab === 'signin'
                ? 'border-aviation-cyan text-aviation-cyan'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('signup'); setStep('input'); resetForm(); }}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all font-mono ${
              tab === 'signup'
                ? 'border-aviation-cyan text-aviation-cyan'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Alert Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/40 rounded-xl text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/40 rounded-xl text-emerald-400 text-xs flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* DEV OTP HELPER NOTICE */}
        {devOtp && (
          <div className="mb-4 p-3 bg-aviation-cyan/15 border border-aviation-cyan/40 rounded-xl text-aviation-cyan text-xs font-mono space-y-1">
            <div className="font-bold flex items-center space-x-1.5">
              <KeyRound className="w-4 h-4" />
              <span>Development OTP Code:</span>
            </div>
            <div className="text-lg tracking-widest font-extrabold text-white">{devOtp}</div>
            <p className="text-[10px] text-slate-400">Use this code to verify in development environment.</p>
          </div>
        )}

        {/* TAB 1: SIGN IN */}
        {tab === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">Email Address or Phone Number</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="user@example.com or +15550192"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full bg-aviation-900 border border-aviation-700/80 rounded-xl px-3.5 py-2.5 pl-10 text-slate-100 text-sm focus:border-aviation-cyan focus:outline-none"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 font-mono">Password</label>
                <button
                  type="button"
                  onClick={() => { setTab('forgot'); setStep('input'); resetForm(); }}
                  className="text-[11px] text-aviation-cyan hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-aviation-900 border border-aviation-700/80 rounded-xl px-3.5 py-2.5 pl-10 text-slate-100 text-sm focus:border-aviation-cyan focus:outline-none"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-aviation-cyan text-aviation-900 hover:bg-aviation-cyan/90 font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2 text-sm shadow-md"
            >
              {loading ? <span>Signing In...</span> : <span>Sign In to Dashboard</span>}
            </button>
          </form>
        )}

        {/* TAB 2: SIGN UP */}
        {tab === 'signup' && (
          <div>
            {step === 'input' && (
              <form onSubmit={handleRequestSignupOTP} className="space-y-4">
                {/* Signup Option Selector */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-aviation-900 rounded-xl border border-aviation-700 mb-2">
                  <button
                    type="button"
                    onClick={() => { setSignupType('email'); setTarget(''); }}
                    className={`flex items-center justify-center space-x-2 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                      signupType === 'email'
                        ? 'bg-aviation-cyan/20 text-aviation-cyan border border-aviation-cyan/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email Address</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSignupType('phone'); setTarget(''); }}
                    className={`flex items-center justify-center space-x-2 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                      signupType === 'phone'
                        ? 'bg-aviation-cyan/20 text-aviation-cyan border border-aviation-cyan/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Phone Number</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">Full Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-aviation-900 border border-aviation-700 rounded-xl px-3.5 py-2 text-slate-100 text-sm focus:border-aviation-cyan focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">
                    {signupType === 'email' ? 'Email Address' : 'Phone Number'}
                  </label>
                  <div className="relative">
                    <input
                      type={signupType === 'email' ? 'email' : 'tel'}
                      required
                      placeholder={signupType === 'email' ? 'user@example.com' : '+1 555-0192'}
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      className="w-full bg-aviation-900 border border-aviation-700 rounded-xl px-3.5 py-2.5 pl-10 text-slate-100 text-sm focus:border-aviation-cyan focus:outline-none"
                    />
                    {signupType === 'email' ? (
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    ) : (
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">Create Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-aviation-900 border border-aviation-700 rounded-xl px-3.5 py-2 text-slate-100 text-sm focus:border-aviation-cyan focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">Confirm Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-aviation-900 border border-aviation-700 rounded-xl px-3.5 py-2 text-slate-100 text-sm focus:border-aviation-cyan focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-aviation-cyan text-aviation-900 hover:bg-aviation-cyan/90 font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2 text-sm shadow-md"
                >
                  {loading ? <span>Sending OTP...</span> : <span>Send Verification Code</span>}
                </button>
              </form>
            )}

            {step === 'verify_otp' && (
              <form onSubmit={handleVerifySignupOTP} className="space-y-4">
                <div className="text-xs text-slate-300 text-center leading-relaxed">
                  Enter the 6-digit OTP verification code sent to <br />
                  <span className="font-mono font-bold text-aviation-cyan">{target}</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono text-center">6-Digit Verification OTP</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-aviation-900 border-2 border-aviation-cyan text-center tracking-widest text-2xl font-mono text-white rounded-xl py-3 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={cooldown > 0 || loading}
                    className="text-aviation-cyan hover:underline disabled:text-slate-500 font-mono"
                  >
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend OTP'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('input')}
                    className="text-slate-400 hover:text-white"
                  >
                    Change details
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-aviation-cyan text-aviation-900 hover:bg-aviation-cyan/90 font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2 text-sm shadow-md"
                >
                  {loading ? <span>Creating Account...</span> : <span>Verify & Complete Signup</span>}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: FORGOT PASSWORD */}
        {tab === 'forgot' && (
          <div>
            {step === 'input' && (
              <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
                <h3 className="text-sm font-bold text-white font-mono">Reset Password</h3>
                <p className="text-xs text-slate-400">Enter your registered email or phone to receive a reset code.</p>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">Email or Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="user@example.com or +15550192"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full bg-aviation-900 border border-aviation-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-aviation-cyan focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-aviation-cyan text-aviation-900 hover:bg-aviation-cyan/90 font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2 text-sm shadow-md"
                >
                  {loading ? <span>Sending Reset Code...</span> : <span>Send Reset OTP</span>}
                </button>
              </form>
            )}

            {step === 'reset_password' && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">6-Digit OTP Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-aviation-900 border border-aviation-700 text-center tracking-widest text-xl font-mono text-white rounded-xl py-2 focus:border-aviation-cyan focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-aviation-900 border border-aviation-700 rounded-xl px-3.5 py-2 text-slate-100 text-sm focus:border-aviation-cyan focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-aviation-900 border border-aviation-700 rounded-xl px-3.5 py-2 text-slate-100 text-sm focus:border-aviation-cyan focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-aviation-cyan text-aviation-900 hover:bg-aviation-cyan/90 font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2 text-sm shadow-md"
                >
                  {loading ? <span>Resetting Password...</span> : <span>Reset Password & Sign In</span>}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
