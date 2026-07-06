"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import "@/app/globals.css";
import {
  Briefcase,
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  Filter,
  X,
  Moon,
  Sun,
  LogOut,
  Check,
  AlertCircle,
  Info,
  BarChart3,
  Users,
  ClipboardList,
  Building2,
  Calendar as CalendarIcon,
  Mail,
  FileText,
  TrendingUp,
  Settings as SettingsIcon,
  Upload,
  Menu
} from 'lucide-react';
import { useCRM } from '@/context/CRMContext';

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const crm = useCRM();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleTermsAccept = () => {
    setShowImportModal(false);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const isCsv = file.type === 'text/csv' || file.name.endsWith('.csv');
    const isExcel = 
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
      file.type === 'application/vnd.ms-excel' || 
      file.name.endsWith('.xlsx') || 
      file.name.endsWith('.xls');

    if (!isCsv && !isExcel) {
      alert("Invalid file format. Please upload a .csv, .xlsx or .xls file.");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    crm.addToast('info', 'Uploading CSV leads...');

    try {
      const response = await fetch('http://localhost:5000/api/leads/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        crm.addToast('success', data.message || 'Leads imported successfully!');
        await crm.loadCRMData();
      } else {
        crm.addToast('error', data.message || 'Failed to import CSV leads.');
        alert(data.message || 'uploading failed the csv file does not match the required fields');
      }
    } catch (error) {
      console.error(error);
      crm.addToast('error', 'Error uploading file. Server may be offline.');
      alert('Error uploading file. Server may be offline.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // If path is login, don't show shell
  if (pathname === '/login') {
    return <>{children}</>;
  }


  const currentTab = pathname === '/' ? 'dashboard' : pathname.replace('/', '');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, href: '/dashboard', roles: ['SUPER_ADMIN', 'ADMIN', 'USER'] },
    { id: 'leads', label: 'Leads', icon: Users, href: '/leads', roles: ['ADMIN', 'USER'] },
    { id: 'opportunities', label: 'Opportunities', icon: ClipboardList, href: '/opportunities', roles: ['ADMIN', 'USER'] },
    { id: 'tasks', label: 'Tasks', icon: ClipboardList, href: '/tasks', roles: ['SUPER_ADMIN', 'ADMIN', 'USER'] },
    { id: 'salesteam', label: 'Teams', icon: Users, href: '/salesteam', roles: ['SUPER_ADMIN', 'ADMIN'] },
    { id: 'activities', label: 'Activities', icon: CalendarIcon, href: '/activities', roles: ['ADMIN', 'USER'] },
    { id: 'emails', label: 'Emails', icon: Mail, href: '/emails', roles: ['ADMIN', 'USER'] },
    { id: 'quotations', label: 'Quotations', icon: FileText, href: '/quotations', roles: ['ADMIN', 'USER'] },
    { id: 'customers', label: 'Customers', icon: Building2, href: '/customers', roles: ['ADMIN', 'USER'] },
    { id: 'referrals', label: 'Referrals', icon: TrendingUp, href: '/referrals', roles: ['ADMIN', 'USER'] },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, href: '/settings', roles: ['SUPER_ADMIN', 'ADMIN'] },
  ];

  const handleLogoutClick = () => {
    crm.handleLogout();
    setShowProfileMenu(false);
    router.push('/login');
  };

  const hasActiveFilters = 
    crm.activeFilters.myPipeline || 
    crm.activeFilters.unassigned || 
    crm.activeFilters.open || 
    crm.activeFilters.won || 
    crm.activeFilters.lost || 
    crm.activeFilters.category || 
    crm.activeFilters.serviceType || 
    crm.activeFilters.salesperson || 
    crm.activeFilters.team || 
    crm.activeFilters.city || 
    crm.activeFilters.country || 
    crm.activeFilters.campaign || 
    crm.activeFilters.source || 
    crm.activeFilters.createdDateStart || 
    crm.activeFilters.createdDateEnd || 
    crm.activeFilters.expectedClosingStart || 
    crm.activeFilters.expectedClosingEnd || 
    crm.activeFilters.closedDateStart || 
    crm.activeFilters.closedDateEnd;

  return (
    <div className="flex flex-col min-h-screen bg-bg-main transition-colors duration-300">
    
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {crm.toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm text-white ${
              t.type === 'success' ? 'bg-success border-emerald-500' :
              t.type === 'error' ? 'bg-danger border-rose-500' : 'bg-primary border-blue-500'
            }`}
          >
            {t.type === 'success' && <Check className="w-4 h-4" />}
            {t.type === 'error' && <AlertCircle className="w-4 h-4" />}
            {t.type === 'info' && <Info className="w-4 h-4" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Top Navbar / Odoo-inspired App Switcher Menu */}
      <header className="bg-card  shadow-sm border-b border-border-crm shrink-0 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          
          {/* Logo & Platform Title */}
          <div className="flex items-center space-x-4">
            {/* Hamburger button visible only below lg breakpoint */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 rounded-xl text-txt-secondary hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-txt-primary transition cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>

            <div className="bg-primary p-2 rounded-xl text-white">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight select-none text-txt-primary">
              {crm.companyBranding.logoText}
            </span>
          </div>
          
          {/* Module Links - Horizontal Navigation */}
          <nav className="hidden lg:flex space-x-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const userRole = (crm.user?.role || '').toUpperCase().replace(' ', '_');
              if (tab.roles && !tab.roles.includes(userRole)) return null;

              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    currentTab === tab.id
                      ? 'bg-primary text-white'
                      : 'text-txt-secondary hover:bg-slate-200 blue:hover:bg-slate-800 '
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Accessories */}
          <div className="flex items-center space-x-3">
            
            {/* Dark Mode toggle */}
            <button
              onClick={crm.toggleTheme}
              className="p-2 rounded-xl text-txt-secondary hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-txt-primary transition cursor-pointer"
              title="Toggle Dark Mode"
            >
              {crm.theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-bg-main text-txt-primary border border-border-crm flex items-center justify-center font-bold uppercase text-xs">
                  {crm.user?.name ? crm.user.name.substr(0, 2) : 'US'}
                </div>
                <div className="hidden md:block text-left text-xs">
                  <p className="font-semibold leading-none text-txt-primary">{crm.user?.name || 'Guest'}</p>
                 
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-txt-secondary" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-card border border-border-crm rounded-xl shadow-lg py-1 z-50 text-txt-primary">
                  <div className="px-4 py-3 border-b border-border-crm text-xs">
                    <p className="font-semibold text-txt-primary">{crm.user?.name || 'Guest'}</p>
                    <p className="text-txt-secondary">{crm.user?.email || ''}</p>
                    <p className="text-txt-secondary leading-none mt-0.5 text-[10px]">{crm.user?.company || 'Company'}</p>
                  </div>
                  <div className="px-4 py-2 border-b border-border-crm text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Switch Test Role:
                  </div>
                  <button
                    onClick={() => { crm.setUser({ ...crm.user, role: 'Super Admin' }); crm.addToast('info', 'Switched context to Super Admin'); }}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-between items-center cursor-pointer"
                  >
                    <span>Super Admin</span>
                    {crm.user?.role === 'Super Admin' && <Check className="w-3.5 h-3.5 text-success" />}
                  </button>
                  <button
                    onClick={() => { crm.setUser({ ...crm.user, role: 'Admin' }); crm.addToast('info', 'Switched context to Admin'); }}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-between items-center cursor-pointer"
                  >
                    <span>Admin</span>
                    {crm.user?.role === 'Admin' && <Check className="w-3.5 h-3.5 text-success" />}
                  </button>
                  <button
                    onClick={() => { crm.setUser({ ...crm.user, role: 'User' }); crm.addToast('info', 'Switched context to User'); }}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-between items-center cursor-pointer"
                  >
                    <span>User</span>
                    {crm.user?.role === 'User' && <Check className="w-3.5 h-3.5 text-success" />}
                  </button>
                  <div className="border-t border-border-crm mt-1"></div>
                  <button
                    onClick={handleLogoutClick}
                    className="w-full text-left px-4 py-2 text-xs text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>


      <section className="bg-card border-b border-border-crm shadow-sm sticky top-14 z-30 shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Breadcrumbs & Primary Actions */}
          <div className="flex items-center space-x-4">
            <div className="text-sm font-semibold tracking-tight flex items-center space-x-1">
              <span className="text-txt-secondary select-none">CRM</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="capitalize text-txt-primary">{currentTab}</span>
            </div>

            {/* Action CTAs depending on active route */}
            <div className="flex items-center space-x-2">
              {currentTab === 'leads' && (
                <>
                  <button
                    onClick={() => crm.setShowLeadCreateModal(true)}
                    className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center space-x-1 shadow transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Lead</span>
                  </button>
                  <button
                    onClick={() => setShowImportModal(true)}
                    disabled={isUploading}
                    className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center space-x-1 shadow transition cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'Uploading...' : 'Import CSV'}</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".csv, .xlsx, .xls"
                    className="hidden"
                  />
                </>
              )}
              
              {currentTab === 'opportunities' && crm.user?.role === 'Super Admin' && (
                <button
                  onClick={() => crm.setShowStageModal(true)}
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center space-x-1 shadow transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Stage</span>
                </button>
              )}
              {currentTab === 'activities' && (
                <button
                  onClick={() => crm.setShowActivityModal(true)}
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center space-x-1 shadow transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Schedule Activity</span>
                </button>
              )}
           
              {currentTab === 'referrals' && (
                <button
                  onClick={() => crm.setShowReferralModal(true)}
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center space-x-1 shadow transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Submit Referral</span>
                </button>
              )}
            </div>
          </div>

          {/* Search, Filters Bar */}
          <div className="flex items-center space-x-2 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Search ${currentTab}...`}
                className="w-full bg-bg-main border border-border-crm rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-primary transition text-txt-primary"
                value={crm.searchQuery}
                onChange={e => crm.setSearchQuery(e.target.value)}
              />
              {crm.searchQuery && (
                <button
                  onClick={() => crm.setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter Drawer Trigger */}
            <button
              onClick={() => crm.setShowFilterDrawer(true)}
              className="bg-bg-main border border-border-crm hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl px-3 py-2 flex items-center space-x-1.5 text-xs font-semibold text-txt-secondary transition cursor-pointer"
              title="Filters & Grouping"
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
              )}
            </button>

            {/* Reset Button */}
            {(crm.searchQuery || hasActiveFilters) && (
              <button
                onClick={crm.clearAllFilters}
                className="text-xs text-rose-500 hover:underline px-1 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* FILTER DRAWER SLIDE-IN */}
      {crm.showFilterDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div onClick={() => crm.setShowFilterDrawer(false)} className="absolute inset-0 bg-black/30 backdrop-blur-xs"></div>
          
          {/* Drawer content */}
          <div className="relative w-80 max-w-full bg-card h-full shadow-2xl border-l border-border-crm p-6 flex flex-col z-10 text-txt-primary">
            <div className="flex items-center justify-between pb-4 border-b border-border-crm">
              <h3 className="font-bold text-sm tracking-tight flex items-center space-x-2">
                <Filter className="w-4 h-4 text-primary" />
                <span>Advanced Search & Filters</span>
              </h3>
              <button onClick={() => crm.setShowFilterDrawer(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
              
              {/* Status Filters */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-extrabold text-txt-secondary uppercase tracking-wide border-b border-border-crm pb-1">Odoo Status Filters</h4>
                <div className="grid grid-cols-2 gap-1">
                  <label className="flex items-center space-x-1.5 p-1.5 hover:bg-slate-100/50 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-xs">
                    <input
                      type="checkbox" className="rounded text-primary border-slate-300 focus:ring-0 w-3.5 h-3.5"
                      checked={crm.activeFilters.myPipeline}
                      onChange={e => crm.setActiveFilters({ ...crm.activeFilters, myPipeline: e.target.checked })}
                    />
                    <span className="truncate">My Pipeline</span>
                  </label>
                  <label className="flex items-center space-x-1.5 p-1.5 hover:bg-slate-100/50 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-xs">
                    <input
                      type="checkbox" className="rounded text-primary border-slate-300 focus:ring-0 w-3.5 h-3.5"
                      checked={crm.activeFilters.unassigned}
                      onChange={e => crm.setActiveFilters({ ...crm.activeFilters, unassigned: e.target.checked })}
                    />
                    <span className="truncate">Unassigned</span>
                  </label>
                  <label className="flex items-center space-x-1.5 p-1.5 hover:bg-slate-100/50 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-xs">
                    <input
                      type="checkbox" className="rounded text-primary border-slate-300 focus:ring-0 w-3.5 h-3.5"
                      checked={crm.activeFilters.open}
                      onChange={e => crm.setActiveFilters({ ...crm.activeFilters, open: e.target.checked })}
                    />
                    <span className="truncate">Open Deals</span>
                  </label>
                  <label className="flex items-center space-x-1.5 p-1.5 hover:bg-slate-100/50 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-xs">
                    <input
                      type="checkbox" className="rounded text-primary border-slate-300 focus:ring-0 w-3.5 h-3.5"
                      checked={crm.activeFilters.won}
                      onChange={e => crm.setActiveFilters({ ...crm.activeFilters, won: e.target.checked })}
                    />
                    <span className="truncate">Won Deals</span>
                  </label>
                  <label className="flex items-center space-x-1.5 p-1.5 hover:bg-slate-100/50 dark:hover:bg-slate-800 rounded-lg cursor-pointer text-xs col-span-2">
                    <input
                      type="checkbox" className="rounded text-primary border-slate-300 focus:ring-0 w-3.5 h-3.5"
                      checked={crm.activeFilters.lost}
                      onChange={e => crm.setActiveFilters({ ...crm.activeFilters, lost: e.target.checked })}
                    />
                    <span className="truncate">Lost Deals Only</span>
                  </label>
                </div>
              </div>

              {/* Segmentations */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-extrabold text-txt-secondary uppercase tracking-wide border-b border-border-crm pb-1">Segmentations</h4>
                
                <div className="grid grid-cols-1 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Project Category</label>
                    <select
                      className="w-full border border-border-crm bg-bg-main rounded-xl px-2 py-1.5 text-xs focus:outline-none focus:border-primary text-txt-primary bg-white dark:bg-slate-800"
                      value={crm.activeFilters.category}
                      onChange={e => crm.setActiveFilters({ ...crm.activeFilters, category: e.target.value })}
                    >
                      <option value="">All Categories</option>
                      {crm.categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Service Type</label>
                    <select
                      className="w-full border border-border-crm bg-bg-main rounded-xl px-2 py-1.5 text-xs focus:outline-none focus:border-primary text-txt-primary bg-white dark:bg-slate-800"
                      value={crm.activeFilters.serviceType}
                      onChange={e => crm.setActiveFilters({ ...crm.activeFilters, serviceType: e.target.value })}
                    >
                      <option value="">All Service Types</option>
                      <option value="Service Based">Service Based</option>
                      <option value="Product Based">Product Based</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Assigned Representative</label>
                    <select
                      className="w-full border border-border-crm bg-bg-main rounded-xl px-2 py-1.5 text-xs focus:outline-none focus:border-primary text-txt-primary bg-white dark:bg-slate-800"
                      value={crm.activeFilters.salesperson}
                      onChange={e => crm.setActiveFilters({ ...crm.activeFilters, salesperson: e.target.value })}
                    >
                      <option value="">All Salespeople</option>
                      <option value="Sarah Connor">Sarah Connor</option>
                      <option value="John Doe (SA)">John Doe (SA)</option>
                      <option value="Kyle Reese">Kyle Reese</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Sales Team</label>
                    <select
                      className="w-full border border-border-crm bg-bg-main rounded-xl px-2 py-1.5 text-xs focus:outline-none focus:border-primary text-txt-primary bg-white dark:bg-slate-800"
                      value={crm.activeFilters.team}
                      onChange={e => crm.setActiveFilters({ ...crm.activeFilters, team: e.target.value })}
                    >
                      <option value="">All Teams</option>
                      <option value="Sales Team Alpha">Sales Team Alpha</option>
                      <option value="Sales Team Beta">Sales Team Beta</option>
                      <option value="Enterprise Core">Enterprise Core</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Campaign</label>
                    <select
                      className="w-full border border-border-crm bg-bg-main rounded-xl px-2 py-1.5 text-xs focus:outline-none focus:border-primary text-txt-primary bg-white dark:bg-slate-800"
                      value={crm.activeFilters.campaign}
                      onChange={e => crm.setActiveFilters({ ...crm.activeFilters, campaign: e.target.value })}
                    >
                      <option value="">All Campaigns</option>
                      <option value="Tech Expo 2026">Tech Expo 2026</option>
                      <option value="Summer Cloud Promo">Summer Cloud Promo</option>
                      <option value="AI Promo">AI Promo</option>
                      <option value="None">Direct / None</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Source / Medium</label>
                    <select
                      className="w-full border border-border-crm bg-bg-main rounded-xl px-2 py-1.5 text-xs focus:outline-none focus:border-primary text-txt-primary bg-white dark:bg-slate-800"
                      value={crm.activeFilters.source}
                      onChange={e => crm.setActiveFilters({ ...crm.activeFilters, source: e.target.value })}
                    >
                      <option value="">All Sources</option>
                      <option value="Website">Website</option>
                      <option value="Referral">Referral</option>
                      <option value="Campaign">Campaign</option>
                      <option value="Manual Entry">Manual Entry</option>
                      <option value="Email">Email</option>
                      <option value="Excel Import">Excel Import</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-0.5">City</label>
                      <input
                        type="text" placeholder="e.g. Detroit"
                        className="w-full border border-border-crm bg-bg-main rounded-xl px-2 py-1 text-xs focus:outline-none text-txt-primary bg-white dark:bg-slate-800"
                        value={crm.activeFilters.city}
                        onChange={e => crm.setActiveFilters({ ...crm.activeFilters, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Country</label>
                      <input
                        type="text" placeholder="e.g. France"
                        className="w-full border border-border-crm bg-bg-main rounded-xl px-2 py-1 text-xs focus:outline-none text-txt-primary bg-white dark:bg-slate-800"
                        value={crm.activeFilters.country}
                        onChange={e => crm.setActiveFilters({ ...crm.activeFilters, country: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Date Ranges */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-extrabold text-txt-secondary uppercase tracking-wide border-b border-border-crm pb-1">Date Ranges</h4>
                
                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Creation Date Range</label>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="date" className="w-full border border-border-crm bg-bg-main rounded-xl p-1 text-[10px] focus:outline-none text-txt-primary bg-white dark:bg-slate-800"
                        value={crm.activeFilters.createdDateStart}
                        onChange={e => crm.setActiveFilters({ ...crm.activeFilters, createdDateStart: e.target.value })}
                      />
                      <span className="text-slate-400 text-[10px]">to</span>
                      <input
                        type="date" className="w-full border border-border-crm bg-bg-main rounded-xl p-1 text-[10px] focus:outline-none text-txt-primary bg-white dark:bg-slate-800"
                        value={crm.activeFilters.createdDateEnd}
                        onChange={e => crm.setActiveFilters({ ...crm.activeFilters, createdDateEnd: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Expected Closing Range</label>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="date" className="w-full border border-border-crm bg-bg-main rounded-xl p-1 text-[10px] focus:outline-none text-txt-primary bg-white dark:bg-slate-800"
                        value={crm.activeFilters.expectedClosingStart}
                        onChange={e => crm.setActiveFilters({ ...crm.activeFilters, expectedClosingStart: e.target.value })}
                      />
                      <span className="text-slate-400 text-[10px]">to</span>
                      <input
                        type="date" className="w-full border border-border-crm bg-bg-main rounded-xl p-1 text-[10px] focus:outline-none text-txt-primary bg-white dark:bg-slate-800"
                        value={crm.activeFilters.expectedClosingEnd}
                        onChange={e => crm.setActiveFilters({ ...crm.activeFilters, expectedClosingEnd: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Closed Date Range</label>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="date" className="w-full border border-border-crm bg-bg-main rounded-xl p-1 text-[10px] focus:outline-none text-txt-primary bg-white dark:bg-slate-800"
                        value={crm.activeFilters.closedDateStart}
                        onChange={e => crm.setActiveFilters({ ...crm.activeFilters, closedDateStart: e.target.value })}
                      />
                      <span className="text-slate-400 text-[10px]">to</span>
                      <input
                        type="date" className="w-full border border-border-crm bg-bg-main rounded-xl p-1 text-[10px] focus:outline-none text-txt-primary bg-white dark:bg-slate-800"
                        value={crm.activeFilters.closedDateEnd}
                        onChange={e => crm.setActiveFilters({ ...crm.activeFilters, closedDateEnd: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Custom Filter */}
              <div className="pt-3 border-t border-border-crm space-y-2">
                <h4 className="text-[10px] font-extrabold text-txt-secondary uppercase tracking-wide">Save Custom Filter</h4>
                <div className="flex gap-2">
                  <input
                    type="text" placeholder="e.g. Q3 Pipeline"
                    className="flex-1 border border-border-crm bg-bg-main rounded-xl px-2 py-1.5 text-xs focus:outline-none text-txt-primary bg-white dark:bg-slate-800"
                    value={crm.customFilterName}
                    onChange={e => crm.setCustomFilterName(e.target.value)}
                  />
                  <button
                    onClick={crm.handleSaveCustomFilter}
                    className="bg-primary hover:bg-primary-hover text-white rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer"
                  >
                    Save
                  </button>
                </div>
                
                {crm.customFilters.length > 0 && (
                  <div className="pt-1.5">
                    <p className="text-[9px] text-txt-secondary uppercase font-semibold">Favorites</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {crm.customFilters.map((cf, i) => (
                        <span key={i} className="bg-blue-50 text-primary border border-blue-100 rounded-lg px-2 py-0.5 text-[10px] select-none font-semibold">
                          {cf}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>

            <div className="border-t border-border-crm pt-4 flex gap-2">
              <button
                onClick={crm.clearAllFilters}
                className="flex-1 border border-border-crm hover:bg-slate-50 dark:hover:bg-slate-800 text-txt-primary py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Reset All
              </button>
              <button
                onClick={() => crm.setShowFilterDrawer(false)}
                className="flex-1 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-xl text-xs font-semibold transition shadow cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CORE CONTENT LAYOUT */}
      <main className="flex-1 overflow-y-auto max-w-7xl w-full mx-auto p-4 shrink-0">
        {children}
      </main>
      
      {/* Footer Branding */}
      <footer className="bg-card border-t border-border-crm text-center py-4 text-[10px] text-txt-secondary shrink-0">
        <p>© 2026 {crm.companyBranding.name}. All rights reserved. Powered by Next.js, Express & Tailwind CSS.</p>
      </footer>

      {/* CSV Import Terms & Conditions Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs">
          <div className="bg-card border border-border-crm rounded-2xl shadow-2xl p-6 max-w-lg w-full text-txt-primary flex flex-col max-h-[85vh]">
            
            <h4 className="font-bold text-sm tracking-tight mb-4 flex items-center gap-2 border-b border-border-crm pb-2 uppercase text-primary font-extrabold">
              <Upload className="w-4 h-4" />
              CSV Leads Import Terms & Format Rules
            </h4>
            
            {/* Scrollable Terms Text Container */}
            <div className="overflow-y-auto pr-1 space-y-4 mb-5 text-txt-secondary leading-relaxed bg-bg-main p-4 rounded-xl border border-border-crm max-h-[50vh]">
              <p className="font-bold text-txt-primary">
                Please read and accept the instructions below before importing your leads list.
              </p>
              
              {/* <div>
                <h5 className="font-bold text-txt-primary mb-1">1. Database Saving & Status</h5>
                <p>
                  All valid records found in the uploaded file will be saved directly into the CRM database. Each imported lead will be automatically assigned a status of <strong className="text-primary font-bold">New</strong>.
                </p>
              </div> */}

              <div>
                <h5 className="font-bold text-txt-primary mb-1"> Required CSV/Excel Columns</h5>
                <p>The sheet must contain the following column headers exactly (case-sensitive):</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li><span className="font-bold text-txt-primary">contactName</span> (Required): The full name of the lead contact (minimum 3 characters).</li>
                  <li><span className="font-bold text-txt-primary">category</span> (Required): Industry category (e.g. "Healthcare", "Manufacturing", "IT Services").</li>
                  <li><span className="font-bold text-txt-primary">serviceType</span> (Required): Sales classification (e.g. "Service Based", "Product Based").</li>
                {/* </ul>
              </div>

              <div>
                <h5 className="font-bold text-txt-primary mb-1">3. Optional Columns</h5>
                <p>These columns are optional. If present, they will be mapped; if omitted, they will be set to empty or default values:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1"> */}
                  <li><span className="font-bold text-txt-primary">company</span>: Organization / Company name.</li>
                  <li><span className="font-bold text-txt-primary">email</span>: Email address.</li>
                  <li><span className="font-bold text-txt-primary">phone</span>: 10-digit phone number.</li>
                  <li><span className="font-bold text-txt-primary">assignedUser</span>: Full name of the assigned sales representative.</li>
                  <li><span className="font-bold text-txt-primary">createdAt</span>: Creation date. Defaults to current date and time if omitted.</li>
                </ul>
              </div>

              {/* <div>
                <h5 className="font-bold text-txt-primary mb-1">4. Format Restrictions</h5>
                <p>
                  Any rows missing the <span className="font-bold text-txt-primary">contactName</span> header or containing empty names will be automatically skipped during processing. Standard CSV or Excel format is required.
                </p>
              </div> */}

              <div className="border-t border-border-crm pt-3">
                <p className="italic text-[10px]">
                  By clicking "OK", you acknowledge that your spreadsheet complies with the format above and consent to saving this data.
                </p>
              </div>
            </div>

            {/* Modal Controls */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="flex-1 border border-border-crm hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl py-2.5 font-semibold text-txt-primary cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTermsAccept}
                className="flex-1 bg-primary hover:bg-primary-hover text-white rounded-xl py-2.5 font-semibold shadow cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Overlay backdrop */}
          <div 
            onClick={() => setShowMobileMenu(false)} 
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          ></div>
          
          {/* Drawer content */}
          <div className="relative w-72 max-w-[80vw] bg-card h-full shadow-2xl border-r border-border-crm p-5 flex flex-col z-10 text-txt-primary animate-in slide-in-from-left duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-border-crm mb-4">
              <div className="flex items-center space-x-2">
                <div className="bg-primary p-2 rounded-xl text-white">
                  <Briefcase className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm tracking-tight text-txt-primary">
                  {crm.companyBranding.logoText}
                </span>
              </div>
              <button 
                onClick={() => setShowMobileMenu(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            
            <nav className="flex-1 overflow-y-auto space-y-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const userRole = (crm.user?.role || '').toUpperCase().replace(' ', '_');
                if (tab.roles && !tab.roles.includes(userRole)) return null;

                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold transition ${
                      currentTab === tab.id
                        ? 'bg-primary text-white'
                        : 'text-txt-secondary hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-txt-primary'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
            </nav>
            
            <div className="border-t border-border-crm pt-4 text-[10px] text-slate-400 text-center">
              Logged in as <strong className="text-txt-primary block text-xs mt-0.5">{crm.user?.name || 'Guest'}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
