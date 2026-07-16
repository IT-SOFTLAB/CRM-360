"use client";

import React, { createContext, useState, useContext } from 'react';
import { settingsService } from '../services/settings.service';
import { ToastContext } from './ToastContext';
import { AuthContext } from './AuthContext';
import { DEFAULT_COMPANY_BRANDING, SERVICE_TYPES } from '../utils/constants';

export interface SettingsContextType {
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  serviceTypes: string[];
  companyBranding: any;
  setCompanyBranding: React.Dispatch<React.SetStateAction<any>>;
  settingsUsers: any[];
  setSettingsUsers: React.Dispatch<React.SetStateAction<any[]>>;
  loadSettings: () => Promise<void>;
  handleAddCategory: (catName: string) => Promise<void>;
  handleDeleteCategory: (catName: string) => Promise<void>;
  handleBrandingSave: (e: React.FormEvent) => Promise<void>;
  handleDeleteUser: (userId: string) => Promise<void>;
  handleUpdateUser: (userId: string, name: string, email: string, role: string, status: string, adminId?: string) => Promise<void>;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [serviceTypes] = useState<string[]>(SERVICE_TYPES);
  const [companyBranding, setCompanyBranding] = useState<any>(DEFAULT_COMPANY_BRANDING);
  const [settingsUsers, setSettingsUsers] = useState<any[]>([]);

  const toastCtx = useContext(ToastContext);
  const authCtx = useContext(AuthContext);

  const loadSettings = async () => {
    const apiCategories = await settingsService.getCategories();
    const apiUsers = await settingsService.getUsers();
    const apiBranding = await settingsService.getBranding();

    if (apiCategories) setCategories(apiCategories);
    else if (categories.length === 0) setCategories([]);

    if (apiUsers) setSettingsUsers(apiUsers);
    if (apiBranding) setCompanyBranding(apiBranding);
  };

  const handleAddCategory = async (catName: string) => {
    const res = await settingsService.addCategory(catName);
    if (res) {
      setCategories(res);
      if (toastCtx) toastCtx.addToast('success', `Category "${catName}" added`);
    } else {
      if (!categories.includes(catName)) {
        setCategories(prev => [...prev, catName]);
        if (toastCtx) toastCtx.addToast('success', `Category "${catName}" `);
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
      if (toastCtx) toastCtx.addToast('success', `Category "${catName}"`);
    }
  };

  const handleBrandingSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = authCtx?.user;
    const role = (user?.role || '').toUpperCase().replace(/[\s_]+/g, '_');
    if (role !== 'SUPER_ADMIN') {
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
    const role = (user?.role || '').toUpperCase().replace(/[\s_]+/g, '_');
    if (role !== 'SUPER_ADMIN') {
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
      if (toastCtx) toastCtx.addToast('success', 'User deleted');
    }
  };

  const handleUpdateUser = async (userId: string, name: string, email: string, role: string, status: string, adminId?: string) => {
    const user = authCtx?.user;
    const currentRole = (user?.role || '').toUpperCase().replace(/[\s_]+/g, '_');
    if (currentRole !== 'SUPER_ADMIN') {
      if (toastCtx) toastCtx.addToast('error', 'Only Super Admin can update users');
      return;
    }
    const res = await settingsService.updateUser(userId, { name, email, role, status, adminId });
    const chosenAdmin = settingsUsers.find(u => u.id === adminId);
    const adminObj = chosenAdmin ? { id: chosenAdmin.id, name: chosenAdmin.name } : null;

    if (res) {
      setSettingsUsers(prev => prev.map(u => u.id === userId ? { ...u, ...res } : u));
      if (toastCtx) toastCtx.addToast('success', 'User account updated successfully');
    } else {
      setSettingsUsers(prev => prev.map(u => u.id === userId ? { ...u, name, email, role, status, adminId, admin: adminObj } : u));
      if (toastCtx) toastCtx.addToast('success', 'User account updated locally ');
    }
  };

  return (
    <SettingsContext.Provider value={{
      categories,
      setCategories,
      serviceTypes,
      companyBranding,
      setCompanyBranding,
      settingsUsers,
      setSettingsUsers,
      loadSettings,
      handleAddCategory,
      handleDeleteCategory,
      handleBrandingSave,
      handleDeleteUser,
      handleUpdateUser
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
