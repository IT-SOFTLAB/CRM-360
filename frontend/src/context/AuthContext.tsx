"use client";

import React, { createContext, useState, useEffect, useContext } from 'react';
import { User, AuthForm } from '../types/user';
import { authService } from '../services/auth.service';
import { ToastContext } from './ToastContext';
import { DEFAULT_AUTH_FORM } from '../utils/constants';
import api from '../services/api';

export interface AuthContextType {
  mounted: boolean;
  setMounted: React.Dispatch<React.SetStateAction<boolean>>;
  /** true once the silent token-refresh check on page load is complete */
  authReady: boolean;
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  authMode: 'login' | 'register' | 'setup'| 'forgotPassword' ;
  setAuthMode: React.Dispatch<React.SetStateAction<'login' | 'register' | 'setup' | 'forgotPassword'>>;
  authForm: AuthForm;
  setAuthForm: React.Dispatch<React.SetStateAction<AuthForm>>;
  handleAuthSubmit: (e: React.FormEvent, onSuccess?: () => void) => Promise<void>;
  handleLogout: () => void;
  selectQuickAccount: (email: string) => void;
  setupRequired: boolean;
  setSetupRequired: React.Dispatch<React.SetStateAction<boolean>>;
  handleSetupSubmit: (setupData: any, onSuccess?: () => void) => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register' |"forgotPassword"| 'setup'>('login');
  const [authForm, setAuthForm] = useState<AuthForm>(DEFAULT_AUTH_FORM);
  const [setupRequired, setSetupRequired] = useState(false);
  const toastCtx = useContext(ToastContext);

  useEffect(() => {
    setMounted(true);

    const initialize = async () => {
      // Che setup status
      try {
        const res = await authService.checkSetupStatus();
        if (res && res.setupRequired) {
          setSetupRequired(true);
          setAuthMode('setup');
          setAuthReady(true);
          return;
        } else {
          setSetupRequired(false);
        }
      } catch {
        setSetupRequired(false);
      }

      // Restore user from localStorage
      const savedUser = localStorage.getItem('crm_user');
      if (!savedUser) {
        // No saved session — ready immediately
        setAuthReady(true);
        return;
      }

      // Silently refresh the accessToken cookie so API calls work on reload
      try {
        await api.post('/auth/refresh');
        // Token refreshed — restore user from localStorage
        setUser(JSON.parse(savedUser));
      } catch {
        // Refresh token expired or invalid — force logout
        localStorage.removeItem('crm_user');
        setUser(null);
      } finally {
        setAuthReady(true);
      }
    };

    initialize();
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent, onSuccess?: () => void) => {
    e.preventDefault();
    if (!toastCtx) return;

    if (authMode === 'login') {
      try {
        const res = await authService.login({ email: authForm.email, password: authForm.password });
        if (res && res.user) {
          setUser(res.user);
          localStorage.setItem('crm_user', JSON.stringify(res.user));
          toastCtx.addToast('success', `Welcome back, ${res.user.name}!`);
          if (onSuccess) onSuccess();
        }
      } catch (err: any) {
        const errMsg = err?.response?.data?.message || 'Invalid email or password';
        toastCtx.addToast('error', errMsg);
        throw err;
      }
    } else if (authMode === 'register') {
      // Normal register is disabled in production CRM but we support fallback register for development
      if (authForm.password !== authForm.confirmPassword) {
        toastCtx.addToast('error', 'Passwords do not match');
        return;
      }
      const res = await authService.register({
        name: authForm.name,
        email: authForm.email,
        phone: authForm.phone,
        password: authForm.password,
        company: authForm.company,
        role: authForm.role
      });
      if (res && res.user) {
        setUser(res.user);
        localStorage.setItem('crm_user', JSON.stringify(res.user));
        toastCtx.addToast('success', `Account created successfully! Welcome, ${res.user.name}`);
        if (onSuccess) onSuccess();
      } else {
        toastCtx.addToast('error', 'Registration failed. Setup may already be complete.');
      }
    }
  };

  const handleSetupSubmit = async (setupData: any, onSuccess?: () => void) => {
    if (!toastCtx) return false;
    const res = await authService.setup(setupData);
    if (res && res.user) {
      setUser(res.user);
      localStorage.setItem('crm_user', JSON.stringify(res.user));
      setSetupRequired(false);
      setAuthMode('login');
      toastCtx.addToast('success', 'CRM Organization & Super Admin created successfully!');
      if (onSuccess) onSuccess();
      return true;
    } else {
      toastCtx.addToast('error', 'Failed to complete initial setup');
      return false;
    }
  };

  const handleLogout = async () => {
    setUser(null);
    localStorage.removeItem('crm_user');
    setAuthForm(DEFAULT_AUTH_FORM);
    try {
      await authService.logout();
    } catch (err) {
      console.warn('API error logging out:', err);
    }
    if (toastCtx) {
      toastCtx.addToast('info', 'Logged out successfully');
    }
  };

  const selectQuickAccount = (email: string) => {
    setAuthForm(prev => ({ ...prev, email, password: 'password' }));
  };

  return (
    <AuthContext.Provider value={{
      mounted,
      setMounted,
      authReady,
      user,
      setUser,
      authMode,
      setAuthMode,
      authForm,
      setAuthForm,
      handleAuthSubmit,
      handleLogout,
      selectQuickAccount,
      setupRequired,
      setSetupRequired,
      handleSetupSubmit
    }}>
      {children}
      {/* style first-time overlay indicator */}
      {setupRequired && mounted && (
        <div className="fixed bottom-4 right-4 bg-yellow-500 text-black px-4 py-2 rounded-lg shadow-lg text-xs font-semibold z-50">
          ⚙️ First-Run Setup Mode Active
        </div>
      )}
    </AuthContext.Provider>
  );
};