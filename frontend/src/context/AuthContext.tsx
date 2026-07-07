"use client";

import React, { createContext, useState, useEffect, useContext } from 'react';
import { User, AuthForm } from '../types/user';
import { authService } from '../services/auth.service';
import { ToastContext } from './ToastContext';
import { DEFAULT_AUTH_FORM, OFFLINE_USERS } from '../utils/constants';

export interface AuthContextType {
  mounted: boolean;
  setMounted: React.Dispatch<React.SetStateAction<boolean>>;
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  authMode: 'login' | 'register' | 'setup';
  setAuthMode: React.Dispatch<React.SetStateAction<'login' | 'register' | 'setup'>>;
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
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'setup'>('login');
  const [authForm, setAuthForm] = useState<AuthForm>(DEFAULT_AUTH_FORM);
  const [setupRequired, setSetupRequired] = useState(false);
  const toastCtx = useContext(ToastContext);

  useEffect(() => {
    setMounted(true);
    
    // Check if user is saved locally
    const savedUser = localStorage.getItem('crm_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // Check Odoo setup status
    const checkSetup = async () => {
      const res = await authService.checkSetupStatus();
      if (res && res.setupRequired) {
        setSetupRequired(true);
        setAuthMode('setup');
      } else {
        setSetupRequired(false);
      }
    };
    checkSetup();
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent, onSuccess?: () => void) => {
    e.preventDefault();
    if (!toastCtx) return;

    if (authMode === 'login') {
      const res = await authService.login({ email: authForm.email, password: authForm.password });
      if (res && res.user) {

  setUser(res.user);

  localStorage.setItem(
    "crm_user",
    JSON.stringify(res.user)
  );

  // Save JWT tokens
  localStorage.setItem(
    "jwtToken",
    res.accessToken
  );

  localStorage.setItem(
    "refreshToken",
    res.refreshToken
  );

  toastCtx.addToast(
    "success",
    `Welcome back, ${res.user.name}!`
  );

  if (onSuccess) onSuccess();

} else {
        // Offline / Development fallback
        const match = OFFLINE_USERS.find(u => u.email === authForm.email);
        if (match) {
          const matchedUser: User = {
            id: match.id,
            name: match.name,
            email: match.email,
            role: match.role,
            company: match.company
          };
          setUser(matchedUser);
          localStorage.setItem('crm_user', JSON.stringify(matchedUser));
          toastCtx.addToast('success', `Logged in offline as ${matchedUser.name} (${matchedUser.role})`);
          if (onSuccess) onSuccess();
        } else {
          toastCtx.addToast('error', 'Invalid email or password');
        }
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
        localStorage.setItem("jwtToken", res.accessToken);
localStorage.setItem("refreshToken", res.refreshToken);
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
    await authService.logout();
    setUser(null);
   localStorage.removeItem("crm_user");
localStorage.removeItem("jwtToken");
localStorage.removeItem("refreshToken");
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
      {/* Odoo style first-time overlay indicator */}
      {setupRequired && mounted && (
        <div className="fixed bottom-4 right-4 bg-yellow-500 text-black px-4 py-2 rounded-lg shadow-lg text-xs font-semibold z-50">
          ⚙️ First-Run Setup Mode Active
        </div>
      )}
    </AuthContext.Provider>
  );
};
