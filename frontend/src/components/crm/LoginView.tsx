import React, { useState } from 'react';

interface LoginViewProps {
  authMode: 'login' | 'register' | 'setup';
  setAuthMode: (mode: 'login' | 'register' | 'setup') => void;
  authForm: any;
  setAuthForm: (form: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  setupRequired?: boolean;
  onSetupSubmit?: (setupData: any) => Promise<boolean>;
}

export default function LoginView({
  authMode,
  setAuthMode,
  authForm,
  setAuthForm,
  onSubmit,
  addToast,
  setupRequired,
  onSetupSubmit
}: LoginViewProps) {
  // Local state for setup form
  const [setupData, setSetupData] = useState({
    companyName: '',
    companyEmail: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLocalSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Field validations
    if (!setupData.companyName.trim()) {
      setError('Company Name is required.');
      return;
    }
    if (!setupData.companyEmail.trim()) {
      setError('Company Email is required.');
      return;
    }
    if (!setupData.name.trim()) {
      setError('Super Admin Name is required.');
      return;
    }
    if (!setupData.email.trim()) {
      setError('Super Admin Email is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(setupData.email) || !emailRegex.test(setupData.companyEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (setupData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (setupData.password !== setupData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (onSetupSubmit) {
        const ok = await onSetupSubmit({
          companyName: setupData.companyName,
          companyEmail: setupData.companyEmail,
          name: setupData.name,
          email: setupData.email,
          password: setupData.password
        });
        if (!ok) {
          setError('Setup execution failed. Please verify database connection.');
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Initial setup failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocalLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Format validations
    if (!authForm.email.trim()) {
      setError('Email address is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authForm.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!authForm.password) {
      setError('Password is required.');
      return;
    }
    if (authForm.password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(e);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Invalid email or password.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const selectQuickAccount = (email: string) => {
    setError('');
    setAuthForm({ ...authForm, email, password: 'password' });
    addToast('info', `Credential filled for ${email}`);
  };

  const isSetup = authMode === 'setup' || setupRequired;

  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center p-4 transition-colors duration-350">
      <div className="max-w-md w-full bg-card rounded-2xl shadow-2xl border border-border-crm overflow-hidden text-txt-primary transition-colors duration-350">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">CRM 360</h1>
          <p className="text-blue-100 mt-2 text-sm font-semibold">
            {isSetup 
              ? 'Enterprise Organization & Super Admin Setup'
              : 'Unified Platform for High-Performance Enterprise Sales'
            }
          </p>
        </div>

        <div className="p-8">
          {/* Header tabs - only show if first-run setup is NOT active */}
          {!isSetup ? (
            <div className="flex border-b border-border-crm mb-6">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setAuthMode('login');
                }}
                className={`flex-1 pb-3 font-bold text-sm transition-colors ${authMode === 'login' ? 'text-primary border-b-2 border-primary' : 'text-txt-secondary'}`}
              >
                Sign In
              </button>
            </div>
          ) : (
            <div className="flex border-b border-border-crm mb-6 justify-center">
              <span className="pb-3 font-extrabold text-sm text-amber-500 border-b-2 border-amber-500">
                ⚙️ DATABASE INITIAL SETUP
              </span>
            </div>
          )}

          {/* Validation Alert Box */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 px-4 py-2.5 rounded-xl text-xs font-semibold mb-4 leading-relaxed transition-all">
              ⚠️ {error}
            </div>
          )}

          {isSetup ? (
            /* First time Odoo setup registration form */
            <form onSubmit={handleLocalSetupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-txt-secondary mb-1">Company Name</label>
                <input
                  type="text" required
                  className="w-full border border-border-crm rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-txt-primary bg-bg-main transition"
                  placeholder="e.g. Acme Corporation"
                  value={setupData.companyName}
                  onChange={e => {
                    setError('');
                    setSetupData({ ...setupData, companyName: e.target.value });
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-txt-secondary mb-1">Company Email</label>
                <input
                  type="email" required
                  className="w-full border border-border-crm rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-txt-primary bg-bg-main transition"
                  placeholder="e.g. contact@acme.com"
                  value={setupData.companyEmail}
                  onChange={e => {
                    setError('');
                    setSetupData({ ...setupData, companyEmail: e.target.value });
                  }}
                />
              </div>

              <div className="border-t border-border-crm my-4 pt-4">
                <span className="text-xs font-bold text-txt-secondary block mb-2">SUPER ADMIN CREDENTIALS</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-txt-secondary mb-1">Super Admin Name</label>
                <input
                  type="text" required
                  className="w-full border border-border-crm rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-txt-primary bg-bg-main transition"
                  placeholder="e.g. Administrator"
                  value={setupData.name}
                  onChange={e => {
                    setError('');
                    setSetupData({ ...setupData, name: e.target.value });
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-txt-secondary mb-1">Super Admin Email</label>
                <input
                  type="email" required
                  className="w-full border border-border-crm rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-txt-primary bg-bg-main transition"
                  placeholder="e.g. admin@acme.com"
                  value={setupData.email}
                  onChange={e => {
                    setError('');
                    setSetupData({ ...setupData, email: e.target.value });
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-txt-secondary mb-1">Password</label>
                <input
                  type="password" required
                  className="w-full border border-border-crm rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-txt-primary bg-bg-main transition"
                  placeholder="••••••••"
                  value={setupData.password}
                  onChange={e => {
                    setError('');
                    setSetupData({ ...setupData, password: e.target.value });
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-txt-secondary mb-1">Confirm Password</label>
                <input
                  type="password" required
                  className="w-full border border-border-crm rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-txt-primary bg-bg-main transition"
                  placeholder="••••••••"
                  value={setupData.confirmPassword}
                  onChange={e => {
                    setError('');
                    setSetupData({ ...setupData, confirmPassword: e.target.value });
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-semibold transition mt-6 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Initializing organization...' : 'Initialize CRM Organization'}
              </button>
            </form>
          ) : (
            /* Normal Login Form */
            <form onSubmit={handleLocalLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-txt-secondary mb-1">Email Address</label>
                <input
                  type="email" required
                  className="w-full border border-border-crm rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-txt-primary bg-bg-main transition"
                  placeholder="name@company.com"
                  value={authForm.email}
                  onChange={e => {
                    setError('');
                    setAuthForm({ ...authForm, email: e.target.value });
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-txt-secondary mb-1">Password</label>
                <input
                  type="password" required
                  className="w-full border border-border-crm rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-txt-primary bg-bg-main transition"
                  placeholder="••••••••"
                  value={authForm.password}
                  onChange={e => {
                    setError('');
                    setAuthForm({ ...authForm, password: e.target.value });
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs mt-2">
                <label className="flex items-center space-x-2 text-txt-secondary cursor-pointer">
                  <input type="checkbox" className="rounded text-blue-550 border-border-crm bg-bg-main focus:ring-0" />
                  <span>Remember me</span>
                </label>
                <a href="#" className="text-primary hover:underline font-semibold">Forgot password?</a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-semibold transition mt-6 cursor-pointer shadow-md disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In to Dashboard'}
              </button>
            </form>
          )}


        </div>
      </div>
    </div>
  );
}
