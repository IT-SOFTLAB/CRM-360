"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/auth.service';

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing invitation token');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setStatus('error');
      setMessage('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setStatus('idle');
    try {
      const res = await authService.acceptInvitation({ token, password });
      setStatus('success');
      setMessage('Account activated successfully! Redirecting to login page...');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.response?.data?.message || 'Failed to activate account. Invitation may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden text-slate-100 p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-blue-500">CRM 360</h1>
          <p className="text-slate-400 text-sm mt-1">Activate Your Sales Account</p>
        </div>

        {status === 'success' ? (
          <div className="bg-emerald-950/50 border border-emerald-500/50 rounded-xl p-4 text-emerald-400 text-sm text-center">
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status === 'error' && (
              <div className="bg-rose-950/50 border border-rose-500/50 rounded-xl p-4 text-rose-400 text-sm text-center">
                {message}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Set Password</label>
              <input
                type="password"
                required
                disabled={loading}
                className="w-full border border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-slate-100 bg-slate-700"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Confirm Password</label>
              <input
                type="password"
                required
                disabled={loading}
                className="w-full border border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-slate-100 bg-slate-700"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-semibold transition mt-6 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Activating Account...' : 'Set Password & Activate'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        Loading...
      </div>
    }>
      <AcceptInvitationContent />
    </Suspense>
  );
}
