"use client";

import React, { createContext, useState, useContext } from 'react';
import { settingsService } from '../services/settings.service';
import { ToastContext } from './ToastContext';
import { AuthContext } from './AuthContext';
import { DEFAULT_COMPANY_BRANDING, OFFLINE_CATEGORIES, SERVICE_TYPES } from '../utils/constants';

export interface SettingsContextType {
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  serviceTypes: string[];
  auditLogs: any[];
  setAuditLogs: React.Dispatch<React.SetStateAction<any[]>>;
  companyBranding: any;
  setCompanyBranding: React.Dispatch<React.SetStateAction<any>>;
  settingsUsers: any[];
  setSettingsUsers: React.Dispatch<React.SetStateAction<any[]>>;
  loadSettings: () => Promise<void>;
  handleAddCategory: (catName: string) => Promise<void>;
  handleDeleteCategory: (catName: string) => Promise<void>;
  handleBrandingSave: (e: React.FormEvent) => Promise<void>;
  handleDeleteUser: (userId: string) => Promise<void>;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [serviceTypes] = useState<string[]>(SERVICE_TYPES);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [companyBranding, setCompanyBranding] = useState<any>(DEFAULT_COMPANY_BRANDING);
  const [settingsUsers, setSettingsUsers] = useState<any[]>([]);

  const toastCtx = useContext(ToastContext);
  const authCtx = useContext(AuthContext);

  const loadSettings = async () => {
    const apiCategories = await settingsService.getCategories();
    const apiUsers = await settingsService.getUsers();
    const apiBranding = await settingsService.getBranding();
    const apiLogs = await settingsService.getAuditLogs();

    if (apiCategories) setCategories(apiCategories);
    else if (categories.length === 0) setCategories(OFFLINE_CATEGORIES);

    if (apiUsers) setSettingsUsers(apiUsers);
    if (apiBranding) setCompanyBranding(apiBranding);
    if (apiLogs) setAuditLogs(apiLogs);
    else if (auditLogs.length === 0) {
      setAuditLogs([
        {
          id: 'log_offline_init',
          timestamp: new Date().toISOString(),
          user: 'System',
          role: 'System',
          action: 'INIT_OFFLINE',
          module: 'Database',
          details: 'Express offline. Seeded local mock state.'
        }
      ]);
    }
  };

  const handleAddCategory = async (catName: string) => {
    const res = await settingsService.addCategory(catName);
    if (res) {
      setCategories(res);
      if (toastCtx) toastCtx.addToast('success', `Category "${catName}" added`);
    } else {
      if (!categories.includes(catName)) {
        setCategories(prev => [...prev, catName]);
        if (toastCtx) toastCtx.addToast('success', `Category "${catName}" added (Offline)`);
      }
    }
  };

  const handleDeleteCategory = async (catName: string) => {
    const res = await settingsService.deleteCategory(catName);
    if (res) {
      setCategories(res);
      if (toastCtx) toastCtx.addToast('success', `Category "${catName}" deleted`);
    } else {
      setCategories(prev => prev.filter(c => c !== catName));
      if (toastCtx) toastCtx.addToast('success', `Category "${catName}" deleted (Offline)`);
    }
  };

  const handleBrandingSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = authCtx?.user;
    if (user?.role !== 'Super Admin') {
      if (toastCtx) toastCtx.addToast('error', 'Only Super Admin can modify branding');
      return;
    }
    const res = await settingsService.saveBranding(companyBranding);
    if (res) {
      if (toastCtx) toastCtx.addToast('success', 'Company branding updated!');
    } else {
      if (toastCtx) toastCtx.addToast('success', 'Company branding updated locally');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const user = authCtx?.user;
    if (user?.role !== 'Super Admin') {
      if (toastCtx) toastCtx.addToast('error', 'Only Super Admin can delete users');
      return;
    }
    if (userId === user?.id) {
      if (toastCtx) toastCtx.addToast('error', 'Cannot delete your own active session!');
      return;
    }
    const res = await settingsService.deleteUser(userId);
    if (res) {
      setSettingsUsers(prev => prev.filter(u => u.id !== userId));
      if (toastCtx) toastCtx.addToast('success', 'User account deactivated and deleted');
    } else {
      setSettingsUsers(prev => prev.filter(u => u.id !== userId));
      if (toastCtx) toastCtx.addToast('success', 'User deleted (Offline)');
    }
  };

  return (
    <SettingsContext.Provider value={{
      categories,
      setCategories,
      serviceTypes,
      auditLogs,
      setAuditLogs,
      companyBranding,
      setCompanyBranding,
      settingsUsers,
      setSettingsUsers,
      loadSettings,
      handleAddCategory,
      handleDeleteCategory,
      handleBrandingSave,
      handleDeleteUser
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
