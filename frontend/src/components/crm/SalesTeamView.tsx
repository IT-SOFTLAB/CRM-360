"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useCRM } from '@/context/CRMContext';
import { 
  Users, Plus, Shield, Trash2, X, BarChart3, 
  TrendingUp, CheckCircle, AlertCircle, FileText, 
  Calendar, Phone, Mail, Award, Briefcase, ListCollapse,
  ChevronDown, Upload, Download, Star
} from 'lucide-react';
import api from '@/services/api';
import { useSearchParams, useRouter } from 'next/navigation';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const formatCRMRevenue = (val: number) => {
  if (!val) return "₹0";
  if (val < 100000) {
    return `₹${val.toLocaleString()}`;
  }
  if (val < 10000000) {
    const lakhVal = val / 100000;
    return `₹${lakhVal % 1 === 0 ? lakhVal.toFixed(0) : lakhVal.toFixed(1)} Lakh`;
  }
  const crVal = val / 10000000;
  return `₹${crVal % 1 === 0 ? crVal.toFixed(0) : crVal.toFixed(1)} Crore`;
};

export default function SalesTeamView() {
  const crm = useCRM();
  const searchParams = useSearchParams();
  const router = useRouter();
  const teamParam = searchParams.get('team');

  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'performance' | 'leads' | 'opportunities' | 'activities'>('performance');
  const [kanbanDeals, setKanbanDeals] = useState<any[]>([]);
  const [selectedTeamLeadIds, setSelectedTeamLeadIds] = useState<string[]>([]);
  const [selectedTeamOppIds, setSelectedTeamOppIds] = useState<string[]>([]);
  const [starredLeads, setStarredLeads] = useState<string[]>([]);
  const [starredOpps, setStarredOpps] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleTermsAccept = () => {
    setShowImportModal(false);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDownloadSample = () => {
    const headers = [
      'contactName',
      'category',
      'serviceType',
      'company',
      'email',
      'phone',
      'assignedUser',
      'createdAt'
    ];

    const sampleRow = [
      'John Doe',
      'Healthcare',
      'Service Based',
      'Apex Ltd',
      'john@apex.com',
      '9876543210',
      selectedTeam?.leader?.name || 'Sarah Connor',
      new Date().toISOString()
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), sampleRow.join(',')].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "crm_leads_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    setSelectedTeamLeadIds([]);
    setSelectedTeamOppIds([]);
  }, [selectedTeam, activeTab]);

  const handleImportLeads = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setImporting(true);
    crm.addToast('info', 'Uploading leads file...');

    try {
      const url = selectedTeam ? `/leads/import?teamId=${selectedTeam.id}` : '/leads/import';
      const response = await api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = response.data;

      if (data.success) {
        crm.addToast('success', data.message || 'Leads imported successfully!');
        if (crm.loadCRMData) {
          await crm.loadCRMData();
        }
      } else {
        crm.addToast('error', data.message || 'Failed to import leads.');
        alert(data.message || 'uploading failed the csv file does not match the required fields');
      }
    } catch (error) {
      console.error(error);
      crm.addToast('error', 'Error uploading file. Server may be offline.');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleBulkAssignTeamLeads = async (userId: string) => {
    if (selectedTeamLeadIds.length === 0 || !selectedTeam) return;

    let userName = 'Unassigned';
    if (selectedTeam.leader?.id === userId) {
      userName = selectedTeam.leader.name;
    } else {
      const memberObj = (selectedTeam.members || []).find((m: any) => m.id === userId);
      if (memberObj) userName = memberObj.name;
    }

    if (confirm(`Assign ${selectedTeamLeadIds.length} selected leads to ${userName}?`)) {
      await crm.handleBulkAssignLeads(selectedTeamLeadIds, userId, userName);
      setSelectedTeamLeadIds([]);
    }
  };

  // Individual User Search & Filter States
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [userPeriodFilter, setUserPeriodFilter] = useState<'month' | 'overall'>('month');

  const currentYear = new Date().getFullYear();

  const crmStartYear = useMemo(() => {
    let earliest = currentYear;
    crm.opportunities.forEach((o: any) => {
      const yr = new Date(o.createdAt || o.createdDate || Date.now()).getFullYear();
      if (yr > 1990 && yr < earliest) earliest = yr;
    });
    return earliest;
  }, [crm.opportunities, currentYear]);

  const yearRangeOptions = useMemo(() => {
    const options: { value: string; label: string; start: number; end: number }[] = [];
    const maxYear = currentYear + 5;
    for (let yr = crmStartYear; yr <= maxYear; yr += 6) {
      const endYr = yr + 5;
      options.push({
        value: `${yr}-${endYr}`,
        label: `${yr}-${endYr}`,
        start: yr,
        end: endYr
      });
    }
    return options;
  }, [crmStartYear, currentYear]);

  const defaultYearRange = useMemo(() => {
    const opt = yearRangeOptions.find(r => currentYear >= r.start && currentYear <= r.end);
    return opt ? opt.value : (yearRangeOptions[yearRangeOptions.length - 1]?.value || `${currentYear - 5}-${currentYear}`);
  }, [yearRangeOptions, currentYear]);

  const defaultWeekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  }, []);

  const [userFinFilter, setUserFinFilter] = useState<'year' | 'month' | 'week'>('month');
  const [userFinYearRange, setUserFinYearRange] = useState<string>('');
  const [userFinMonthRange, setUserFinMonthRange] = useState<'jan-jun' | 'jul-dec'>(
    new Date().getMonth() < 6 ? 'jan-jun' : 'jul-dec'
  );
  const [userFinWeekStartDate, setUserFinWeekStartDate] = useState<string>(defaultWeekStart);

  // Form State
  const [teamForm, setTeamForm] = useState({
    name: '',
    description: '',
    leaderId: '',
    memberIds: [] as string[],
    category: ''
  });

  const fullUsersList = useMemo(() => {
    const list: any[] = [];
    const idSet = new Set();
    const nameSet = new Set();

    if (crm.settingsUsers && crm.settingsUsers.length > 0) {
      crm.settingsUsers.forEach((u: any) => {
        if (u.id && !idSet.has(u.id)) {
          idSet.add(u.id);
          if (u.name) nameSet.add(u.name.trim().toLowerCase());
          list.push({
            id: u.id,
            name: u.name,
            email: u.email || `${u.name.toLowerCase().replace(/\s+/g, '.')}@company.com`,
            role: u.role || 'Sales Executive'
          });
        }
      });
    }

    // Add any salespersons/users from leads & opportunities not in settingsUsers
    const leadUsers = crm.leads.map((l: any) => l.assignedUser).filter(Boolean);
    const oppUsers = crm.opportunities.map((o: any) => o.assignedSalesperson).filter(Boolean);

    [...leadUsers, ...oppUsers].forEach((name: any) => {
      const trimmed = String(name).trim();
      const lower = trimmed.toLowerCase();
      if (!nameSet.has(lower)) {
        nameSet.add(lower);
        list.push({
          id: trimmed,
          name: trimmed,
          email: `${lower.replace(/\s+/g, '.')}@company.com`,
          role: 'Sales Executive'
        });
      }
    });

    return list;
  }, [crm.settingsUsers, crm.leads, crm.opportunities]);

  const filteredUsersList = useMemo(() => {
    if (!userSearchQuery.trim()) return fullUsersList;
    const q = userSearchQuery.toLowerCase().trim();
    return fullUsersList.filter((u: any) => 
      (u.name || '').toLowerCase().includes(q) || 
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    );
  }, [fullUsersList, userSearchQuery]);

  const selectedUserObj = useMemo(() => {
    if (!selectedUserId) return null;
    return fullUsersList.find((u: any) => 
      u.id === selectedUserId || 
      u.name.trim().toLowerCase() === selectedUserId.trim().toLowerCase()
    ) || { id: selectedUserId, name: selectedUserId, role: 'Sales Executive' };
  }, [selectedUserId, fullUsersList]);

  const handleUserSearchInput = (query: string) => {
    setUserSearchQuery(query);
    if (!query.trim()) {
      setSelectedUserId('');
      return;
    }
    const q = query.trim().toLowerCase();
    const exactMatch = fullUsersList.find(u => 
      u.name.trim().toLowerCase() === q || 
      u.id.trim().toLowerCase() === q
    );
    if (exactMatch) {
      setSelectedUserId(exactMatch.id);
      setSelectedTeam(null);
    }
  };

  const compileUserMetrics = (userObj: any, period: 'month' | 'overall') => {
    if (!userObj) return null;
    const uName = (userObj.name || '').trim().toLowerCase();
    const uId = userObj.id;

    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    const isCurMonthDate = (dateVal?: string | Date) => {
      if (!dateVal) return false;
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return false;
      return d.getFullYear() === curYear && d.getMonth() === curMonth;
    };

    // Filter out converted/handled leads and leads with matching opportunities to ensure ONLY new untouched leads are counted
    const oppLeadIds = crm.opportunities.map((o: any) => o.leadId).filter(Boolean);
    const oppCustomerNames = crm.opportunities.map((o: any) => (o.customerName || '').toLowerCase().trim()).filter(Boolean);

    // User Leads (New untouched leads only)
    const userLeads = crm.leads.filter((l: any) => {
      const isAssigned = l.assignedUserId === uId || 
        (l.assignedUser && l.assignedUser.trim().toLowerCase() === uName);
      if (!isAssigned) return false;

      const statusLower = (l.status || '').toLowerCase();
      const isConvertedStatus = ['converted', 'won', 'lost'].includes(statusLower);
      const hasMatchingOpp = (l.id && oppLeadIds.includes(l.id)) || 
                             (l.contactName && oppCustomerNames.includes(l.contactName.toLowerCase().trim()));

      if (isConvertedStatus || hasMatchingOpp) return false;

      if (period === 'month') {
        return isCurMonthDate(l.createdDate || l.createdAt);
      }
      return true;
    });

    // User Opportunities
    const userOpps = crm.opportunities.filter((o: any) => {
      const isAssigned = o.assignedSalespersonId === uId || 
        (o.assignedSalesperson && o.assignedSalesperson.trim().toLowerCase() === uName);
      if (!isAssigned) return false;
      if (period === 'month') {
        return isCurMonthDate(o.closedDate || o.createdDate || o.createdAt || o.expectedClosing);
      }
      return true;
    });

    const wonOpps = userOpps.filter((o: any) => (o.stageId || '').toLowerCase() === 'won' || o.stageId === 'p_6');
    const lostOpps = userOpps.filter((o: any) => (o.stageId || '').toLowerCase() === 'lost' || o.stageId === 'p_7');
    const openOpps = userOpps.filter((o: any) => !['won', 'p_6', 'lost', 'p_7'].includes((o.stageId || '').toLowerCase()));

    const totalCustomersWon = wonOpps.length;
    const totalLeads = userLeads.length;
    const totalRevenue = wonOpps.reduce((sum: number, o: any) => sum + (parseFloat(o.dealValue) || 0), 0);

    const totalDeals = userOpps.length;
    const openCount = openOpps.length;
    const wonCount = wonOpps.length;
    const lostCount = lostOpps.length;

    const baseDenom = totalDeals || 1;
    const openPct = Math.round((openCount / baseDenom) * 100);
    const wonPct = Math.round((wonCount / baseDenom) * 100);
    const lostPct = Math.round((lostCount / baseDenom) * 100);

    // Financial performance chart bars for user
    let chartBars: { name: string; val: number; isCurrent: boolean }[] = [];

    if (userFinFilter === 'year') {
      const selectedRangeStr = userFinYearRange || defaultYearRange;
      const match = selectedRangeStr.match(/(\d+)-(\d+)/);
      const startYr = match ? parseInt(match[1]) : currentYear - 5;

      for (let i = 0; i < 6; i++) {
        const yr = startYr + i;
        const isCurrent = yr === now.getFullYear();
        const val = wonOpps
          .filter((o: any) => {
            const d = new Date(o.closedDate || o.createdDate || o.createdAt || now);
            return d.getFullYear() === yr;
          })
          .reduce((s: number, o: any) => s + (parseFloat(o.dealValue) || 0), 0);
        chartBars.push({ name: String(yr), val, isCurrent });
      }
    } else if (userFinFilter === 'month') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const startMo = userFinMonthRange === 'jan-jun' ? 0 : 6;
      const yr = now.getFullYear();

      for (let i = 0; i < 6; i++) {
        const mo = startMo + i;
        const isCurrent = yr === now.getFullYear() && mo === now.getMonth();
        const val = wonOpps
          .filter((o: any) => {
            const cd = new Date(o.closedDate || o.createdDate || o.createdAt || now);
            return cd.getFullYear() === yr && cd.getMonth() === mo;
          })
          .reduce((s: number, o: any) => s + (parseFloat(o.dealValue) || 0), 0);
        chartBars.push({ name: monthNames[mo], val, isCurrent });
      }
    } else {
      const startDate = new Date(userFinWeekStartDate || defaultWeekStart);
      startDate.setHours(0, 0, 0, 0);

      for (let i = 0; i < 7; i++) {
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + i);
        day.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        const isCurrent = day.getFullYear() === now.getFullYear() &&
                          day.getMonth() === now.getMonth() &&
                          day.getDate() === now.getDate();

        const val = wonOpps
          .filter((o: any) => {
            const cd = new Date(o.closedDate || o.createdDate || o.createdAt || now);
            return cd >= day && cd <= dayEnd;
          })
          .reduce((s: number, o: any) => s + (parseFloat(o.dealValue) || 0), 0);
        chartBars.push({ name: `${day.toLocaleString('default', { weekday: 'short' })} ${day.getDate()}`, val, isCurrent });
      }
    }

    const maxBarVal = Math.max(...chartBars.map(b => b.val)) || 1;

    return {
      totalCustomersWon,
      totalLeads,
      totalRevenue,
      totalDeals,
      openCount,
      wonCount,
      lostCount,
      openPct,
      wonPct,
      lostPct,
      chartBars,
      maxBarVal
    };
  };

  const userMetrics = useMemo(() => {
    return selectedUserObj ? compileUserMetrics(selectedUserObj, userPeriodFilter) : null;
  }, [
    selectedUserObj,
    userPeriodFilter,
    userFinFilter,
    userFinYearRange,
    userFinMonthRange,
    userFinWeekStartDate,
    crm.opportunities,
    crm.leads,
    defaultYearRange,
    defaultWeekStart
  ]);

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
    const totalLeadsCount = teamLeads.length;
    const wonOpps = teamOpps.filter((o: any) => (o.stageId || '').toLowerCase() === 'won' || (o.stageId || '').toLowerCase() === 'stage_won' || o.stageId === 'p_6');
    const lostOpps = teamOpps.filter((o: any) => (o.stageId || '').toLowerCase() === 'lost' || (o.stageId || '').toLowerCase() === 'stage_lost' || o.stageId === 'p_7');
    const openOpps = teamOpps.filter((o: any) => !['won', 'stage_won', 'lost', 'stage_lost', 'p_6', 'p_7'].includes((o.stageId || '').toLowerCase()));
    
    const wonCount = wonOpps.length;
    const lostCount = lostOpps.length;
    const openLeadsCount = teamLeads.length;
    
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
        leads: uLeads.length,
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
      leadsList: teamLeads,
      oppsList: teamOpps,
      oppsCount: teamOpps.length,
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

      {/* Team Select & Individual Executive Search Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-card border border-border-crm rounded-2xl p-3 shadow-xs text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Team Dropdown */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-txt-secondary uppercase tracking-wider">Team:</span>
            <select
              value={selectedTeam?.id || 'all'}
              onChange={(e) => {
                setSelectedUserId('');
                handleTeamSelectChange(e.target.value);
              }}
              className="border border-border-crm rounded-xl px-3 py-1.5 text-xs bg-bg-main text-txt-primary font-bold focus:outline-none"
            >
              <option value="all">🌍 All Teams</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>👥 {t.name}</option>
              ))}
            </select>
          </div>

          {/* User Search & Dropdown Selector */}
          <div className="flex items-center space-x-2 border-l border-border-crm/50 pl-3">
            <span className="text-xs font-bold text-txt-secondary uppercase tracking-wider">User Performance:</span>
            <div className="relative flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Search user..."
                value={userSearchQuery}
                onChange={e => handleUserSearchInput(e.target.value)}
                className="w-36 border border-border-crm rounded-xl px-2.5 py-1 text-[11px] bg-bg-main text-txt-primary focus:outline-none focus:border-primary"
              />
              <select
                value={selectedUserId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedUserId(val);
                  if (val) {
                    setSelectedTeam(null);
                    const found = fullUsersList.find(u => u.id === val);
                    if (found) setUserSearchQuery(found.name);
                  }
                }}
                className="border border-border-crm rounded-xl px-3 py-1.5 text-xs bg-bg-main text-txt-primary font-bold focus:outline-none max-w-[200px] cursor-pointer"
              >
                <option value="">👤 Select User</option>
                {filteredUsersList.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role || 'User'})</option>
                ))}
              </select>
              {(selectedUserId || userSearchQuery) && (
                <button
                  onClick={() => {
                    setSelectedUserId('');
                    setUserSearchQuery('');
                  }}
                  className="text-xs text-rose-500 hover:text-rose-600 font-bold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/30 border border-rose-200 cursor-pointer"
                  title="Clear user search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 justify-end">
          {/* Time Period Filter Toggle (Current Month vs Overall) */}
          {/* {(selectedUserId || selectedTeam) && (
            <div className="flex items-center bg-bg-main border border-border-crm rounded-xl p-1 gap-1">
              <button
                onClick={() => setUserPeriodFilter('month')}
                className={`px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                  userPeriodFilter === 'month' ? 'bg-primary text-white shadow-xs' : 'text-txt-secondary hover:text-txt-primary'
                }`}
              >
                Current Month
              </button>
              <button
                onClick={() => setUserPeriodFilter('overall')}
                className={`px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                  userPeriodFilter === 'overall' ? 'bg-primary text-white shadow-xs' : 'text-txt-secondary hover:text-txt-primary'
                }`}
              >
                Overall
              </button>
            </div>
          )} */}

          {selectedTeam && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".csv, .xlsx, .xls"
                onChange={handleImportLeads}
              />
              <button
                onClick={() => setShowImportModal(true)}
                disabled={importing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2 text-xs font-semibold transition flex items-center space-x-1.5 shadow-lg shadow-emerald-500/10 cursor-pointer shrink-0 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{importing ? 'Uploading...' : 'Import Leads'}</span>
              </button>
            </>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-semibold transition flex items-center space-x-1.5 shadow-lg shadow-indigo-500/10 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Team</span>
          </button>
        </div>
      </div>

      {/* Individual Sales Executive Performance Dashboard (When a specific user is searched/selected) */}
      {selectedUserObj && userMetrics && (
        <div className="space-y-6 animate-fade-in border-b border-border-crm/40 pb-6">
          {/* Header Banner */}
          <div className="bg-card border border-border-crm rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-lg shadow-md shrink-0">
                {(selectedUserObj.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold text-txt-primary tracking-tight">{selectedUserObj.name}</h2>
                  <span className="bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                    {selectedUserObj.role || 'Sales Executive'}
                  </span>
                </div>
                <p className="text-xs text-txt-secondary mt-0.5">{selectedUserObj.email || 'Individual Sales Analytics'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Filter Period:</span>
              <span className="text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full uppercase">
                {userPeriodFilter === 'month' ? 'Current Month' : 'Overall'}
              </span>
            </div>
          </div>

          {/* 3 Top KPI Cards: Total Customers Won, Total Leads, Total Revenue */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-card border border-border-crm rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-txt-secondary uppercase tracking-wider">Total Customers Won</p>
                <h3 className="text-2xl font-extrabold text-emerald-600">{userMetrics.totalCustomersWon}</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Won Opportunities</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-card border border-border-crm rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-txt-secondary uppercase tracking-wider">Total Leads</p>
                <h3 className="text-2xl font-extrabold text-blue-600">{userMetrics.totalLeads}</h3>
                <p className="text-[10px] text-slate-400 font-semibold">New Leads</p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                <Briefcase className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-card border border-border-crm rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-txt-secondary uppercase tracking-wider">Total Revenue</p>
                <h3 className="text-2xl font-extrabold text-indigo-600">
                  {userMetrics.totalRevenue >= 100000 
                    ? `₹${(userMetrics.totalRevenue / 100000).toFixed(1)} Lakh` 
                    : `₹${userMetrics.totalRevenue.toLocaleString()}`}
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold">Closed Deal Value</p>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Visualizations: Financial Performance Bar Chart + Deal Status Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Financial Performance Bar Chart */}
            <div className="bg-card border border-border-crm rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-border-crm/40 pb-3 flex-wrap gap-2">
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight text-txt-primary">Financial Performance</h3>
                  <p className="text-[10px] text-txt-secondary">Closed won revenue generated over time.</p>
                </div>
                
                {/* Filter tabs & Sub-filters */}
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  {userFinFilter === 'year' && (
                    <select
                      value={userFinYearRange || defaultYearRange}
                      onChange={(e) => setUserFinYearRange(e.target.value)}
                      className="text-[9px] font-extrabold py-0.5 px-1 rounded-md bg-card border border-border-crm text-txt-primary focus:outline-none focus:border-primary shadow-xs cursor-pointer"
                    >
                      {yearRangeOptions.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  )}

                  {userFinFilter === 'month' && (
                    <select
                      value={userFinMonthRange}
                      onChange={(e) => setUserFinMonthRange(e.target.value as any)}
                      className="text-[9px] font-extrabold py-0.5 px-1 rounded-md bg-card border border-border-crm text-txt-primary focus:outline-none focus:border-primary shadow-xs cursor-pointer"
                    >
                      <option value="jan-jun">Jan - Jun</option>
                      <option value="jul-dec">Jul - Dec</option>
                    </select>
                  )}

                  {userFinFilter === 'week' && (
                    <input
                      type="date"
                      value={userFinWeekStartDate}
                      onChange={(e) => setUserFinWeekStartDate(e.target.value)}
                      className="text-[9px] font-extrabold py-0.5 px-1 rounded-md bg-card border border-border-crm text-txt-primary focus:outline-none focus:border-primary shadow-xs cursor-pointer max-w-[100px]"
                    />
                  )}

                  <div className="flex items-center bg-bg-main border border-border-crm rounded-lg p-0.5 gap-0.5 shrink-0">
                    {(['year', 'month', 'week'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setUserFinFilter(f)}
                        className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide transition-all duration-200 cursor-pointer ${
                          userFinFilter === f
                            ? 'bg-primary text-white shadow-xs'
                            : 'text-txt-secondary hover:text-txt-primary hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {f === 'year' ? 'Year' : f === 'month' ? 'Month' : 'Week'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative w-full h-48 bg-bg-main border border-border-crm/40 rounded-xl p-4 flex items-end justify-around">
                {userMetrics.chartBars.map((bar, idx) => {
                  const heightPercent = userMetrics.maxBarVal > 0 ? (bar.val / userMetrics.maxBarVal) * 80 : 0;
                  const isHighlight = !!bar.isCurrent;
                  
                  return (
                    <div key={idx} className="flex flex-col items-center group relative h-full justify-end" style={{ width: `${100 / userMetrics.chartBars.length}%` }}>
                      {/* Tooltip on hover */}
                      <div className="absolute top-1 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20 bg-slate-900/90 text-white dark:bg-slate-100 dark:text-slate-900 text-[10px] font-bold px-2 py-1 rounded-md shadow-lg whitespace-nowrap -translate-y-1 group-hover:translate-y-0 flex flex-col items-center">
                        <span>{formatCRMRevenue(bar.val)}</span>
                        <span className="text-[8px] font-medium opacity-80">{bar.name}</span>
                        <div className="w-1.5 h-1.5 bg-slate-900/90 dark:bg-slate-100 rotate-45 -mb-1 -mt-0.5" />
                      </div>
                      
                      {/* Bar Graphic */}
                      <div className={`w-5 border rounded-t-sm transition-all duration-300 relative cursor-pointer ${
                        isHighlight
                          ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300/50'
                          : 'bg-slate-100 dark:bg-slate-800/40 border-border-crm/30'
                      }`} style={{ height: `${Math.max(heightPercent, bar.val > 0 ? 4 : 0)}%` }}>
                        <div className={`w-full h-full rounded-t-sm ${
                          isHighlight ? 'bg-primary hover:bg-primary/95' : 'bg-blue-600/80 dark:bg-blue-500/80 hover:bg-blue-600'
                        }`} />
                      </div>

                      {/* Period label */}
                      <span className={`text-[8px] font-bold uppercase mt-1.5 ${
                        isHighlight ? 'text-primary' : 'text-slate-400'
                      }`}>{bar.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Deal Status Donut & Breakdown Chart */}
            <div className="bg-card border border-border-crm rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="border-b border-border-crm/40 pb-3">
                <h3 className="font-extrabold text-sm tracking-tight text-txt-primary">Pipeline Status</h3>
                <p className="text-[10px] text-txt-secondary">Distribution of open, won, and lost opportunities.</p>
              </div>

              <div className="flex flex-col items-center justify-center py-2">
                <div className="relative w-32 h-32">
                  <svg viewBox="-2 -2 40 40" className="w-full h-full transform -rotate-90">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F1F5F9" strokeWidth="4" />
                    {userMetrics.totalDeals > 0 && (
                      <>
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#2563EB" strokeWidth="4.5" strokeDasharray={`${userMetrics.openPct} ${100 - userMetrics.openPct}`} strokeDashoffset="0" className="transition-all duration-500" />
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10B981" strokeWidth="4.5" strokeDasharray={`${userMetrics.wonPct} ${100 - userMetrics.wonPct}`} strokeDashoffset={-userMetrics.openPct} className="transition-all duration-500" />
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F43F5E" strokeWidth="4.5" strokeDasharray={`${userMetrics.lostPct} ${100 - userMetrics.lostPct}`} strokeDashoffset={-(userMetrics.openPct + userMetrics.wonPct)} className="transition-all duration-500" />
                      </>
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-extrabold text-txt-primary">{userMetrics.totalDeals}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Total</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-border-crm/40 pt-3 text-center">
                <div className="space-y-0.5">
                  <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Open
                  </div>
                  <span className="font-extrabold text-blue-600 text-xs">{userMetrics.openCount} ({userMetrics.openPct}%)</span>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Won
                  </div>
                  <span className="font-extrabold text-emerald-600 text-xs">{userMetrics.wonCount} ({userMetrics.wonPct}%)</span>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Lost
                  </div>
                  <span className="font-extrabold text-rose-600 text-xs">{userMetrics.lostCount} ({userMetrics.lostPct}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid list or Team Performance Dashboard */}
      {!selectedTeam && !selectedUserId ? (
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

            {/* Team Header Banner */}
            <div className="bg-card border border-border-crm rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-extrabold text-lg shadow-md shrink-0">
                  {selectedTeam.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-extrabold text-txt-primary tracking-tight">{selectedTeam.name}</h2>
                    {selectedTeam.category && (
                      <span className="bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase">
                        {selectedTeam.category}
                      </span>
                    )}
                  </div>
                  
                  {/* Leader details */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-txt-secondary mt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">Team Leader:</span>
                      <span className="font-bold text-txt-primary">{selectedTeam.leader?.name || 'No Leader Assigned'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{(selectedTeam.members?.length || 0) + (selectedTeam.leader ? 1 : 0)} Members</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTeamSelectChange('all')}
                  className="bg-slate-100 hover:bg-slate-200 border border-border-crm text-txt-primary font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  ← Back to Teams
                </button>
              </div>
            </div>


            {/* Performance Dashboard Panel */}
            <div className="bg-card border border-border-crm rounded-2xl overflow-hidden shadow-sm flex flex-col text-txt-primary">
              
              {/* Tab Links */}
              <div className="flex border-b border-border-crm bg-bg-main px-6 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('performance')}
                  className={`py-3 px-4 font-bold text-xs border-b-2 transition-colors whitespace-nowrap ${activeTab === 'performance' ? 'border-primary text-primary' : 'border-transparent text-txt-secondary hover:text-txt-primary'}`}
                >
                  Performance & Workload
                </button>
                <button
                  onClick={() => setActiveTab('leads')}
                  className={`py-3 px-4 font-bold text-xs border-b-2 transition-colors whitespace-nowrap ${activeTab === 'leads' ? 'border-primary text-primary' : 'border-transparent text-txt-secondary hover:text-txt-primary'}`}
                >
                  Leads 
                </button>
                <button
                  onClick={() => setActiveTab('opportunities')}
                  className={`py-3 px-4 font-bold text-xs border-b-2 transition-colors whitespace-nowrap ${activeTab === 'opportunities' ? 'border-primary text-primary' : 'border-transparent text-txt-secondary hover:text-txt-primary'}`}
                >
                  Pipeline 
                </button>
                {/* <button
                  onClick={() => setActiveTab('activities')}
                  className={`py-3 px-4 font-bold text-xs border-b-2 transition-colors whitespace-nowrap ${activeTab === 'activities' ? 'border-primary text-primary' : 'border-transparent text-txt-secondary hover:text-txt-primary'}`}
                >
                  Activities ({metrics.activities.length})
                </button> */}
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
                          <BarChart3 className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] text-txt-secondary block font-semibold uppercase">Pipeline Count</span>
                          <span className="text-lg font-extrabold text-txt-primary">{metrics.oppsCount}</span>
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
                      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pb-3 border-b border-border-crm/40">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-extrabold text-sm text-txt-primary">Leads</h4>
                          <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                            {metrics.totalLeads}
                          </span>
                        </div>

                        {/* Bulk actions bar inside teams leads tab */}
                        {selectedTeamLeadIds.length > 0 && selectedTeam && (
                          <div className="flex items-center space-x-3.5 bg-slate-50 dark:bg-slate-900 border border-border-crm/30 py-1 px-3 rounded-xl animate-in fade-in duration-200">
                            <span className="text-[10px] text-txt-secondary font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                              {selectedTeamLeadIds.length} Selected
                            </span>
                            <div className="flex items-center whitespace-nowrap">
                              <span className="font-semibold text-txt-secondary text-[11px] mr-2">Assign:</span>
                              <div className="relative flex items-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg border border-border-crm/30 transition shadow-sm cursor-pointer pl-2.5 pr-7 py-1">
                                <Users className="w-3.5 h-3.5 text-primary mr-1.5 shrink-0" />
                                <select
                                  className="bg-transparent text-txt-primary focus:outline-none text-[11px] font-bold cursor-pointer appearance-none pr-1 outline-none"
                                  value=""
                                  onChange={(e) => handleBulkAssignTeamLeads(e.target.value)}
                                >
                                  <option value="" disabled>Select member...</option>
                                  {selectedTeam.leader && (
                                    <option value={selectedTeam.leader.id}>{selectedTeam.leader.name} (Leader)</option>
                                  )}
                                  {(selectedTeam.members || []).map((m: any) => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                  ))}
                                </select>
                                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-border-crm text-[10px] text-txt-secondary font-bold uppercase select-none">
                              <th className="py-2.5 w-10">
                                <input
                                  type="checkbox"
                                  className="rounded text-primary border-border-crm focus:ring-0 cursor-pointer w-3.5 h-3.5"
                                  checked={metrics.leadsList.length > 0 && metrics.leadsList.every((l: any) => selectedTeamLeadIds.includes(l.id))}
                                  onChange={() => {
                                    const areAllSelected = metrics.leadsList.length > 0 && metrics.leadsList.every((l: any) => selectedTeamLeadIds.includes(l.id));
                                    if (areAllSelected) {
                                      setSelectedTeamLeadIds(prev => prev.filter(id => !metrics.leadsList.some((l: any) => l.id === id)));
                                    } else {
                                      const idsToAdd = metrics.leadsList.map((l: any) => l.id).filter((id: string) => !selectedTeamLeadIds.includes(id));
                                      setSelectedTeamLeadIds(prev => [...prev, ...idsToAdd]);
                                    }
                                  }}
                                />
                              </th>
                              <th className="py-2.5 font-extrabold text-txt-primary">Lead</th>
                              <th className="py-2.5">Contact Name</th>
                              <th className="py-2.5">Email</th>
                              <th className="py-2.5">Phone</th>
                              <th className="py-2.5">Salesperson</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-crm text-txt-primary">
                            {metrics.leadsList.map((lead: any) => {
                              return (
                                <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                                  <td className="py-3 w-10">
                                    <input
                                      type="checkbox"
                                      className="rounded text-primary border-border-crm focus:ring-0 cursor-pointer w-3.5 h-3.5"
                                      checked={selectedTeamLeadIds.includes(lead.id)}
                                      onChange={() => {
                                        setSelectedTeamLeadIds(prev =>
                                          prev.includes(lead.id) ? prev.filter(id => id !== lead.id) : [...prev, lead.id]
                                        );
                                      }}
                                    />
                                  </td>
                                  <td className="py-3">
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                                      LDS/{new Date(lead.createdAt || Date.now()).getFullYear()}/{(lead.id || '').slice(-5).toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="py-3 text-txt-secondary font-semibold">{lead.customerName || lead.contactName || lead.company || 'N/A'}</td>
                                  <td className="py-3 text-txt-secondary">{lead.email || '—'}</td>
                                  <td className="py-3 text-txt-secondary">{lead.phone || '—'}</td>
                                  <td className="py-3">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-extrabold text-[9px] uppercase shadow-xs">
                                        {(lead.assignedUser || 'U').charAt(0).toUpperCase()}
                                      </div>
                                      {selectedTeam && (
                                        <div className="relative inline-flex items-center bg-slate-50 dark:bg-slate-900 border border-border-crm/30 rounded-lg pl-2 pr-6 py-0.5 cursor-pointer">
                                          <select
                                            className="bg-transparent text-txt-primary focus:outline-none text-[10px] font-semibold cursor-pointer appearance-none pr-1 outline-none"
                                            value={lead.assignedUserId || ''}
                                            onChange={async (e) => {
                                              const newId = e.target.value;
                                              let newName = 'Unassigned';
                                              if (selectedTeam.leader?.id === newId) {
                                                newName = selectedTeam.leader.name;
                                              } else {
                                                const memberObj = (selectedTeam.members || []).find((m: any) => m.id === newId);
                                                if (memberObj) newName = memberObj.name;
                                              }
                                              await crm.handleUpdateLeadFromView(lead.id, {
                                                assignedUserId: newId || null,
                                                assignedUser: newName
                                              });
                                            }}
                                          >
                                            <option value="">Unassigned</option>
                                            {selectedTeam.leader && (
                                              <option value={selectedTeam.leader.id}>{selectedTeam.leader.name} (Leader)</option>
                                            )}
                                            {(selectedTeam.members || []).map((m: any) => (
                                              <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                          </select>
                                          <ChevronDown className="w-2 h-2 text-slate-400 absolute right-1.5 pointer-events-none" />
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            {metrics.leadsList.length === 0 && (
                              <tr>
                                <td colSpan={7} className="text-center py-6 text-txt-secondary italic">No active leads associated with this team.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'opportunities' && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Opportunities List */}
                    <div className="bg-card border border-border-crm rounded-xl p-5 space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pb-3 border-b border-border-crm/40">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-extrabold text-sm text-txt-primary">Opportunities</h4>
                          <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                            {metrics.oppsCount}
                          </span>
                        </div>

                        {/* Bulk actions bar for opportunities */}
                        {selectedTeamOppIds.length > 0 && selectedTeam && (
                          <div className="flex items-center space-x-3.5 bg-slate-50 dark:bg-slate-900 border border-border-crm/30 py-1 px-3 rounded-xl animate-in fade-in duration-200">
                            <span className="text-[10px] text-txt-secondary font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                              {selectedTeamOppIds.length} Selected
                            </span>
                            <div className="flex items-center whitespace-nowrap">
                              <span className="font-semibold text-txt-secondary text-[11px] mr-2">Assign:</span>
                              <div className="relative flex items-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg border border-border-crm/30 transition shadow-sm cursor-pointer pl-2.5 pr-7 py-1">
                                <Users className="w-3.5 h-3.5 text-primary mr-1.5 shrink-0" />
                                <select
                                  className="bg-transparent text-txt-primary focus:outline-none text-[11px] font-bold cursor-pointer appearance-none pr-1 outline-none"
                                  value=""
                                  onChange={async (e) => {
                                    const newId = e.target.value;
                                    let newName = 'Unassigned';
                                    if (selectedTeam.leader?.id === newId) {
                                      newName = selectedTeam.leader.name;
                                    } else {
                                      const memberObj = (selectedTeam.members || []).find((m: any) => m.id === newId);
                                      if (memberObj) newName = memberObj.name;
                                    }
                                    await crm.handleBulkAssignOpportunities(selectedTeamOppIds, newId, newName);
                                    setSelectedTeamOppIds([]);
                                  }}
                                >
                                  <option value="" disabled>Select member...</option>
                                  {selectedTeam.leader && (
                                    <option value={selectedTeam.leader.id}>{selectedTeam.leader.name} (Leader)</option>
                                  )}
                                  {(selectedTeam.members || []).map((m: any) => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                  ))}
                                </select>
                                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-border-crm text-[10px] text-txt-secondary font-bold uppercase select-none">
                              <th className="py-2.5 w-10">
                                <input
                                  type="checkbox"
                                  className="rounded text-primary border-border-crm focus:ring-0 cursor-pointer w-3.5 h-3.5"
                                  checked={metrics.oppsList.length > 0 && metrics.oppsList.every((o: any) => selectedTeamOppIds.includes(o.id))}
                                  onChange={() => {
                                    const areAllSelected = metrics.oppsList.length > 0 && metrics.oppsList.every((o: any) => selectedTeamOppIds.includes(o.id));
                                    if (areAllSelected) {
                                      setSelectedTeamOppIds(prev => prev.filter(id => !metrics.oppsList.some((o: any) => o.id === id)));
                                    } else {
                                      const idsToAdd = metrics.oppsList.map((o: any) => o.id).filter((id: string) => !selectedTeamOppIds.includes(id));
                                      setSelectedTeamOppIds(prev => [...prev, ...idsToAdd]);
                                    }
                                  }}
                                />
                              </th>
                              <th className="py-2.5 font-extrabold text-txt-primary">Opportunity</th>
                              <th className="py-2.5">Customer</th>
                              <th className="py-2.5">Expected Revenue</th>
                              <th className="py-2.5">Salesperson</th>
                              <th className="py-2.5">Stage</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-crm text-txt-primary">
                            {metrics.oppsList.map((opp: any) => {
                              const dbStage = crm.pipelines?.find((p: any) => p.id === opp.stageId);
                              const stageName = dbStage ? dbStage.name : (opp.stage || 'New');

                              const normalized = stageName.toLowerCase();
                              let colorClass = 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30';
                              if (normalized.includes('qualified')) {
                                colorClass = 'bg-cyan-50 text-cyan-700 border-cyan-100 dark:bg-cyan-950/20 dark:text-cyan-400 dark:border-cyan-900/30';
                              } else if (normalized.includes('proposition')) {
                                colorClass = 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
                              } else if (normalized.includes('negotiation')) {
                                colorClass = 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30';
                              } else if (normalized.includes('won')) {
                                colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
                              } else if (normalized.includes('lost')) {
                                colorClass = 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30';
                              }

                              return (
                                <tr key={opp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                                  <td className="py-3 w-10">
                                    <input
                                      type="checkbox"
                                      className="rounded text-primary border-border-crm focus:ring-0 cursor-pointer w-3.5 h-3.5"
                                      checked={selectedTeamOppIds.includes(opp.id)}
                                      onChange={() => {
                                        setSelectedTeamOppIds(prev =>
                                          prev.includes(opp.id) ? prev.filter(id => id !== opp.id) : [...prev, opp.id]
                                        );
                                      }}
                                    />
                                  </td>
                                  <td className="py-3">
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                                      OPP/{new Date(opp.createdAt || opp.createdDate || Date.now()).getFullYear()}/{(opp.id || '').slice(-5).toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="py-3 text-txt-secondary font-semibold">{opp.customerName || opp.company}</td>
                                  <td className="py-3 text-txt-primary font-bold">₹{(parseFloat(opp.dealValue) || 0).toLocaleString()}</td>
                                  <td className="py-3">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-extrabold text-[9px] uppercase shadow-xs">
                                        {(opp.assignedSalesperson || 'U').charAt(0).toUpperCase()}
                                      </div>
                                      {selectedTeam && (
                                        <div className="relative inline-flex items-center bg-slate-50 dark:bg-slate-900 border border-border-crm/30 rounded-lg pl-2 pr-6 py-0.5 cursor-pointer">
                                          <select
                                            className="bg-transparent text-txt-primary focus:outline-none text-[10px] font-semibold cursor-pointer appearance-none pr-1 outline-none"
                                            value={opp.assignedSalespersonId || ''}
                                            onChange={async (e) => {
                                              const newId = e.target.value;
                                              let newName = 'Unassigned';
                                              if (selectedTeam.leader?.id === newId) {
                                                newName = selectedTeam.leader.name;
                                              } else {
                                                const memberObj = (selectedTeam.members || []).find((m: any) => m.id === newId);
                                                if (memberObj) newName = memberObj.name;
                                              }
                                              await crm.handleUpdateOpportunity(opp.id, {
                                                assignedSalespersonId: newId || null,
                                                assignedSalesperson: newName
                                              });
                                            }}
                                          >
                                            <option value="">Unassigned</option>
                                            {selectedTeam.leader && (
                                              <option value={selectedTeam.leader.id}>{selectedTeam.leader.name} (Leader)</option>
                                            )}
                                            {(selectedTeam.members || []).map((m: any) => (
                                              <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                          </select>
                                          <ChevronDown className="w-2 h-2 text-slate-400 absolute right-1.5 pointer-events-none" />
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3">
                                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${colorClass}`}>
                                      {stageName}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                            {metrics.oppsList.length === 0 && (
                              <tr>
                                <td colSpan={7} className="text-center py-6 text-txt-secondary italic">No active opportunities associated with this team.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'activities' && (
                  <div className="space-y-6">
                    {/* Activities list */}
                    <div className="bg-card border border-border-crm rounded-xl p-5 space-y-3">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-txt-secondary flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>Team Activities Log</span>
                      </h4>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-border-crm text-[10px] text-txt-secondary font-bold uppercase select-none">
                              <th className="py-2.5">Activity Title</th>
                              <th className="py-2.5">Description</th>
                              <th className="py-2.5">Date & Time</th>
                              <th className="py-2.5">Salesperson</th>
                              <th className="py-2.5 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-crm text-txt-primary">
                            {metrics.activities.map((act: any) => (
                              <tr key={act.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                                <td className="py-3 font-bold text-txt-primary">{act.title}</td>
                                <td className="py-3 text-txt-secondary line-clamp-1 max-w-[250px]">{act.description || 'No description'}</td>
                                <td className="py-3 text-txt-secondary">
                                  {new Date(act.date).toLocaleDateString()} at {act.time || 'N/A'}
                                </td>
                                <td className="py-3 text-txt-secondary">{act.salesperson || 'Unassigned'}</td>
                                <td className="py-3 text-right">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                                    act.done 
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' 
                                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                                  }`}>
                                    {act.done ? 'Completed' : 'Pending'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {metrics.activities.length === 0 && (
                              <tr>
                                <td colSpan={5} className="text-center py-6 text-txt-secondary italic">No logged activities for this team.</td>
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

              {/* Sample Template Download Call-to-action */}
              <div className="flex items-center justify-between bg-card border border-border-crm p-3 rounded-xl gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-txt-primary text-xs">Need a sample file?</p>
                  <p className="text-[10px] text-txt-secondary mt-0.5 leading-snug">Get a pre-formatted template with all the correct column headings.</p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="px-2.5 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-[10px] font-semibold transition cursor-pointer flex items-center gap-1 shrink-0 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" style={{ strokeWidth: 2.5 }} />
                  <span>Get Template</span>
                </button>
              </div>
              
              <div>
                <h5 className="font-bold text-txt-primary mb-1">Required CSV/Excel Columns</h5>
                <p>The sheet must contain the following column headers exactly (case-sensitive):</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li><span className="font-bold text-txt-primary">contactName</span> (Required): The full name of the lead contact (minimum 3 characters).</li>
                  <li><span className="font-bold text-txt-primary">category</span> (Required): Industry category (e.g. "Healthcare", "Manufacturing", "IT Services").</li>
                  <li><span className="font-bold text-txt-primary">serviceType</span> (Required): Sales classification (e.g. "Service Based", "Product Based").</li>
                  <li><span className="font-bold text-txt-primary">company</span>: Organization / Company name.</li>
                  <li><span className="font-bold text-txt-primary">email</span>: Email address.</li>
                  <li><span className="font-bold text-txt-primary">phone</span>: 10-digit phone number.</li>
                  <li><span className="font-bold text-txt-primary">assignedUser</span>: Full name of the assigned sales representative.</li>
                  <li><span className="font-bold text-txt-primary">createdAt</span>: Creation date. Defaults to current date and time if omitted.</li>
                </ul>
              </div>

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
    </div>
  );
}
