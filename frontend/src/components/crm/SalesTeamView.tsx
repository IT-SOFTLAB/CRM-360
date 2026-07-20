"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useCRM } from '@/context/CRMContext';
import { 
  Users, Plus, Shield, Trash2, X, BarChart3, 
  TrendingUp, CheckCircle, AlertCircle, FileText, 
  Calendar, Phone, Mail, Award, Briefcase, ListCollapse
} from 'lucide-react';
import api from '@/services/api';
import { useSearchParams, useRouter } from 'next/navigation';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function SalesTeamView() {
  const crm = useCRM();
  const searchParams = useSearchParams();
  const router = useRouter();
  const teamParam = searchParams.get('team');

  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'performance' | 'leads'>('performance');
  const [kanbanDeals, setKanbanDeals] = useState<any[]>([]);

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
      console.warn('Error loading teams', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
    if (crm.loadCRMData) {
      crm.loadCRMData();
    }
  }, []);

  useEffect(() => {
    if (teams.length > 0) {
      if (teamParam && teamParam !== 'all') {
        const team = teams.find(t => t.id === teamParam);
        if (team) {
          setSelectedTeam(team);
          setActiveTab('performance');
        }
      } else if (teamParam === 'all' || !teamParam) {
        setSelectedTeam(null);
      }
    }
  }, [teamParam, teams]);

  // Compile team opportunities for Kanban Board
  useEffect(() => {
    if (selectedTeam) {
      const memberNames = (selectedTeam.members || []).map((m: any) => m.name);
      if (selectedTeam.leader?.name) memberNames.push(selectedTeam.leader.name);

      const memberIds = (selectedTeam.members || []).map((m: any) => m.id);
      if (selectedTeam.leaderId) memberIds.push(selectedTeam.leaderId);

      const teamOpps = crm.opportunities.filter((o: any) => 
        (o.assignedSalesperson && memberNames.includes(o.assignedSalesperson)) ||
        (o.assignedSalespersonId && memberIds.includes(o.assignedSalespersonId))
      );

      const mapped = teamOpps.map((o: any) => {
        let stageName = "New";
        if (o.stageId === 'p_2' || o.stageId === 'p_3') stageName = "Qualified";
        else if (o.stageId === 'p_4') stageName = "Proposal";
        else if (o.stageId === 'p_5') stageName = "Negotiation";
        else if (o.stageId === 'p_6') stageName = "Won";
        
        return {
          id: o.id,
          name: o.customerName || o.company || "Unnamed Deal",
          rep: o.assignedSalesperson || "Unassigned",
          stage: stageName,
          value: o.dealValue ? `₹${(o.dealValue / 100000).toFixed(1)}L` : "₹0"
        };
      });
      setKanbanDeals(mapped);
    } else {
      setKanbanDeals([]);
    }
  }, [selectedTeam, crm.opportunities]);

  const onDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const destStage = destination.droppableId;

    // Convert destStage name to stageId
    let newStageId = 'p_1';
    if (destStage === 'Qualified') newStageId = 'p_2';
    else if (destStage === 'Proposal') newStageId = 'p_4';
    else if (destStage === 'Negotiation') newStageId = 'p_5';
    else if (destStage === 'Won') newStageId = 'p_6';

    // 1. Optimistic state update
    setKanbanDeals(prev => prev.map(deal => {
      if (deal.id === draggableId) {
        return { ...deal, stage: destStage };
      }
      return deal;
    }));

    // 2. Perform backend context stage update
    crm.handleMoveOpportunity(draggableId, newStageId);
  };

  const handleTeamSelectChange = (teamId: string) => {
    if (teamId === 'all') {
      setSelectedTeam(null);
      router.push('/salesteam');
    } else {
      const team = teams.find(t => t.id === teamId);
      if (team) {
        setSelectedTeam(team);
        setActiveTab('performance');
        router.push(`/salesteam?team=${teamId}`);
      }
    }
  };

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
      crm.addToast('error', err?.response?.data?.message || 'Failed to create team');
    }
  };

  const handleDeleteTeam = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Avoid triggering selectedTeam modal
    if (!confirm('Are you sure you want to delete this sales team?')) return;
    try {
      await api.delete(`/salesteam/${id}`);
      crm.addToast('success', 'Sales team deleted');
      if (selectedTeam?.id === id) {
        setSelectedTeam(null);
        router.push('/salesteam');
      }
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

  // Helper to compile team metrics in real-time
  const compileTeamMetrics = (team: any) => {
    if (!team) return null;
    
    // Get IDs of all members and the leader
    const memberIds = (team.members || []).map((m: any) => m.id);
    if (team.leaderId) memberIds.push(team.leaderId);

    const memberNames = (team.members || []).map((m: any) => m.name);
    if (team.leader?.name) memberNames.push(team.leader.name);

    const memberNamesLower = memberNames.map((n: string) => n.trim().toLowerCase());

    // Filter out leads that have already been converted to opportunities to avoid double-counting
    const oppLeadIds = crm.opportunities.map((o: any) => o.leadId).filter(Boolean);
    const oppCustomerNames = crm.opportunities.map((o: any) => (o.customerName || '').toLowerCase().trim()).filter(Boolean);

    // Filter Leads (by ID or by name, excluding converted/won/lost ones to avoid double counting)
    const teamLeads = crm.leads.filter((l: any) => {
      const isConvertedStatus = ['converted', 'won', 'lost'].includes((l.status || '').toLowerCase());
      const hasMatchingOpp = (l.id && oppLeadIds.includes(l.id)) || 
                             (l.contactName && oppCustomerNames.includes(l.contactName.toLowerCase().trim()));
      
      return !isConvertedStatus && !hasMatchingOpp && (
        (l.assignedUserId && memberIds.includes(l.assignedUserId)) ||
        (l.assignedUser && memberNamesLower.includes(l.assignedUser.trim().toLowerCase()))
      );
    });
    
    // Filter Opportunities (by ID or by name)
    const teamOpps = crm.opportunities.filter((o: any) => 
      (o.assignedSalespersonId && memberIds.includes(o.assignedSalespersonId)) ||
      (o.assignedSalesperson && memberNamesLower.includes(o.assignedSalesperson.trim().toLowerCase()))
    );
    
    // Metrics calculations
    const totalLeadsCount = teamLeads.length + teamOpps.length;
    const wonOpps = teamOpps.filter((o: any) => (o.stageId || '').toLowerCase() === 'won' || (o.stageId || '').toLowerCase() === 'stage_won' || o.stageId === 'p_6');
    const lostOpps = teamOpps.filter((o: any) => (o.stageId || '').toLowerCase() === 'lost' || (o.stageId || '').toLowerCase() === 'stage_lost' || o.stageId === 'p_7');
    const openOpps = teamOpps.filter((o: any) => !['won', 'stage_won', 'lost', 'stage_lost', 'p_6', 'p_7'].includes((o.stageId || '').toLowerCase()));
    
    const wonCount = wonOpps.length;
    const lostCount = lostOpps.length;
    const openLeadsCount = teamLeads.length + openOpps.length;
    
    const totalRevenue = wonOpps.reduce((sum: number, o: any) => sum + (parseFloat(o.dealValue) || 0), 0);
    
    // Conversion Rate = Won / (Won + Lost)
    const conversionRate = totalLeadsCount > 0 
      ? Math.round((wonCount / totalLeadsCount) * 100) 
      : 0;

    // Pipeline stages breakdown
    const stageCounts: Record<string, number> = {};
    teamOpps.forEach((o: any) => {
      const stageName = o.stageName || o.stageId || 'Open';
      stageCounts[stageName] = (stageCounts[stageName] || 0) + 1;
    });

    // Compile participants list (Leader + Members)
    const allParticipants: any[] = [];
    if (team.leader) {
      allParticipants.push(team.leader);
    } else if (team.leaderId) {
      const foundLeader = crm.settingsUsers.find((u: any) => u.id === team.leaderId);
      if (foundLeader) allParticipants.push(foundLeader);
    }

    (team.members || []).forEach((m: any) => {
      if (!allParticipants.some(p => p.id === m.id)) {
        allParticipants.push(m);
      }
    });

    // Individual member stats (including leader)
    const membersPerformance = allParticipants.map((m: any) => {
      const isLeader = m.id === team.leaderId;
      const displayName = isLeader ? `${m.name} (Leader)` : m.name;

      const uLeads = crm.leads.filter((l: any) => {
        const isConvertedStatus = ['converted', 'won', 'lost'].includes((l.status || '').toLowerCase());
        const hasMatchingOpp = (l.id && oppLeadIds.includes(l.id)) || 
                               (l.contactName && oppCustomerNames.includes(l.contactName.toLowerCase().trim()));
        
        return !isConvertedStatus && !hasMatchingOpp && (
          l.assignedUserId === m.id || 
          (l.assignedUser && l.assignedUser.trim().toLowerCase() === m.name?.trim().toLowerCase())
        );
      });
      const uOpps = crm.opportunities.filter((o: any) => 
        o.assignedSalespersonId === m.id || 
        (o.assignedSalesperson && o.assignedSalesperson.trim().toLowerCase() === m.name?.trim().toLowerCase())
      );
      const uWon = uOpps.filter((o: any) => 
        (o.stageId || '').toLowerCase() === 'won' || 
        (o.stageId || '').toLowerCase() === 'stage_won' || 
        o.stageId === 'p_6'
      );
      const uRevenue = uWon.reduce((sum: number, o: any) => sum + (parseFloat(o.dealValue) || 0), 0);
      
      return {
        name: displayName,
        role: isLeader ? 'Team Leader' : (m.role || 'Sales Executive'),
        leads: uLeads.length + uOpps.length,
        won: uWon.length,
        revenue: uRevenue
      };
    });

    // Activities logged on team leads
    const allLeadIds = [...teamLeads.map((l: any) => l.id), ...teamOpps.map((o: any) => o.id)];
    const teamActivities = crm.activities.filter((act: any) => allLeadIds.includes(act.leadId));

    return {
      totalLeads: totalLeadsCount,
      won: wonCount,
      lost: lostCount,
      open: openLeadsCount,
      conversionRate,
      revenue: totalRevenue,
      stageCounts,
      membersPerformance,
      leadsList: [...teamLeads, ...teamOpps],
      activities: teamActivities
    };
  };

  const metrics = selectedTeam ? compileTeamMetrics(selectedTeam) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-6 text-txt-primary animate-fade-in">
      {/* Header */}
      {/* <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-crm pb-5">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600/10 p-2.5 rounded-xl border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-txt-primary font-inter">Teams</h1>
            <p className="text-xs text-txt-secondary mt-0.5">View complete pipeline stages and performance dashboards per sales team.</p>
          </div>
        </div>

       
      </div> */}

      {/* Team Select Dropdown Toolbar */}
      <div className="flex justify-between items-center bg-card border border-border-crm rounded-2xl p-2.5 shadow-xs text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-txt-secondary uppercase tracking-wider">Select Team:</span>
          <select
            value={selectedTeam?.id || 'all'}
            onChange={(e) => handleTeamSelectChange(e.target.value)}
            className="border border-border-crm rounded-xl px-3 py-1.5 text-xs bg-bg-main text-txt-primary font-bold focus:outline-none"
          >
            <option value="all">🌍 All Teams Overview</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>👥 {t.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-semibold transition flex items-center space-x-1.5 shadow-lg shadow-indigo-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Team</span>
        </button>
        {selectedTeam && (
          <button
            onClick={() => handleTeamSelectChange('all')}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 cursor-pointer"
          >
            ← Back to All Teams Overview
          </button>
          
        )}
      </div>

      {/* Grid list or Team Performance Dashboard */}
      {!selectedTeam ? (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-2xl border border-border-crm">
              <Users className="w-12 h-12 text-txt-secondary mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-txt-primary font-inter">No Teams found</h3>
              <p className="text-xs text-txt-secondary mt-1">Create teams to bundle salesperson users and route categories (e.g. Healthcare, Retail)</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map(team => (
                <div
                  key={team.id}
                  onClick={() => handleTeamSelectChange(team.id)}
                  className="bg-card border border-border-crm rounded-2xl p-6 transition flex flex-col justify-between hover:border-indigo-500/40 relative overflow-hidden cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-200"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-txt-primary text-base group-hover:text-indigo-600">{team.name}</h3>
                        {team.category && (
                          <span className="bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded mt-1.5 inline-block">
                            Category: {team.category}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => handleDeleteTeam(e, team.id)}
                        className="text-txt-secondary hover:text-rose-500 transition p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-txt-secondary leading-relaxed line-clamp-2">{team.description || 'No description provided'}</p>

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
        </>
      ) : (
        metrics && (
          <div className="space-y-6 animate-fade-in">
            {/* Team Pipeline Stage Board (Kanban) */}
            <div className="bg-card border border-border-crm rounded-2xl p-6 space-y-4">
              <div>
                <h3 className="font-extrabold text-sm tracking-tight text-txt-primary mb-1">{selectedTeam.name} Pipeline Stage board</h3>
                <p className="text-[10px] text-txt-secondary">Drag and drop deal opportunities to shift pipeline stages interactively.</p>
              </div>

              <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 pt-2">
                  {["New", "Qualified", "Proposal", "Negotiation", "Won"].map((col) => {
                    const dealsInCol = kanbanDeals.filter(d => d.stage === col);
                    return (
                      <div key={col} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-150 dark:border-border-crm rounded-xl p-3 flex flex-col space-y-2.5 min-h-64">
                        <div className="flex justify-between items-center border-b border-border-crm pb-2">
                          <span className="text-xs font-bold text-txt-primary flex items-center gap-1.5">
                            {col === 'New' ? '📥' : col === 'Qualified' ? '🎯' : col === 'Proposal' ? '📄' : col === 'Negotiation' ? '🤝' : '🎉'} {col}
                          </span>
                          <span className="bg-blue-100/50 dark:bg-slate-800 text-primary text-[9px] px-2 py-0.5 rounded-full font-bold">
                            {dealsInCol.length}
                          </span>
                        </div>

                        <Droppable droppableId={col}>
                          {(provided) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="space-y-2 flex-1 overflow-y-auto max-h-72 min-h-[120px]"
                            >
                              {dealsInCol.map((deal, index) => (
                                <Draggable key={deal.id} draggableId={deal.id} index={index}>
                                  {(providedDrag) => (
                                    <div 
                                      ref={providedDrag.innerRef}
                                      {...providedDrag.draggableProps}
                                      {...providedDrag.dragHandleProps}
                                      className="bg-card border border-border-crm rounded-lg p-3 shadow-xs space-y-2 text-txt-primary text-xs hover:border-primary/40 transition cursor-grab"
                                    >
                                      <div className="font-bold text-txt-primary truncate">{deal.name}</div>
                                      <div className="flex justify-between text-[10px] text-txt-secondary font-medium">
                                        <span>Rep: {deal.rep}</span>
                                        <span className="font-bold text-primary">{deal.value}</span>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {dealsInCol.length === 0 && (
                                <div className="text-center py-10 text-[10px] text-slate-400 select-none">Empty stage</div>
                              )}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    );
                  })}
                </div>
              </DragDropContext>
            </div>

            {/* Performance Dashboard Panel */}
            <div className="bg-card border border-border-crm rounded-2xl overflow-hidden shadow-sm flex flex-col text-txt-primary">
              
              {/* Tab Links */}
              <div className="flex border-b border-border-crm bg-bg-main px-6">
                <button
                  onClick={() => setActiveTab('performance')}
                  className={`py-3 px-4 font-bold text-xs border-b-2 transition-colors ${activeTab === 'performance' ? 'border-primary text-primary' : 'border-transparent text-txt-secondary hover:text-txt-primary'}`}
                >
                  Performance & Workload
                </button>
                <button
                  onClick={() => setActiveTab('leads')}
                  className={`py-3 px-4 font-bold text-xs border-b-2 transition-colors ${activeTab === 'leads' ? 'border-primary text-primary' : 'border-transparent text-txt-secondary hover:text-txt-primary'}`}
                >
                  Team Leads & Pipeline
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-6 space-y-6">
                
                {activeTab === 'performance' && (
                  <>
                    {/* Top Key Metrics Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-bg-main border border-border-crm p-4 rounded-xl flex items-center space-x-3">
                        <div className="bg-blue-600/10 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] text-txt-secondary block font-semibold uppercase">Total Leads</span>
                          <span className="text-lg font-extrabold text-txt-primary">{metrics.totalLeads}</span>
                        </div>
                      </div>

                      <div className="bg-bg-main border border-border-crm p-4 rounded-xl flex items-center space-x-3">
                        <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] text-txt-secondary block font-semibold uppercase">Deals Won</span>
                          <span className="text-lg font-extrabold text-txt-primary">{metrics.won}</span>
                        </div>
                      </div>

                      <div className="bg-bg-main border border-border-crm p-4 rounded-xl flex items-center space-x-3">
                        <div className="bg-indigo-600/10 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] text-txt-secondary block font-semibold uppercase">Win Rate</span>
                          <span className="text-lg font-extrabold text-txt-primary">{metrics.conversionRate}%</span>
                        </div>
                      </div>

                      <div className="bg-bg-main border border-border-crm p-4 rounded-xl flex items-center space-x-3">
                        <div className="bg-amber-500/10 p-2 rounded-lg text-amber-600 dark:text-amber-400">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] text-txt-secondary block font-semibold uppercase">Total Revenue</span>
                          <span className="text-sm font-extrabold text-txt-primary">₹{(metrics.revenue || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Individual Member Performance Table */}
                    <div className="bg-card border border-border-crm rounded-xl p-5 space-y-3">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-txt-secondary flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-primary" />
                        <span>Member Workload & Performance</span>
                      </h4>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-border-crm text-[10px] text-txt-secondary font-bold uppercase">
                              <th className="py-2.5">Salesperson Name</th>
                              <th className="py-2.5">Assigned Leads</th>
                              <th className="py-2.5">Won Opportunities</th>
                              <th className="py-2.5 text-right">Closed Revenue</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-crm text-txt-primary">
                            {metrics.membersPerformance.map((item: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                                <td className="py-3 font-bold">{item.name}</td>
                                <td className="py-3 font-semibold text-blue-500">{item.leads}</td>
                                <td className="py-3 font-semibold text-emerald-500">{item.won}</td>
                                <td className="py-3 text-right font-extrabold text-txt-primary">₹{item.revenue.toLocaleString()}</td>
                              </tr>
                            ))}
                            {metrics.membersPerformance.length === 0 && (
                              <tr>
                                <td colSpan={4} className="text-center py-6 text-txt-secondary italic">No members assigned to this team.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'leads' && (
                  <div className="space-y-6">
                    {/* Leads List */}
                    <div className="bg-card border border-border-crm rounded-xl p-5 space-y-3">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-txt-secondary flex items-center gap-1.5">
                        <ListCollapse className="w-4 h-4 text-primary" />
                        <span>Team Lead Allocation</span>
                      </h4>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-border-crm text-[10px] text-txt-secondary font-bold uppercase">
                              <th className="py-2.5">Lead Title</th>
                              <th className="py-2.5">Contact Name</th>
                              <th className="py-2.5">Assigned To</th>
                              <th className="py-2.5 text-right">Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-crm text-txt-primary">
                            {metrics.leadsList.map((lead: any) => (
                              <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                                <td className="py-3 font-bold text-blue-600 dark:text-blue-400">{lead.title || lead.company || 'Unnamed Lead'}</td>
                                <td className="py-3 text-txt-secondary">{lead.customerName || lead.contactName || lead.name || 'N/A'}</td>
                                <td className="py-3 font-semibold">{lead.assignedUser || lead.assignedSalesperson || 'Unassigned'}</td>
                                <td className="py-3 text-right font-extrabold text-txt-primary">₹{(parseFloat(lead.dealValue) || 0).toLocaleString()}</td>
                              </tr>
                            ))}
                            {metrics.leadsList.length === 0 && (
                              <tr>
                                <td colSpan={4} className="text-center py-6 text-txt-secondary italic">No active leads associated with this team.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}



              </div>
            </div>

          </div>
        )
      )}


      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border-crm rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="bg-bg-main px-5 py-3 border-b border-border-crm flex justify-between items-center">
              <h3 className="font-bold text-txt-primary text-xs">Create Team</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-txt-secondary hover:text-txt-primary cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-4.5 space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-txt-secondary mb-1">Team Name</label>
                <input
                  type="text" required
                  className="w-full border border-border-crm rounded-xl px-3.5 py-1.5 text-xs text-txt-primary bg-card focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Healthcare Team"
                  value={teamForm.name}
                  onChange={e => setTeamForm({ ...teamForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-txt-secondary mb-1">Team Category routing</label>
                <select
                  className="w-full border border-border-crm rounded-xl px-3.5 py-1.5 text-xs text-txt-primary bg-card focus:outline-none focus:border-indigo-500"
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
                <label className="block text-[10px] font-bold uppercase tracking-wider text-txt-secondary mb-1">Team Leader (Admin/CRM Manager)</label>
                <select
                  className="w-full border border-border-crm rounded-xl px-3.5 py-1.5 text-xs text-txt-primary bg-card focus:outline-none focus:border-indigo-500"
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
                <label className="block text-[10px] font-bold uppercase tracking-wider text-txt-secondary">Team Members (Sales Executives)</label>
                <div className="max-h-28 overflow-y-auto border border-border-crm bg-bg-main rounded-xl p-2.5 space-y-1.5">
                  {crm.settingsUsers
                    .filter((u: any) => u.role === 'User' || u.role === 'USER')
                    .map((u: any) => (
                      <label key={u.id} className="flex items-center space-x-2 text-[11px] text-txt-primary cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded text-indigo-500 border-border-crm bg-card focus:ring-0"
                          checked={teamForm.memberIds.includes(u.id)}
                          onChange={() => handleMemberCheckboxChange(u.id)}
                        />
                        <span>{u.name}</span>
                      </label>
                    ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-txt-secondary mb-1">Description</label>
                <textarea
                  rows={1}
                  className="w-full border border-border-crm rounded-xl px-3.5 py-1.5 text-xs text-txt-primary bg-card focus:outline-none focus:border-indigo-500"
                  placeholder="Details about sales target..."
                  value={teamForm.description}
                  onChange={e => setTeamForm({ ...teamForm, description: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 text-xs font-semibold transition cursor-pointer"
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
