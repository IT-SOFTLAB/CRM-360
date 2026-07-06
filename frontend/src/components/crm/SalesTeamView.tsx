"use client";

import React, { useState, useEffect } from 'react';
import { useCRM } from '@/context/CRMContext';
import { Users, Plus, Shield, ShieldCheck, Mail, Briefcase, Trash2, Edit2, X } from 'lucide-react';
import api from '@/services/api';

export default function SalesTeamView() {
  const crm = useCRM();

  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [teamForm, setTeamForm] = useState({
    name: '',
    description: '',
    leaderId: '',
    memberIds: [] as string[],
    category: ''
  });

  const loadTeams = async () => {
    setLoading(true);
    try {
      const res = await api.get('/salesteam');
      setTeams(res.data);
    } catch (err) {
      console.warn('Error loading sales teams', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/salesteam', teamForm);
      crm.addToast('success', 'Sales team created successfully');
      setShowCreateModal(false);
      setTeamForm({
        name: '',
        description: '',
        leaderId: '',
        memberIds: [],
        category: ''
      });
      loadTeams();
    } catch (err: any) {
      crm.addToast('error', err?.response?.data?.message || 'Failed to create sales team');
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sales team?')) return;
    try {
      await api.delete(`/salesteam/${id}`);
      crm.addToast('success', 'Sales team deleted');
      loadTeams();
    } catch (err) {
      crm.addToast('error', 'Failed to delete sales team');
    }
  };

  const handleMemberCheckboxChange = (userId: string) => {
    setTeamForm(prev => {
      const ids = prev.memberIds.includes(userId)
        ? prev.memberIds.filter(id => id !== userId)
        : [...prev.memberIds, userId];
      return { ...prev, memberIds: ids };
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 text-txt-primary">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-crm pb-5">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600/10 p-2.5 rounded-xl border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-txt-primary font-inter">Sales Teams Management</h1>
            <p className="text-xs text-txt-secondary mt-0.5">Odoo CRM Style Sales Teams grouping and Lead Categories distribution</p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-semibold transition flex items-center space-x-1.5 shadow-lg shadow-indigo-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Sales Team</span>
        </button>
      </div>

      {/* Grid list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border-crm">
          <Users className="w-12 h-12 text-txt-secondary mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-txt-primary font-inter">No Sales Teams found</h3>
          <p className="text-xs text-txt-secondary mt-1">Create teams to bundle salesperson users and route categories (e.g. Healthcare, Retail)</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map(team => (
            <div
              key={team.id}
              className="bg-card border border-border-crm rounded-2xl p-6 transition flex flex-col justify-between hover:border-indigo-500/40 relative overflow-hidden"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-txt-primary text-base">{team.name}</h3>
                    {team.category && (
                      <span className="bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded mt-1.5 inline-block">
                        Category: {team.category}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteTeam(team.id)}
                    className="text-txt-secondary hover:text-rose-500 transition p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-txt-secondary leading-relaxed">{team.description || 'No description provided'}</p>

                {/* Team Leader */}
                <div className="border-t border-border-crm pt-4 flex items-center space-x-3 text-xs">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-1.5 rounded-lg">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-txt-secondary block font-semibold uppercase">Team Leader</span>
                    <span className="text-txt-primary font-bold">{team.leader?.name || 'No Leader Assigned'}</span>
                  </div>
                </div>

                {/* Members List */}
                <div className="space-y-2">
                  <span className="text-[10px] text-txt-secondary font-semibold uppercase block">Members count ({team.members?.length || 0})</span>
                  <div className="flex flex-wrap gap-1">
                    {team.members && team.members.length > 0 ? (
                      team.members.map((m: any) => (
                        <span key={m.id} className="bg-bg-main text-txt-primary text-[10px] px-2 py-0.5 rounded-md border border-border-crm">
                          {m.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-txt-secondary italic">No members assigned</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border-crm rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-bg-main px-6 py-4 border-b border-border-crm flex justify-between items-center">
              <h3 className="font-bold text-txt-primary text-sm">Create Sales Team</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-txt-secondary hover:text-txt-primary cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-txt-secondary mb-1">Team Name</label>
                <input
                  type="text" required
                  className="w-full border border-border-crm rounded-xl px-4 py-2 text-sm text-txt-primary bg-card focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Healthcare Team"
                  value={teamForm.name}
                  onChange={e => setTeamForm({ ...teamForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-txt-secondary mb-1">Team Category routing</label>
                <select
                  className="w-full border border-border-crm rounded-xl px-4 py-2 text-sm text-txt-primary bg-card focus:outline-none focus:border-indigo-500"
                  value={teamForm.category}
                  onChange={e => setTeamForm({ ...teamForm, category: e.target.value })}
                >
                  <option value="">Select Category...</option>
                  {crm.categories.map((c: string) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-txt-secondary mb-1">Team Leader (Admin/CRM Manager)</label>
                <select
                  className="w-full border border-border-crm rounded-xl px-4 py-2 text-sm text-txt-primary bg-card focus:outline-none focus:border-indigo-500"
                  value={teamForm.leaderId}
                  onChange={e => setTeamForm({ ...teamForm, leaderId: e.target.value })}
                >
                  <option value="">Select Leader...</option>
                  {crm.settingsUsers
                    .filter((u: any) => u.role === 'Admin' || u.role === 'SUPER_ADMIN' || u.role === 'ADMIN')
                    .map((u: any) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                </select>
              </div>

              {/* Members checklist */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-txt-secondary">Team Members (Sales Executives)</label>
                <div className="max-h-36 overflow-y-auto border border-border-crm bg-bg-main rounded-xl p-3 space-y-2">
                  {crm.settingsUsers
                    .filter((u: any) => u.role === 'User' || u.role === 'USER')
                    .map((u: any) => (
                      <label key={u.id} className="flex items-center space-x-2.5 text-xs text-txt-primary cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded text-indigo-500 border-border-crm bg-card focus:ring-0"
                          checked={teamForm.memberIds.includes(u.id)}
                          onChange={() => handleMemberCheckboxChange(u.id)}
                        />
                        <span>{u.name} ({u.department || 'No Dept'})</span>
                      </label>
                    ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-txt-secondary mb-1">Description</label>
                <textarea
                  rows={2}
                  className="w-full border border-border-crm rounded-xl px-4 py-2 text-sm text-txt-primary bg-card focus:outline-none focus:border-indigo-500"
                  placeholder="Details about sales target..."
                  value={teamForm.description}
                  onChange={e => setTeamForm({ ...teamForm, description: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 text-xs font-semibold transition cursor-pointer"
              >
                Create Team
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
