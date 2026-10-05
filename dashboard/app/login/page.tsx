'use client';

import React, { useState } from 'react';
import { smartLogin, verifyNewUserOtp, resendVerificationOtp } from '@/lib/auth';
import { Lock, Mail, ArrowRight, ShieldCheck, RefreshCw, Sparkles, Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isNewUserVerification, setIsNewUserVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setStatusMessage('');
    setLoading(true);

    try {
      const result = await smartLogin(email, password);

      if (result.status === 'logged_in') {
        setStatusMessage('Authentication verified. Loading dashboard...');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 800);
      } else if (result.status === 'needs_verification') {
        setIsNewUserVerification(true);
        setStatusMessage(`Verification code sent to ${email}`);
      } else {
        setErrorMessage(result.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      await verifyNewUserOtp(email, otpCode.trim());
      setStatusMessage('Verification successful. Granting access...');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 800);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid or expired 6-digit code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setErrorMessage('');
    try {
      await resendVerificationOtp(email);
      setStatusMessage('A fresh verification code was sent to your inbox.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-6 overflow-hidden bg-slate-50">
      {/* Soft Ambient Aqua Radiance */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-200/40 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-200/40 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="relative rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200 p-8 md:p-10 shadow-xl shadow-slate-900/5">
          
          {/* Header Brand */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 shadow-md shadow-sky-500/20">
                <ShieldCheck className="w-6 h-6 text-white" strokeWidth={2.2} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  AquaSense <span className="text-[10px] uppercase font-mono tracking-widest px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 border border-sky-200">PRO</span>
                </h1>
                <p className="text-xs text-slate-500 font-medium">IoT Telemetry & Control Portal</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-mono font-bold text-emerald-700">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>LIVE</span>
            </div>
          </div>

          {/* Title Area */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {isNewUserVerification ? 'Verify Email Address' : 'Sign In to Portal'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {isNewUserVerification
                ? `Enter the 6-digit one-time passcode sent to ${email}`
                : 'Enter your credentials to access the real-time SCADA telemetry dashboard.'}
            </p>
          </div>

          {/* Feedback Alerts */}
          <AnimatePresence mode="wait">
            {statusMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{statusMessage}</span>
              </motion.div>
            )}

            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Area */}
          {!isNewUserVerification ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-600 transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@plant.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <span className="text-[11px] text-slate-400">Min. 6 chars</span>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-600 transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/20 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Control Gateway</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 text-center">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full py-3.5 px-4 text-center tracking-[0.5em] font-mono text-2xl font-bold bg-slate-50 border border-sky-400 rounded-xl text-sky-900 placeholder-slate-300 focus:outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-500/10 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify & Continue</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-2 text-xs border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewUserVerification(false)}
                  className="text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  ← Back to sign in
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {resending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  <span>Resend Code</span>
                </button>
              </div>
            </form>
          )}

          {/* Footer Security Badge */}
          <div className="mt-8 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>256-Bit Encrypted End-to-End Supabase Row-Level Security</span>
            </p>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
