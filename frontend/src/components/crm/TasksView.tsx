"use client";

import React, { useState, useEffect } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useCRM } from '@/context/CRMContext';
import { 
  ClipboardList, CheckCircle2, Play, AlertTriangle, 
  X, Clock, Plus, MessageSquare, Calendar, User, 
  Trash2, Edit, AlertOctagon 
} from 'lucide-react';

export default function TasksView() {
  const crm = useCRM();
  const tasksCtx = useTasks();

  const [filter, setFilter] = useState<'All' | 'Pending' | 'In Progress' | 'Completed' | 'Cancelled' | 'Overdue'>('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [newComment, setNewComment] = useState('');

  // Form State
  const [taskForm, setTaskForm] = useState({
    title: '',
    leadId: '',
    assignedToId: '',
    priority: 'Normal',
    deadline: '',
    remarks: ''
  });

  useEffect(() => {
    tasksCtx.loadTasks();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await tasksCtx.handleCreateTask(taskForm);
    if (ok) {
      setShowCreateModal(false);
      setTaskForm({
        title: '',
        leadId: '',
        assignedToId: '',
        priority: 'Normal',
        deadline: '',
        remarks: ''
      });
    }
  };

  const handleTaskClick = async (id: string) => {
    await tasksCtx.loadTaskDetails(id);
    setShowDetailModal(true);
  };

  const handleStatusChange = async (id: string, nextStatus: string) => {
    await tasksCtx.handleUpdateTask(id, { status: nextStatus });
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !tasksCtx.selectedTask) return;
    const ok = await tasksCtx.handleAddTaskComment(tasksCtx.selectedTask.id, newComment);
    if (ok) {
      setNewComment('');
    }
  };

  const filteredTasks = tasksCtx.tasks.filter(t => {
    if (filter === 'All') return true;
    return t.status === filter;
  });

  const getStatusBadge = (status: string) => {
    const base = "px-2 py-0.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 ";
    switch (status) {
      case 'Pending':
        return <span className={base + "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20"}><Clock className="w-3 h-3" /> <span>Pending</span></span>;
      case 'In Progress':
        return <span className={base + "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"}><Play className="w-3 h-3" /> <span>In Progress</span></span>;
      case 'Completed':
        return <span className={base + "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"}><CheckCircle2 className="w-3 h-3" /> <span>Completed</span></span>;
      case 'Cancelled':
        return <span className={base + "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20"}><X className="w-3 h-3" /> <span>Cancelled</span></span>;
      case 'Overdue':
        return <span className={base + "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"}><AlertTriangle className="w-3 h-3" /> <span>Overdue</span></span>;
      default:
        return <span className={base + "bg-slate-500/10 text-slate-500"}>{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const base = "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ";
    switch (priority) {
      case 'Low':
        return <span className={base + "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-border-crm"}>Low</span>;
      case 'Normal':
        return <span className={base + "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900"}>Normal</span>;
      case 'High':
        return <span className={base + "bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900"}>High</span>;
      case 'VIP':
        return <span className={base + "bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900"}>VIP 🔥</span>;
      default:
        return <span className={base + "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"}>{priority}</span>;
    }
  };

  const userRole = (crm.user?.role || '').toUpperCase().replace(' ', '_');
  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 text-txt-primary">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-crm pb-5">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600/10 p-2.5 rounded-xl border border-blue-500/20 text-blue-600 dark:text-blue-400">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-txt-primary">Tasks Pipeline</h1>
            <p className="text-xs text-txt-secondary mt-0.5">Track and convert lead activities into accepted quotations</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-xs font-semibold transition flex items-center space-x-1.5 shadow-lg shadow-blue-500/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border-crm pb-3">
        {(['All', 'Pending', 'In Progress', 'Completed', 'Cancelled', 'Overdue'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border border-border-crm transition cursor-pointer ${
              filter === f 
                ? 'bg-blue-600 text-white border-blue-650' 
                : 'bg-card text-txt-secondary hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Tasks Grid List */}
      {tasksCtx.loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border-crm">
          <ClipboardList className="w-12 h-12 text-txt-secondary mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-txt-primary">No tasks found</h3>
          <p className="text-xs text-txt-secondary mt-1">There are no tasks matching the selected filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map(t => (
            <div
              key={t.id}
              onClick={() => handleTaskClick(t.id)}
              className="bg-card hover:bg-slate-50 dark:hover:bg-slate-750 border border-border-crm rounded-xl p-5 transition cursor-pointer flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-500 relative overflow-hidden group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  {getPriorityBadge(t.priority)}
                  {getStatusBadge(t.status)}
                </div>
                
                <h3 className="font-bold text-txt-primary group-hover:text-blue-500 dark:group-hover:text-blue-400 transition text-sm">{t.title}</h3>
                {t.remarks && <p className="text-xs text-txt-secondary line-clamp-2">{t.remarks}</p>}
              </div>

              <div className="border-t border-border-crm pt-3 mt-4 flex items-center justify-between text-[11px] text-txt-secondary">
                <div className="flex items-center space-x-1">
                  <User className="w-3 h-3 text-txt-secondary" />
                  <span>{t.assignedTo?.name || 'Unassigned'}</span>
                </div>
                
                {t.deadline && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-txt-secondary" />
                    <span>Due: {new Date(t.deadline).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border-crm rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-bg-main px-6 py-4 border-b border-border-crm flex justify-between items-center">
              <h3 className="font-bold text-txt-primary text-sm">Create New CRM Task</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-txt-secondary hover:text-txt-primary cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-txt-secondary mb-1">Task Title</label>
                <input
                  type="text" required
                  className="w-full border border-border-crm rounded-xl px-4 py-2 text-sm text-txt-primary bg-card focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Initial Call Follow-up"
                  value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-txt-secondary mb-1">Assign To (Sales Executive)</label>
                <select
                  className="w-full border border-border-crm rounded-xl px-4 py-2 text-sm text-txt-primary bg-card focus:outline-none focus:border-blue-500"
                  value={taskForm.assignedToId}
                  onChange={e => setTaskForm({ ...taskForm, assignedToId: e.target.value })}
                >
                  <option value="">Select salesperson...</option>
                  {crm.settingsUsers.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-txt-secondary mb-1">Priority</label>
                  <select
                    className="w-full border border-border-crm rounded-xl px-4 py-2 text-sm text-txt-primary bg-card focus:outline-none focus:border-blue-500"
                    value={taskForm.priority}
                    onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-txt-secondary mb-1">Deadline Date</label>
                  <input
                    type="date"
                    className="w-full border border-border-crm rounded-xl px-4 py-2 text-sm text-txt-primary bg-card focus:outline-none focus:border-blue-500"
                    value={taskForm.deadline}
                    onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-txt-secondary mb-1">Remarks / Description</label>
                <textarea
                  rows={3}
                  className="w-full border border-border-crm rounded-xl px-4 py-2 text-sm text-txt-primary bg-card focus:outline-none focus:border-blue-500"
                  placeholder="Task details and expectations..."
                  value={taskForm.remarks}
                  onChange={e => setTaskForm({ ...taskForm, remarks: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-xs font-semibold transition cursor-pointer"
              >
                Create Task
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TASK DETAIL & COMMENTING MODAL */}
      {showDetailModal && tasksCtx.selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border-crm rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="bg-bg-main px-6 py-4 border-b border-border-crm flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-txt-primary text-sm">{tasksCtx.selectedTask.title}</h3>
                <p className="text-[10px] text-txt-secondary mt-0.5">Created by {tasksCtx.selectedTask.assignedBy?.name || 'System'}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-txt-secondary hover:text-txt-primary cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4 bg-bg-main p-4 rounded-xl border border-border-crm text-xs">
                <div>
                  <span className="text-txt-secondary block font-semibold">Assigned Salesperson:</span>
                  <span className="text-txt-primary mt-0.5 font-bold block">{tasksCtx.selectedTask.assignedTo?.name || 'Unassigned'}</span>
                </div>
                <div>
                  <span className="text-txt-secondary block font-semibold">Priority Tier:</span>
                  <span className="mt-0.5 block">{getPriorityBadge(tasksCtx.selectedTask.priority)}</span>
                </div>
                <div>
                  <span className="text-txt-secondary block font-semibold">Deadline:</span>
                  <span className="text-txt-primary mt-0.5 font-bold block">
                    {tasksCtx.selectedTask.deadline ? new Date(tasksCtx.selectedTask.deadline).toLocaleDateString() : 'No deadline'}
                  </span>
                </div>
                <div>
                  <span className="text-txt-secondary block font-semibold">Current Status:</span>
                  <span className="mt-0.5 block">{getStatusBadge(tasksCtx.selectedTask.status)}</span>
                </div>
              </div>

              {tasksCtx.selectedTask.remarks && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-txt-secondary">Description / Instructions</span>
                  <p className="text-xs text-txt-primary bg-bg-main p-3 rounded-lg border border-border-crm whitespace-pre-wrap">
                    {tasksCtx.selectedTask.remarks}
                  </p>
                </div>
              )}

              {/* Status Action controls */}
              <div className="border-t border-border-crm pt-4 space-y-2">
                <span className="text-xs font-bold text-txt-secondary">Update Task Status</span>
                <div className="flex flex-wrap gap-2">
                  {['Pending', 'In Progress', 'Completed', 'Cancelled'].map(st => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(tasksCtx.selectedTask.id, st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                        tasksCtx.selectedTask.status === st
                          ? 'bg-blue-600 text-white border-blue-650'
                          : 'bg-bg-main hover:bg-slate-200 text-txt-primary border-border-crm'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment Thread */}
              <div className="border-t border-border-crm pt-4 space-y-4">
                <div className="flex items-center space-x-2 text-xs font-bold text-txt-secondary">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <span>Discussion Timeline</span>
                </div>

                {/* Comment Input */}
                <form onSubmit={handleCommentSubmit} className="flex gap-2">
                  <input
                    type="text"
                    required
                    className="flex-1 border border-border-crm rounded-xl px-4 py-2 text-xs text-txt-primary bg-bg-main focus:outline-none focus:border-blue-500"
                    placeholder="Add comment to this task..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-sm"
                  >
                    Post
                  </button>
                </form>

                {/* Timeline comments list */}
                <div className="space-y-3 mt-3">
                  {(!tasksCtx.selectedTask.comments || tasksCtx.selectedTask.comments.length === 0) ? (
                    <p className="text-xs text-txt-secondary text-center py-4">No comments posted yet.</p>
                  ) : (
                    tasksCtx.selectedTask.comments.map((c: any) => (
                      <div key={c.id} className="bg-bg-main p-3 rounded-lg border border-border-crm space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-blue-500 dark:text-blue-400">{c.userName}</span>
                          <span className="text-txt-secondary">{new Date(c.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs text-txt-primary">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
