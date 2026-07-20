import React, { useState } from 'react';
import { Check, X, Trash2, Plus, Pencil, Eye, EyeOff } from 'lucide-react';
import { authService } from '@/services/auth.service';

interface SettingsViewProps {
  companyBranding: any;
  setCompanyBranding: (branding: any) => void;
  categories: string[];
  settingsUsers: any[];
  user: any;
  onSaveBranding: (e: React.FormEvent) => void;
  onAddCategory: (name: string) => void;
  onDeleteCategory: (name: string) => void;
  onDeleteUser: (id: string) => void;
  onUpdateUser?: (id: string, name: string, email: string, role: string, status: string, adminId?: string) => Promise<void>;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  onRefreshUsersList?: () => void;
  onLogout?: () => Promise<void> | void;
}

export default function SettingsView({
  companyBranding,
  setCompanyBranding,
  categories,
  settingsUsers,
  user,
  onSaveBranding,
  onAddCategory,
  onDeleteCategory,
  onDeleteUser,
  onUpdateUser,
  addToast,
  onRefreshUsersList,
  onLogout
}: SettingsViewProps) {
  const [changePasswordForm, setChangePasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showInvitePassword, setShowInvitePassword] = useState(false);

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (changePasswordForm.newPassword.length < 6) {
      addToast('error', 'New password must be at least 6 characters long');
      return;
    }
    if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
      addToast('error', 'New passwords do not match');
      return;
    }
    setChangePasswordLoading(true);
    try {
      await authService.changePassword({
        currentPassword: changePasswordForm.currentPassword,
        newPassword: changePasswordForm.newPassword
      });
      addToast('success', 'Password updated successfully! Logging out...');
      setTimeout(async () => {
        if (onLogout) await onLogout();
      }, 1500);
    } catch (err: any) {
      addToast('error', err?.response?.data?.message || 'Failed to change password');
    } finally {
      setChangePasswordLoading(false);
    }
  };
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'USER',
    password: '',
    adminId: ''
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [editError, setEditError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    email: '',
    role: 'USER',
    status: 'Active',
    adminId: ''
  });
  const [editLoading, setEditLoading] = useState(false);

  React.useEffect(() => {
    setInviteError('');
  }, [inviteForm.email, inviteForm.name, inviteForm.password, inviteForm.adminId]);

  React.useEffect(() => {
    setEditError('');
  }, [editForm.email, editForm.name, editForm.adminId]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateUser) return;
    const normalizedEmail = editForm.email.toLowerCase().trim();
    const duplicate = settingsUsers.find(u => u.email.toLowerCase().trim() === normalizedEmail && u.id !== editForm.id);
    if (duplicate) {
      setEditError('User with this email already exists');
      return;
    }
    const normalizedName = editForm.name.toLowerCase().trim();
    const duplicateName = settingsUsers.find(u => u.name.toLowerCase().trim() === normalizedName && u.id !== editForm.id);
    if (duplicateName) {
      setEditError('User with this name already exists');
      return;
    }
    setEditLoading(true);
    try {
      await onUpdateUser(editForm.id, editForm.name, editForm.email, editForm.role, editForm.status, editForm.adminId);
      setShowEditModal(false);
      if (onRefreshUsersList) onRefreshUsersList();
    } catch (err: any) {
      setEditError(err?.response?.data?.message || 'Failed to update user');
    } finally {
      setEditLoading(false);
    }
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim());
      setNewCategoryName('');
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = inviteForm.email.toLowerCase().trim();
    const duplicate = settingsUsers.find(u => u.email.toLowerCase().trim() === normalizedEmail);
    if (duplicate) {
      setInviteError('User with this email already exists');
      return;
    }
    const normalizedName = inviteForm.name.toLowerCase().trim();
    const duplicateName = settingsUsers.find(u => u.name.toLowerCase().trim() === normalizedName);
    if (duplicateName) {
      setInviteError('User with this name already exists');
      return;
    }
    setInviteLoading(true);
    try {
      await authService.inviteUser(inviteForm);
      addToast('success', `User ${inviteForm.name} created successfully!`);
      setShowInviteModal(false);
      setInviteForm({
        name: '',
        email: '',
        role: 'USER',
        password: '',
        adminId: ''
      });
      if (onRefreshUsersList) onRefreshUsersList();
    } catch (err: any) {
      setInviteError(err?.response?.data?.message || 'Failed to create user');
    } finally {
      setInviteLoading(false);
    }
  };

  const userRole = (user?.role || '').toUpperCase().replace(' ', '_');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs text-txt-primary">
      
      {/* Column 1: Config Branding & Categories */}
      <div className="space-y-6">
        
        {/* Branding Configuration */}
        {userRole === 'SUPER_ADMIN' && (
          <div className="bg-card border border-border-crm rounded-2xl p-5 space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-txt-secondary">Company Branding</h4>
            <form onSubmit={onSaveBranding} className="space-y-3">
              <div>
                <label className="block text-txt-secondary font-semibold mb-1">Company Name</label>
                <input
                  type="text"
                  className="w-full border border-border-crm bg-bg-main rounded-xl px-3 py-2 text-txt-primary focus:outline-none focus:border-blue-500"
                  value={companyBranding.name}
                  onChange={e => setCompanyBranding({ ...companyBranding, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-txt-secondary font-semibold mb-1">Navbar Logo text</label>
                <input
                  type="text"
                  className="w-full border border-slate-650 bg-slate-300 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                  value={companyBranding.logoText}
                  onChange={e => setCompanyBranding({ ...companyBranding, logoText: e.target.value })}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 font-semibold shadow cursor-pointer transition"
              >
                Save Changes
              </button>
            </form>
          </div>
        )}

        {/* Project Categories */}
        {(userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') && (
          <div className="bg-white-300 border border-slate-700/60 rounded-2xl p-5 space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600">Project Categories</h4>
            <form onSubmit={handleAddCategorySubmit} className="flex gap-2">
              <input
                type="text" required placeholder="Add Healthcare..."
                className="flex-grow border border-border-crm bg-bg-main rounded-xl px-3 py-2 text-txt-primary focus:outline-none focus:border-blue-500"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3 py-2 font-semibold shadow cursor-pointer transition"
              >
                Add
              </button>
            </form>
            <div className="flex flex-wrap gap-1 mt-3">
              {categories.map(cat => (
                <span
                  key={cat}
                  className="bg-white-500 border border-slate-600 text-black-200 rounded-xl px-2.5 py-1 flex items-center space-x-1"
                >
                  <span>{cat}</span>
                  <button type="button" onClick={() => onDeleteCategory(cat)} className="text-rose-500 hover:text-rose-700 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Change Password */}
        <div className="bg-white-300 border border-slate-700/60 rounded-2xl p-5 space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">Change Password</h4>
          <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
            <div>
              <label className="block text-txt-secondary font-semibold mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"} required
                  className="w-full border border-border-crm bg-bg-main rounded-xl pl-3 pr-10 py-2 text-txt-primary focus:outline-none focus:border-blue-500"
                  value={changePasswordForm.currentPassword}
                  onChange={e => setChangePasswordForm({ ...changePasswordForm, currentPassword: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 focus:outline-none cursor-pointer"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-txt-secondary font-semibold mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"} required
                  className="w-full border border-border-crm bg-bg-main rounded-xl pl-3 pr-10 py-2 text-txt-primary focus:outline-none focus:border-blue-500"
                  value={changePasswordForm.newPassword}
                  onChange={e => setChangePasswordForm({ ...changePasswordForm, newPassword: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 focus:outline-none cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-txt-secondary font-semibold mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"} required
                  className="w-full border border-border-crm bg-bg-main rounded-xl pl-3 pr-10 py-2 text-txt-primary focus:outline-none focus:border-blue-500"
                  value={changePasswordForm.confirmPassword}
                  onChange={e => setChangePasswordForm({ ...changePasswordForm, confirmPassword: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 focus:outline-none cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={changePasswordLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 font-semibold shadow cursor-pointer transition disabled:opacity-50"
            >
              {changePasswordLoading ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        </div>

      </div>

      {/* Column 2: User management & Permissions Matrix */}
      {(userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') && (
        <div className="lg:col-span-2 space-y-6">
        
        {/* User management list */}
        <div className="bg-white-300 border border-slate-700/60 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600">User Accounts Management</h4>
            <button
              onClick={() => {
                setInviteError('');
                setShowInviteModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3 py-1.5 text-[10px] font-semibold transition flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Invite New User</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700 text-[10px] text-slate-400 font-bold uppercase">
                  <th className="py-2 text-gray-600">User Name</th>
                  <th className="py-2 text-gray-600">Email</th>
                  <th className="py-2 text-gray-600">Role Scope</th>
                  <th className="py-2 text-gray-600">Assigned Admin</th>
                  <th className="py-2 text-gray-600">Status</th>
                  {userRole === 'SUPER_ADMIN' && <th className="py-2 text-right text-gray-600">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-crm">
                {settingsUsers.map(usr => (
                  <tr key={usr.id} className="text-txt-primary">
                    <td className="py-2.5 font-bold">{usr.name}</td>
                    <td className="py-2.5 text-txt-secondary">{usr.email}</td>
                    <td className="py-2.5 font-semibold text-blue-600 dark:text-blue-400">{usr.role}</td>
                    <td className="py-2.5 font-semibold text-slate-700 dark:text-slate-300">
                      {usr.admin?.name || <span className="text-slate-400 italic">None</span>}
                    </td>
                    <td className="py-2.5">
                      {userRole === 'SUPER_ADMIN' ? (
                        <div className="flex items-center space-x-2">
                          <button
                            disabled={usr.id === user?.id} // cannot deactivate self
                            type="button"
                            onClick={() => {
                              const nextStatus = usr.status === 'Inactive' ? 'Active' : 'Inactive';
                              if (onUpdateUser) {
                                onUpdateUser(usr.id, usr.name, usr.email, usr.role, nextStatus);
                              }
                            }}
                            className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              usr.status !== 'Inactive' ? 'bg-emerald-600' : 'bg-slate-400'
                            } ${usr.id === user?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={usr.id === user?.id ? 'You cannot deactivate your own account' : `Click to ${usr.status === 'Inactive' ? 'Activate' : 'Deactivate'}`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                usr.status !== 'Inactive' ? 'translate-x-3.5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className={`text-[10px] font-bold ${
                            usr.status !== 'Inactive' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                          }`}>
                            {usr.status !== 'Inactive' ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          usr.status !== 'Inactive' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}>
                          {usr.status || 'Active'}
                        </span>
                      )}
                    </td>
                    {userRole === 'SUPER_ADMIN' && (
                      <td className="py-2.5 text-right">
                        {usr.role !== 'SUPER_ADMIN' && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditError('');
                              setEditForm({
                                id: usr.id,
                                name: usr.name,
                                email: usr.email,
                                role: usr.role,
                                status: usr.status || 'Active',
                                adminId: usr.adminId || ''
                              });
                              setShowEditModal(true);
                            }}
                            className="text-blue-500 hover:text-blue-700 cursor-pointer transition p-1 rounded-md inline-block mr-2"
                            title="Edit User"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {usr.role !== 'SUPER_ADMIN' && (
                          <button
                            type="button"
                            onClick={() => onDeleteUser(usr.id)}
                            className="text-rose-500 hover:text-rose-700 cursor-pointer transition p-1 rounded-md inline-block"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Permissions Matrix */}
        <div className="bg-white-300 border border-slate-700/60 rounded-2xl p-5 space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600">Role Permissions Access Matrix</h4>
          <div className="overflow-x-auto text-[10px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700 text-slate-600 font-bold uppercase">
                  <th className="py-2 text-gray-600">Permission Access Scope</th>
                  <th className="py-2 text-gray-600">Super Admin</th>
                  <th className="py-2 text-gray-600">Admin</th>
                  <th className="py-2 text-gray-600">Standard User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-slate-800">
                {[
                  { perm: 'Full System Control Panel Settings', sa: true, ad: false, us: false },
                  { perm: 'Create, Edit, Delete Pipelines/Stages', sa: true, ad: false, us: false },
                  { perm: 'Create and Manage User Accounts', sa: true, ad: true, us: false },
                  { perm: 'Access Assigned Opportunities Leads', sa: true, ad: true, us: true },
                  { perm: 'Retention Rewards Approval', sa: true, ad: false, us: false }
                ].map((pm, i) => (
                  <tr key={i}>
                    <td className="py-2.5 font-semibold text-slate-700">{pm.perm}</td>
                    <td className="py-2.5">{pm.sa ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-rose-500" />}</td>
                    <td className="py-2.5">{pm.ad ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-rose-500" />}</td>
                    <td className="py-2.5">{pm.us ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-rose-500" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Logs */}
        {/* <div className="bg-slate-300 border border-slate-700/60 rounded-2xl p-5 space-y-4"> */}
          {/* <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">Real-Time Audit System Logs</h4> */}
          {/* <div className="max-h-60 overflow-y-auto divide-y divide-slate-700/60">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-2.5 space-y-0.5 text-[10px]">
                <div className="flex justify-between font-bold">
                  <span className="text-blue-500">{log.action} ({log.module})</span>
                  <span className="text-slate-700 font-medium">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-slate-700 leading-relaxed">{log.details}</p>
                <div className="text-slate-700">By: {log.user} ({log.role})</div>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <div className="text-center py-6 text-slate-700">No logs available.</div>
            )}
          </div> */}
        {/* </div> */}

        </div>
      )}

      {/* USER INVITATION MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border-crm rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-txt-primary">
            <div className="bg-bg-main px-6 py-4 border-b border-border-crm flex justify-between items-center">
              <h3 className="font-bold text-txt-primary text-sm">Create User Account</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-txt-secondary hover:text-txt-primary cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="p-6 space-y-4">
              {inviteError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-455 px-4 py-2.5 rounded-xl text-xs font-semibold mb-2 leading-relaxed transition-all">
                  ⚠️ {inviteError}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-txt-secondary mb-1">User Full Name</label>
                <input
                  type="text" required
                  className="w-full border border-border-crm rounded-xl px-4 py-2 text-sm text-txt-primary bg-bg-main focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Rahul Sharma"
                  value={inviteForm.name}
                  onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-txt-secondary mb-1">Email Address</label>
                <input
                  type="email" required
                  className="w-full border border-border-crm rounded-xl px-4 py-2 text-sm text-txt-primary bg-bg-main focus:outline-none focus:border-blue-500"
                  placeholder="e.g. rahul@company.com"
                  value={inviteForm.email}
                  onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-txt-secondary mb-1">Create Password</label>
                <div className="relative">
                  <input
                    type={showInvitePassword ? "text" : "password"} required
                    className="w-full border border-border-crm rounded-xl pl-4 pr-10 py-2 text-sm text-txt-primary bg-bg-main focus:outline-none focus:border-blue-500"
                    placeholder="e.g. ••••••••"
                    value={inviteForm.password}
                    onChange={e => setInviteForm({ ...inviteForm, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowInvitePassword(!showInvitePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 focus:outline-none cursor-pointer"
                  >
                    {showInvitePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-txt-secondary mb-1">Access Role Scope</label>
                <select
                  className="w-full border border-border-crm rounded-xl px-4 py-2 text-sm text-txt-primary bg-bg-main focus:outline-none focus:border-blue-500"
                  value={inviteForm.role}
                  onChange={e => {
                    const newRole = e.target.value;
                    setInviteForm({
                      ...inviteForm,
                      role: newRole,
                      adminId: newRole === 'ADMIN' ? '' : inviteForm.adminId
                    });
                  }}
                >
                  {userRole === 'SUPER_ADMIN' && <option value="ADMIN">CRM Manager (Admin)</option>}
                  <option value="USER">Sales Executive (User)</option>
                </select>
              </div>

              {userRole === 'SUPER_ADMIN' && inviteForm.role === 'USER' && (
                <div>
                  <label className="block text-xs font-semibold text-txt-secondary mb-1">Assign Admin</label>
                  <select
                    className="w-full border border-border-crm rounded-xl px-4 py-2 text-sm text-txt-primary bg-bg-main focus:outline-none focus:border-blue-500"
                    value={inviteForm.adminId}
                    onChange={e => setInviteForm({ ...inviteForm, adminId: e.target.value })}
                  >
                    <option value="">None / Unassigned</option>
                    {settingsUsers
                      .filter(u => u.role === 'ADMIN')
                      .map(adm => (
                        <option key={adm.id} value={adm.id}>
                          {adm.name} ({adm.email})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={inviteLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              >
                {inviteLoading ? 'Creating User Account...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* USER EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border-crm rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-txt-primary">
            <div className="bg-bg-main px-6 py-4 border-b border-border-crm flex justify-between items-center">
              <h3 className="font-bold text-txt-primary text-sm">Edit User Account</h3>
              <button type="button" onClick={() => setShowEditModal(false)} className="text-txt-secondary hover:text-txt-primary cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-455 px-4 py-2.5 rounded-xl text-xs font-semibold mb-2 leading-relaxed transition-all">
                  ⚠️ {editError}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-txt-secondary mb-1">User Full Name</label>
                <input
                  type="text" required
                  className="w-full border border-border-crm rounded-xl px-4 py-2 text-sm text-txt-primary bg-bg-main focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Rahul Sharma"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-txt-secondary mb-1">Email Address</label>
                <input
                  type="email" required
                  className="w-full border border-border-crm rounded-xl px-4 py-2 text-sm text-txt-primary bg-bg-main focus:outline-none focus:border-blue-500"
                  placeholder="e.g. rahul@company.com"
                  value={editForm.email}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-txt-secondary mb-1">Access Role Scope</label>
                <select
                  className="w-full border border-border-crm rounded-xl px-4 py-2 text-sm text-txt-primary bg-bg-main focus:outline-none focus:border-blue-500"
                  value={editForm.role}
                  onChange={e => {
                    const newRole = e.target.value;
                    setEditForm({
                      ...editForm,
                      role: newRole,
                      adminId: newRole === 'ADMIN' ? '' : editForm.adminId
                    });
                  }}
                  disabled={editForm.id === user?.id}
                >
                  {editForm.role === 'SUPER_ADMIN' && <option value="SUPER_ADMIN">Super Admin</option>}
                  <option value="ADMIN">CRM Manager (Admin)</option>
                  <option value="USER">Sales Executive (User)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-txt-secondary mb-1">Account Status</label>
                <select
                  className="w-full border border-border-crm rounded-xl px-4 py-2 text-sm text-txt-primary bg-bg-main focus:outline-none focus:border-blue-500"
                  value={editForm.status}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  disabled={editForm.id === user?.id}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive (Deactivated)</option>
                </select>
              </div>

              {userRole === 'SUPER_ADMIN' && editForm.role === 'USER' && (
                <div>
                  <label className="block text-xs font-semibold text-txt-secondary mb-1">Assigned Admin</label>
                  <select
                    className="w-full border border-border-crm rounded-xl px-4 py-2 text-sm text-txt-primary bg-bg-main focus:outline-none focus:border-blue-500"
                    value={editForm.adminId}
                    onChange={e => setEditForm({ ...editForm, adminId: e.target.value })}
                  >
                    <option value="">None / Unassigned</option>
                    {settingsUsers
                      .filter(u => u.role === 'ADMIN' && u.id !== editForm.id)
                      .map(adm => (
                        <option key={adm.id} value={adm.id}>
                          {adm.name} ({adm.email})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={editLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              >
                {editLoading ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
