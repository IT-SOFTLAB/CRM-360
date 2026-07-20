"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  ClipboardList,
  IndianRupee,
  TrendingUp,
  Users,
  Calendar as CalendarIcon,
  Check,
  Briefcase,
  FileText,
  CheckSquare,
  Plus,
  ArrowUpRight,
  Award,
  ShieldAlert,
  Zap,
  Layers,
  ArrowLeft,
  ArrowRight,
  UserCheck,
  Share2
} from 'lucide-react';
import { useCRM } from "../../context/CRMContext";
import api from "../../services/api";

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

const PIE_COLORS = ['#2563EB', '#10B981', '#F43F5E'];
const PIE_LABELS = ['Open Deals', 'Won Deals', 'Lost Deals'];

function buildPieSegs(values: number[], total: number) {
  const r = 15.915;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return values.map(v => {
    const dash = (v / total) * circ;
    const gap  = circ - dash;
    const seg  = { dash, gap, offset };
    offset += dash;
    return seg;
  });
}

// Combined pie chart: pie sized by revenue, legend shows both revenue (₹) AND deal count
function PipelinePieChart({
  label, openRev, wonRev, lostRev, openCnt, wonCnt, lostCnt
}: {
  label: string;
  openRev: number; wonRev: number; lostRev: number;
  openCnt: number; wonCnt: number; lostCnt: number;
}) {
  const revValues = [openRev, wonRev, lostRev];
  const cntValues = [openCnt, wonCnt, lostCnt];
  const totalRev  = openRev + wonRev + lostRev || 1;
  const totalDeals = openCnt + wonCnt + lostCnt;
  const segments  = buildPieSegs(revValues, totalRev);

  return (
    <div className="flex flex-col items-center w-full">
      {/* Period label */}
      <span className="mb-3 text-[10px] font-extrabold uppercase tracking-widest text-txt-secondary">{label}</span>

      {/* Donut pie — slices sized by revenue */}
      <div className="relative w-32 h-32 shrink-0">
        <svg viewBox="-2 -2 40 40" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F1F5F9" strokeWidth="3.5" />
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx="18" cy="18" r="15.915"
              fill="none"
              stroke={revValues[i] === 0 ? 'transparent' : PIE_COLORS[i]}
              strokeWidth="4.5"
              strokeDasharray={`${seg.dash} ${seg.gap}`}
              strokeDashoffset={-seg.offset}
              style={{ transition: 'stroke-dasharray 0.7s ease' }}
            />
          ))}
        </svg>
        {/* Center: Won revenue + won count */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-[9px] font-extrabold text-txt-primary leading-tight">{formatCRMRevenue(wonRev)}</span>
          <span className="text-[7px] text-emerald-600 font-bold uppercase mt-0.5">{wonCnt} Won</span>
        </div>
      </div>

      {/* Combined legend: one row per deal type — shows revenue + count */}
      <div className="w-full mt-4 space-y-2">
        {PIE_LABELS.map((lbl, i) => {
          const revPct = Math.round((revValues[i] / totalRev) * 100);
          return (
            <div key={i} className="flex items-center gap-1.5 text-[9px] px-0.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
              <span className="text-txt-primary font-semibold flex-1 truncate">{lbl}</span>
              <span className="font-bold" style={{ color: PIE_COLORS[i] }}>{formatCRMRevenue(revValues[i])}</span>
              <span className="text-txt-secondary mx-0.5">·</span>
              <span className="text-txt-secondary font-semibold">{cntValues[i]}</span>
              <span className="bg-slate-100 dark:bg-slate-800/60 text-txt-secondary rounded px-1 py-0.5 font-bold ml-0.5">{revPct}%</span>
            </div>
          );
        })}
      </div>

      {/* Bottom summary: total revenue + total deals */}
      <div className="w-full mt-3 rounded-xl border border-border-crm/50 bg-slate-50 dark:bg-slate-900/40 px-3 py-2 grid grid-cols-2 gap-2">
        <div className="text-center border-r border-border-crm/40 pr-2">
          <p className="text-[8px] font-bold uppercase text-txt-secondary tracking-wider">Total Rev</p>
          <p className="text-[9px] font-extrabold text-primary truncate">{formatCRMRevenue(openRev + wonRev + lostRev)}</p>
        </div>
        <div className="text-center pl-2">
          <p className="text-[8px] font-bold uppercase text-txt-secondary tracking-wider">Total Deals</p>
          <p className="text-[9px] font-extrabold text-primary">{totalDeals} deals</p>
        </div>
      </div>
    </div>
  );
}


interface DashboardViewProps {
  leads: any[];
  opportunities: any[];
  pipelines: any[];
  activities: any[];
  onToggleActivityDone: (id: string, done: boolean) => void;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export default function DashboardView({
  leads = [],
  opportunities = [],
  pipelines = [],
  activities = [],
  onToggleActivityDone,
  addToast
}: DashboardViewProps) {
  const { user, customers = [], quotations = [], referrals = [] } = useCRM();

  // Normalize user role
  const userRole = (user?.role || 'USER').toUpperCase().replace(/[\s_]+/g, '_');
  const isManager = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  // Filter out converted leads
  const activeLeads = useMemo(() => {
    return leads.filter(l => 
      l.status !== 'Converted' && 
      l.status !== 'converted' && 
      !opportunities.some(o => o.leadId === l.id)
    );
  }, [leads, opportunities]);

 
  const [usersList, setUsersList] = useState<any[]>([]);
  const [teamsList, setTeamsList] = useState<any[]>([]);
  const [finFilter, setFinFilter] = useState<'year' | 'month' | 'week'>('month');
  const [adminFinFilter, setAdminFinFilter] = useState<'year' | 'month' | 'week'>('month');


  useEffect(() => {
    if (isManager) {
      api.get('/users')
        .then(res => setUsersList(res.data || []))
        .catch(err => console.warn('Failed loading users for dashboard', err));
        
      api.get('/salesteam')
        .then(res => setTeamsList(res.data || []))
        .catch(err => console.warn('Failed loading teams for dashboard', err));
    }
  }, [isManager]);



  const selectedTeamId = 'all';

  const selectedTeamMembers = useMemo(() => {
    if (selectedTeamId === 'all') return null;
    const team = teamsList.find(t => t.id === selectedTeamId);
    return team ? (team.members || []).map((m: any) => m.name) : [];
  }, [selectedTeamId, teamsList]);

  const filteredOpps = useMemo(() => {
    if (!selectedTeamMembers) return opportunities;
    return opportunities.filter(o => selectedTeamMembers.includes(o.assignedSalesperson));
  }, [opportunities, selectedTeamMembers]);

  const filteredLeads = useMemo(() => {
    if (!selectedTeamMembers) return activeLeads;
    return activeLeads.filter(l => selectedTeamMembers.includes(l.assignedUser));
  }, [activeLeads, selectedTeamMembers]);

  const filteredActivities = useMemo(() => {
    const pending = activities.filter(a => !a.done);
    if (!selectedTeamMembers) return pending;
    return pending.filter(a => selectedTeamMembers.includes(a.salesperson));
  }, [activities, selectedTeamMembers]);

  // Total Revenue calculation
  const totalRevenueVal = useMemo(() => {
    const oppWonSum = filteredOpps
      .filter(o => o.stageId === 'p_6')
      .reduce((sum, o) => sum + (o.dealValue || 0), 0);
    const quoteWonSum = quotations
      .filter(q => q.status === 'Confirmed')
      .reduce((sum, q) => sum + (q.total || q.grandTotal || 0), 0);
    return Math.max(oppWonSum, quoteWonSum);
  }, [filteredOpps, quotations]);

  const displayRevenueStr = useMemo(() => {
    return formatCRMRevenue(totalRevenueVal);
  }, [totalRevenueVal]);

  // Conversion rate calculation
  const conversionRate = useMemo(() => {
    if (!filteredOpps.length) return 0;
    const wonCount = filteredOpps.filter(o => o.stageId === 'p_6').length;
    return Math.round((wonCount / filteredOpps.length) * 100);
  }, [filteredOpps]);

  // Lead Funnel Progression calculation
  const funnelData = useMemo(() => {
    const oppLeadIds = filteredOpps.map((o: any) => o.leadId).filter(Boolean);
    const unconvertedLeadsCount = filteredLeads.filter((l: any) => {
      const isConvertedStatus = ['converted', 'won', 'lost'].includes((l.status || '').toLowerCase());
      const hasMatchingOpp = l.id && oppLeadIds.includes(l.id);
      return !isConvertedStatus && !hasMatchingOpp;
    }).length;
    
    const p1Count = filteredOpps.filter(o => o.stageId === 'p_1' || (o.stage || '').toLowerCase() === 'new').length;
    const newCount = unconvertedLeadsCount + p1Count;

    const qualifiedCount = filteredOpps.filter(o => 
      o.stageId === 'p_2' || o.stageId === 'p_3' || o.stageId === 'p_5' ||
      ['qualified', 'discussion', 'negotiation'].includes((o.stage || '').toLowerCase())
    ).length;

    const proposalCount = filteredOpps.filter(o => o.stageId === 'p_4' || (o.stage || '').toLowerCase() === 'proposal').length;
    const wonCount = filteredOpps.filter(o => o.stageId === 'p_6' || (o.stage || '').toLowerCase() === 'won').length;
    const lostCount = filteredOpps.filter(o => o.stageId === 'p_7' || (o.stage || '').toLowerCase() === 'lost').length;

    return { 
      new: newCount, 
      qualified: qualifiedCount, 
      proposal: proposalCount, 
      won: wonCount, 
      lost: lostCount 
    };
  }, [filteredLeads, filteredOpps]);

  // Opportunity Pipeline count
  const pipelineChartData = useMemo(() => {
    const openCount = filteredOpps.filter(o => o.stageId !== 'p_6' && o.stageId !== 'p_7').length;
    const wonCount = filteredOpps.filter(o => o.stageId === 'p_6').length;
    const lostCount = filteredOpps.filter(o => o.stageId === 'p_7').length;

    return { open: openCount, won: wonCount, lost: lostCount };
  }, [filteredOpps]);

  // Table A: Team Performance Metrics
  const teamPerformanceData = useMemo(() => {
    if (teamsList.length === 0) {
      return [];
    }
    const activeTeams = selectedTeamId === 'all' ? teamsList : teamsList.filter(t => t.id === selectedTeamId);
    return activeTeams.map(team => {
      const memberNames = [
        team.leader?.name,
        ...(team.members || []).map((m: any) => m.name)
      ].filter(Boolean).map(n => n.trim().toLowerCase());

      const teamLeadsCount = leads.filter(l => {
        const assigned = l.assignedUser ? l.assignedUser.trim().toLowerCase() : '';
        return memberNames.includes(assigned);
      }).length;

      const teamOpps = opportunities.filter(o => {
        const assigned = o.assignedSalesperson ? o.assignedSalesperson.trim().toLowerCase() : '';
        return memberNames.includes(assigned);
      });
      
      const wonOpps = teamOpps.filter(o => o.stageId === 'p_6');
      const revSum = wonOpps.reduce((sum, o) => sum + (o.dealValue || 0), 0);

      return {
        team: team.name,
        leads: teamLeadsCount,
        won: wonOpps.length,
        rev: formatCRMRevenue(revSum)
      };
    });
  }, [teamsList, opportunities, leads, selectedTeamId]);

  // Table B: Top Salespersons
  const topSalespersonsData = useMemo(() => {
    const salesMap: { [name: string]: number } = {};
    opportunities.forEach(o => {
      if (o.stageId === 'p_6' && o.assignedSalesperson) {
        salesMap[o.assignedSalesperson] = (salesMap[o.assignedSalesperson] || 0) + (o.dealValue || 0);
      }
    });
    const sorted = Object.entries(salesMap)
      .map(([name, val]) => ({ name, val }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 3);
      
    if (!sorted.length) {
      return [
        { name: "Rahul", rev: "₹18 Lakh", rank: 1 },
        { name: "Priya", rev: "₹16 Lakh", rank: 2 },
        { name: "Aman", rev: "₹14 Lakh", rank: 3 }
      ];
    }
    return sorted.map((s, idx) => ({
      name: s.name,
      rev: `₹${(s.val / 100000).toFixed(0)} Lakh`,
      rank: idx + 1
    }));
  }, [opportunities]);

  // ==========================================
  // STATE FOR INTERACTIVE KANBAN (ADMIN)
  // ==========================================
  const [kanbanDeals, setKanbanDeals] = useState<any[]>([]);

  useEffect(() => {
    if (filteredOpps.length > 0) {
      const mapped = filteredOpps.map(o => {
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
      setKanbanDeals(mapped.slice(0, 10));
    } else {
      setKanbanDeals([
        { id: 'k1', name: "Acme Corp Ltd", rep: "Rahul", stage: "New", value: "₹4.5L" },
        { id: 'k2', name: "Initech Software", rep: "Priya", stage: "Qualified", value: "₹8.0L" },
        { id: 'k3', name: "Hooli Systems", rep: "Aman", stage: "Proposal", value: "₹12.5L" },
        { id: 'k4', name: "Stark Industries", rep: "Rahul", stage: "Negotiation", value: "₹35.0L" },
        { id: 'k5', name: "Wayne Enterprises", rep: "Priya", stage: "Won", value: "₹50.0L" },
        { id: 'k6', name: "Tyrell Corporation", rep: "Aman", stage: "Qualified", value: "₹18.0L" }
      ]);
    }
  }, [filteredOpps]);

  const moveKanban = (id: string, direction: 'left' | 'right') => {
    const columns = ["New", "Qualified", "Proposal", "Negotiation", "Won"];
    setKanbanDeals(prev => prev.map(deal => {
      if (deal.id !== id) return deal;
      const currentIndex = columns.indexOf(deal.stage);
      let nextIndex = currentIndex;
      if (direction === 'left' && currentIndex > 0) nextIndex = currentIndex - 1;
      if (direction === 'right' && currentIndex < columns.length - 1) nextIndex = currentIndex + 1;
      return { ...deal, stage: columns[nextIndex] };
    }));
  };

  // Workload distribution
  const workloadData = useMemo(() => {
    const counts: { [name: string]: number } = {};
    filteredLeads.forEach(ld => {
      const rep = ld.assignedUser || "Unassigned";
      counts[rep] = (counts[rep] || 0) + 1;
    });
    const totalLeads = filteredLeads.length || 1;
    const list = Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / totalLeads) * 100)
    })).sort((a, b) => b.count - a.count);
    
    return list;
  }, [filteredLeads]);

  // Admin view team-wide KPI totals
  const teamKPIs = useMemo(() => {
    const teamOpps = filteredOpps.length;
    
    // Filter out converted, won, lost leads to get unconverted leads
    const oppLeadIds = filteredOpps.map((o: any) => o.leadId).filter(Boolean);
    const oppCustomerNames = filteredOpps.map((o: any) => (o.customerName || '').toLowerCase().trim()).filter(Boolean);
    const teamLeadsList = filteredLeads.filter((l: any) => {
      const isConvertedStatus = ['converted', 'won', 'lost'].includes((l.status || '').toLowerCase());
      const hasMatchingOpp = (l.id && oppLeadIds.includes(l.id)) || 
                             (l.contactName && oppCustomerNames.includes(l.contactName.toLowerCase().trim()));
      return !isConvertedStatus && !hasMatchingOpp;
    });

    const teamQuotes = quotations.filter(q => {
      if (!selectedTeamMembers) return true;
      return selectedTeamMembers.includes(q.salesperson);
    }).length;
    
    const teamCusts = customers.filter(c => {
      if (!selectedTeamMembers) return true;
      return selectedTeamMembers.includes(c.assignedSalesperson);
    }).length;
    
    const revSum = filteredOpps
      .filter(o => o.stageId === 'p_6')
      .reduce((sum, o) => sum + (o.dealValue || 0), 0);
      
    return {
      members: selectedTeamMembers ? selectedTeamMembers.length : usersList.length,
      leads: teamLeadsList.length,
      opps: teamOpps,
      quotes: teamQuotes,
      cust: teamCusts,
      rev: formatCRMRevenue(revSum)
    };
  }, [filteredOpps, quotations, customers, usersList, filteredLeads, selectedTeamMembers]);

  // Dynamic leaderboard rankings (deals won vs leads assigned)
  const dynamicLeaderboard = useMemo(() => {
    const participants = usersList.length > 0 
      ? usersList 
      : Array.from(new Set([
          ...leads.map(l => l.assignedUser).filter(Boolean),
          ...opportunities.map(o => o.assignedSalesperson).filter(Boolean)
        ])).map(name => ({ id: name, name }));

    const mapped = participants.map((u: any) => {
      const uNameLower = (u.name || '').trim().toLowerCase();
      
      const uLeadsCount = leads.filter(l => 
        l.assignedUserId === u.id || 
        (l.assignedUser && l.assignedUser.trim().toLowerCase() === uNameLower)
      ).length;

      const uOpps = opportunities.filter(o => 
        o.assignedSalespersonId === u.id || 
        (o.assignedSalesperson && o.assignedSalesperson.trim().toLowerCase() === uNameLower)
      );
      const uWonCount = uOpps.filter(o => o.stageId === 'p_6').length;
      const uRevVal = uOpps.filter(o => o.stageId === 'p_6').reduce((sum, o) => sum + (o.dealValue || 0), 0);

      return {
        name: u.name || "Unknown",
        leads: uLeadsCount,
        won: uWonCount,
        revVal: uRevVal,
        rev: formatCRMRevenue(uRevVal)
      };
    });

    return mapped.sort((a, b) => b.revVal - a.revVal || b.won - a.won).slice(0, 3);
  }, [usersList, leads, opportunities]);

  // ==========================================
  // REAL-TIME USER-SIDE METRICS CALCULATIONS
  // ==========================================

  const myOpps = useMemo(() => {
    return opportunities.filter(o => o.assignedSalesperson === user?.name || o.assignedSalespersonId === user?.id);
  }, [opportunities, user]);

  const myPipelineStages = useMemo(() => {
    const total = myOpps.length || 1;
    const newCount = myOpps.filter(o => o.stageId === 'p_1').length;
    const qualCount = myOpps.filter(o => o.stageId === 'p_2' || o.stageId === 'p_3').length;
    const propCount = myOpps.filter(o => o.stageId === 'p_4').length;
    const negoCount = myOpps.filter(o => o.stageId === 'p_5').length;
    const wonCount = myOpps.filter(o => o.stageId === 'p_6').length;
    
    return [
      { stage: "New", count: newCount, pct: Math.round((newCount / total) * 100), color: "bg-blue-600" },
      { stage: "Qualified", count: qualCount, pct: Math.round((qualCount / total) * 100), color: "bg-primary" },
      { stage: "Proposal", count: propCount, pct: Math.round((propCount / total) * 100), color: "bg-blue-400" },
      { stage: "Negotiation", count: negoCount, pct: Math.round((negoCount / total) * 100), color: "bg-blue-300" },
      { stage: "Won", count: wonCount, pct: Math.round((wonCount / total) * 100), color: "bg-emerald-500" }
    ];
  }, [myOpps]);

  const myUpcomingActivities = useMemo(() => {
    return activities.filter(act => act.salesperson === user?.name && !act.done);
  }, [activities, user]);

  // Executive personal metrics
  const myKPIs = useMemo(() => {
    const myLeads = activeLeads.filter(l => l.assignedUser === user?.name || l.assignedUserId === user?.id).length;
    const myQuotes = quotations.filter(q => q.salesperson === user?.name).length;
    const myCusts = customers.filter(c => c.assignedSalesperson === user?.name).length;
    const wonSum = myOpps
      .filter(o => o.stageId === 'p_6' || o.stage === 'Won' || o.stage === 'Won 🎉')
      .reduce((sum, o) => sum + (o.dealValue || 0), 0);
    
    return {
      leads: myLeads,
      opps: myOpps.length,
      quotes: myQuotes,
      cust: myCusts,
      rev: `₹${wonSum.toLocaleString()}`
    };
  }, [activeLeads, myOpps, quotations, customers, user]);

  const myRecentLeads = useMemo(() => {
    const filtered = activeLeads.filter(l => l.assignedUser === user?.name || l.assignedUserId === user?.id);
    return filtered.slice(0, 3).map(l => ({
      name: l.contactName || "Unnamed Customer",
      stage: l.status || "New",
      color: l.status === "Converted" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
    }));
  }, [activeLeads, user]);

  const myRecentQuotations = useMemo(() => {
    const filtered = quotations.filter(q => q.salesperson === user?.name);
    return filtered.slice(0, 3).map(q => ({
      name: q.customerName,
      amt: `₹${(q.total || q.grandTotal || 0).toLocaleString()}`,
      status: q.status || "Draft",
      color: q.status === "Draft" ? "bg-gray-100 text-gray-700" : q.status === "Sent" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
    }));
  }, [quotations, user]);

  const monthlyRevenueData = useMemo(() => {
    const months: any[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        name: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        val: 0
      });
    }

    filteredOpps.forEach(o => {
      if (o.stageId === 'p_6') {
        const closedDate = o.closedDate ? new Date(o.closedDate) : new Date(o.createdDate || o.createdAt || now);
        months.forEach(m => {
          if (closedDate.getMonth() === m.monthIndex && closedDate.getFullYear() === m.year) {
            m.val += (o.dealValue || 0);
          }
        });
      }
    });

    return months.map(m => ({ name: m.name, val: m.val }));
  }, [filteredOpps]);

  const maxMonthlyVal = useMemo(() => {
    return Math.max(...monthlyRevenueData.map(m => m.val)) || 1;
  }, [monthlyRevenueData]);

  const teamSalesBreakdown = useMemo(() => {
    if (teamsList.length === 0) {
      return [];
    }
    const activeTeams = selectedTeamId === 'all' ? teamsList : teamsList.filter(t => t.id === selectedTeamId);
    const breakdown = activeTeams.map((team, idx) => {
      const memberNames = [
        team.leader?.name,
        ...(team.members || []).map((m: any) => m.name)
      ].filter(Boolean).map(n => n.trim().toLowerCase());

      const teamOpps = opportunities.filter(o => {
        const assigned = o.assignedSalesperson ? o.assignedSalesperson.trim().toLowerCase() : '';
        return memberNames.includes(assigned);
      });
      
      const wonOpps = teamOpps.filter(o => o.stageId === 'p_6');
      const rev = wonOpps.reduce((sum, o) => sum + (o.dealValue || 0), 0);
      return {
        name: team.name,
        value: rev,
        color: idx === 0 ? '#2563EB' : idx === 1 ? '#60A5FA' : idx === 2 ? '#1E3A8A' : '#93C5FD'
      };
    });

    return breakdown;
  }, [teamsList, opportunities, selectedTeamId]);

  const totalTeamClosedRevenue = useMemo(() => {
    return teamSalesBreakdown.reduce((sum, item) => sum + item.value, 0);
  }, [teamSalesBreakdown]);

  const donutSegments = useMemo(() => {
    const total = totalTeamClosedRevenue || 1;
    let accumulatedPercent = 0;
    return teamSalesBreakdown.map(item => {
      const pct = Math.round((item.value / total) * 100);
      const segment = {
        name: item.name,
        value: item.value,
        pct,
        color: item.color,
        dashArray: `${pct} ${100 - pct}`,
        dashOffset: -accumulatedPercent
      };
      accumulatedPercent += pct;
      return segment;
    });
  }, [teamSalesBreakdown, totalTeamClosedRevenue]);

  const topSalespersonsChart = useMemo(() => {
    const salesMap: { [name: string]: number } = {};
    filteredOpps.forEach(o => {
      if (o.stageId === 'p_6' && o.assignedSalesperson) {
        const nameKey = o.assignedSalesperson.trim();
        salesMap[nameKey] = (salesMap[nameKey] || 0) + (o.dealValue || 0);
      }
    });
    let sorted = Object.entries(salesMap)
      .map(([name, val]) => ({ name, val }))
      .sort((a, b) => b.val - a.val);

    if (!sorted.length) {
      return [];
    }

    const maxVal = Math.max(...sorted.map(s => s.val)) || 1;
    return sorted.slice(0, 4).map((s, idx) => ({
      name: s.name,
      val: s.val,
      revStr: formatCRMRevenue(s.val),
      pct: Math.round((s.val / maxVal) * 100),
      rank: idx + 1
    }));
  }, [filteredOpps]);

  // --- DASHBOARD 1: SUPER ADMIN DASHBOARD ---
  if (userRole === 'SUPER_ADMIN') {
    return (
      <div className="space-y-6 text-txt-primary animate-fade-in">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-txt-primary">Company Overview</h2>
            
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Users", val: usersList.length.toString(), change: "Active across platform", icon: Users, isPrimary: false },
            { label: "Total Teams", val: teamsList.length.toString(), change: "Active divisions", icon: Briefcase, isPrimary: false },
            { label: "Total Customers", val: customers.length.toLocaleString(), change: "Accounts registered", icon: UserCheck, isPrimary: false },
            { label: "Total Leads", val: activeLeads.length.toLocaleString(), change: "Unconverted entries", icon: Layers, isPrimary: false },
            { label: "Total Opportunities", val: opportunities.length.toLocaleString(), change: "Active deals", icon: ClipboardList, isPrimary: false },
            { label: "Total Quotations", val: quotations.length.toLocaleString(), change: "Sent to clients", icon: FileText, isPrimary: false },
            { label: "Total Retentions", val: referrals.length.toLocaleString(), change: "Referral submissions", icon: Share2, isPrimary: false },
            { label: "Total Revenue", val: displayRevenueStr, change: "Closed won statistics", icon: IndianRupee, isPrimary: true },
          //  { label: "Conversion Rate", val: `${conversionRate}%`, change: "Lead conversion ratio", icon: TrendingUp, isPrimary: false }
          ].map((card, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-5 border shadow-xs transition hover:shadow ${
                card.isPrimary 
                  ? 'bg-primary text-white border-primary/50' 
                  : 'bg-card border-border-crm text-txt-primary'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${card.isPrimary ? 'text-blue-100' : 'text-txt-secondary'}`}>
                    {card.label}
                  </p>
                  <h3 className="text-2xl font-extrabold tracking-tight">{card.val}</h3>
                </div>
                <div className={`p-2.5 rounded-xl ${card.isPrimary ? 'bg-white/10 text-white' : 'bg-blue-50 text-primary border border-blue-100/50'}`}>
                  <card.icon className="w-4.5 h-4.5" />
                </div>
              </div>
              <p className={`text-[10px] mt-3 font-semibold ${card.isPrimary ? 'text-blue-200' : 'text-slate-400'}`}>
                {card.change}
              </p>
            </div>
          ))}
        </div>

        {/* 2. Financial Performance Section */}
        {(() => {
          const now = new Date();

          // Build bar chart data depending on active filter
          let chartBars: { name: string; val: number }[] = [];

          if (finFilter === 'year') {
            // Last 6 years
            for (let i = 5; i >= 0; i--) {
              const yr = now.getFullYear() - i;
              const val = filteredOpps
                .filter(o => o.stageId === 'p_6')
                .filter(o => {
                  const d = new Date(o.closedDate || o.createdDate || o.createdAt || now);
                  return d.getFullYear() === yr;
                })
                .reduce((s, o) => s + (o.dealValue || 0), 0);
              chartBars.push({ name: String(yr), val });
            }
          } else if (finFilter === 'month') {
            // Last 6 months
            for (let i = 5; i >= 0; i--) {
              const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
              const yr = d.getFullYear(); const mo = d.getMonth();
              const val = filteredOpps
                .filter(o => o.stageId === 'p_6')
                .filter(o => {
                  const cd = new Date(o.closedDate || o.createdDate || o.createdAt || now);
                  return cd.getFullYear() === yr && cd.getMonth() === mo;
                })
                .reduce((s, o) => s + (o.dealValue || 0), 0);
              chartBars.push({ name: d.toLocaleString('default', { month: 'short' }), val });
            }
          } else {
            // Last 7 days
            for (let i = 6; i >= 0; i--) {
              const day = new Date(now); day.setDate(now.getDate() - i); day.setHours(0,0,0,0);
              const dayEnd = new Date(day); dayEnd.setHours(23,59,59,999);
              const val = filteredOpps
                .filter(o => o.stageId === 'p_6')
                .filter(o => {
                  const cd = new Date(o.closedDate || o.createdDate || o.createdAt || now);
                  return cd >= day && cd <= dayEnd;
                })
                .reduce((s, o) => s + (o.dealValue || 0), 0);
              chartBars.push({ name: day.toLocaleString('default', { weekday: 'short' }), val });
            }
          }

          const maxBarVal = Math.max(...chartBars.map(b => b.val)) || 1;

          // Summary stats for current vs previous period
          const curVal  = chartBars[chartBars.length - 1]?.val || 0;
          const prevVal = chartBars[chartBars.length - 2]?.val || 0;
          const curLabel  = finFilter === 'year' ? 'This Year'  : finFilter === 'month' ? 'This Month'  : 'Today';
          const prevLabel = finFilter === 'year' ? 'Last Year'  : finFilter === 'month' ? 'Last Month'  : 'Yesterday';

          const growthPct = prevVal > 0 ? Math.round(((curVal - prevVal) / prevVal) * 100) : (curVal > 0 ? 100 : 0);
          const growthPos = growthPct >= 0;

          return (
            <div className="bg-card border border-border-crm rounded-2xl p-4 space-y-3">
              {/* Simple Header */}
              <div className="border-b border-border-crm/30 pb-2">
                <h3 className="font-extrabold text-sm tracking-tight text-txt-primary">Financial Performance</h3>
                <p className="text-[9px] text-txt-secondary">Closed won revenue vs deal status breakdown.</p>
              </div>

              {/* Bar chart + Pie chart side by side */}
              <div className="flex flex-col lg:flex-row gap-4 items-stretch">

                {/* Bar chart — 3/4 width with absolute positioned stats & filter tabs */}
                <div className="relative flex-1 h-72 lg:h-56 bg-bg-main border border-border-crm/40 rounded-xl p-4 flex flex-col justify-between">
                  {/* Top bar inside container holding stats (left) and filter tabs (right) */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 w-full z-10">
                    {/* Inline Summary Metrics (Top Left) */}
                    <div className="flex items-center gap-3 text-xs font-semibold bg-bg-main/70 backdrop-blur-xs px-2 py-1 rounded-lg border border-border-crm/20">
                      <div>
                        <span className="text-txt-secondary text-[9px] uppercase font-bold mr-1">{curLabel}:</span>
                        <span className="text-txt-primary font-bold text-xs">{formatCRMRevenue(curVal)}</span>
                      </div>
                      <div className="border-l border-border-crm/30 pl-2">
                        <span className="text-txt-secondary text-[9px] uppercase font-bold mr-1">{prevLabel}:</span>
                        <span className="text-txt-primary font-bold text-xs">{formatCRMRevenue(prevVal)}</span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 border leading-none ${
                        growthPos
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-rose-50 border-rose-200 text-rose-700'
                      }`}>
                        <TrendingUp className="w-2.5 h-2.5" />
                        {growthPos ? '+' : ''}{growthPct}%
                      </span>
                    </div>

                    {/* Filter tabs (top right) */}
                    <div className="flex items-center bg-bg-main/90 backdrop-blur-xs border border-border-crm/40 rounded-lg p-0.5 gap-0.5 shrink-0">
                      {(['year', 'month', 'week'] as const).map(f => (
                        <button
                          key={f}
                          onClick={() => setFinFilter(f)}
                          className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide transition-all duration-200 cursor-pointer ${
                            finFilter === f
                              ? 'bg-primary text-white shadow-xs'
                              : 'text-txt-secondary hover:text-txt-primary hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {f === 'year' ? 'Year' : f === 'month' ? 'Month' : 'Week'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 flex items-end justify-around w-full pt-4">
                    {chartBars.map((bar, idx) => {
                      const heightPct = maxBarVal > 0 ? (bar.val / maxBarVal) * 80 : 0;
                      const isLatest = idx === chartBars.length - 1;
                      return (
                        <div key={idx} className="flex flex-col items-center group relative h-full justify-end" style={{ width: `${100 / chartBars.length}%` }}>
                          {/* Bar */}
                          <div className={`w-8 border rounded-t-lg h-36 flex items-end overflow-hidden ${
                            isLatest
                              ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300/50'
                              : 'bg-slate-100 dark:bg-slate-800/40 border-border-crm/30'
                          }`}>
                            <div
                              style={{ height: `${Math.max(heightPct, bar.val > 0 ? 4 : 0)}%` }}
                              className={`w-full rounded-t-md transition-all duration-500 cursor-pointer ${
                                isLatest
                                  ? 'bg-gradient-to-t from-blue-700 to-blue-500 hover:from-blue-600 hover:to-blue-400'
                                  : 'bg-gradient-to-t from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300'
                              }`}
                            />
                          </div>
                          {/* Label */}
                          <span className={`text-[9px] font-extrabold uppercase mt-2 select-none ${
                            isLatest ? 'text-primary' : 'text-slate-400 dark:text-slate-500'
                          }`}>{bar.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Deal Status Pie — 2/4 width equivalent (w-72) */}
                {(() => {
                  const openN  = filteredOpps.filter(o => o.stageId !== 'p_6' && o.stageId !== 'p_7').length;
                  const wonN   = filteredOpps.filter(o => o.stageId === 'p_6').length;
                  const lostN  = filteredOpps.filter(o => o.stageId === 'p_7').length;
                  const totalN = openN + wonN + lostN || 1;

                  const pieSegs = buildPieSegs([openN, wonN, lostN], totalN);
                  const DEAL_COLORS = ['#2563EB', '#10B981', '#F43F5E'];
                  const DEAL_LABELS = [
                    { label: 'Open', count: openN, color: DEAL_COLORS[0] },
                    { label: 'Won',  count: wonN,  color: DEAL_COLORS[1] },
                    { label: 'Lost', count: lostN, color: DEAL_COLORS[2] },
                  ];

                  return (
                    <div className="w-full lg:w-72 lg:shrink-0 h-56 bg-bg-main border border-border-crm/40 rounded-xl p-3.5 flex flex-col items-center justify-between">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-txt-secondary text-center w-full">Deal Status</p>

                      {/* Donut chart - centered and occupying full container width */}
                      <div className="relative w-28 h-28 my-0.5">
                        <svg viewBox="-2 -2 40 40" className="w-full h-full -rotate-90">
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F1F5F9" strokeWidth="4" />
                          {pieSegs.map((seg, i) => (
                            <circle
                              key={i}
                              cx="18" cy="18" r="15.915"
                              fill="none"
                              stroke={[openN, wonN, lostN][i] === 0 ? 'transparent' : DEAL_COLORS[i]}
                              strokeWidth="5"
                              strokeDasharray={`${seg.dash} ${seg.gap}`}
                              strokeDashoffset={-seg.offset}
                              style={{ transition: 'stroke-dasharray 0.6s ease' }}
                            />
                          ))}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-lg font-extrabold text-txt-primary">{openN + wonN + lostN}</span>
                          <span className="text-[10px] text-txt-secondary font-bold uppercase">total</span>
                        </div>
                      </div>

                      {/* Legend displaying count and percentage breakdown at the bottom */}
                      <div className="flex flex-row justify-around w-full border-t border-border-crm/30 pt-2.5">
                        {DEAL_LABELS.map((d, i) => {
                          const pct = Math.round((d.count / totalN) * 100);
                          return (
                            <div key={i} className="flex flex-col items-center text-[10px] font-semibold">
                              <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                                <span className="text-txt-secondary text-[9px]">{d.label}</span>
                              </div>
                              <span className="font-extrabold text-[10px] mt-0.5" style={{ color: d.color }}>
                                {d.count} <span className="text-[8px] opacity-75 font-normal">({pct}%)</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

              </div>
            </div>
          );
        })()}

        {/* 4. Enterprise Performance Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Grouped Bar Chart: Team Performance Comparison */}
          <div className="bg-card border border-border-crm rounded-2xl p-5 space-y-4">
            <h3 className="font-extrabold text-sm tracking-tight text-txt-primary">Team Performance</h3>
            <p className="text-[10px] text-txt-secondary">Visual comparison of Leads Assigned vs Deals Won per team.</p>
            
            <div className="relative w-full h-48 bg-bg-main border border-border-crm/40 rounded-xl p-4 flex items-end justify-around">
              {teamPerformanceData.map((row, idx) => {
                const maxLeads = Math.max(...teamPerformanceData.map(t => Math.max(t.leads, t.won))) || 1;
                const leadHeight = (row.leads / maxLeads) * 100;
                const wonHeight = (row.won / maxLeads) * 100;
                
                return (
                  <div key={idx} className="flex flex-col items-center w-1/4 space-y-2">
                    <div className="flex items-end justify-center space-x-1.5 h-28 w-full animate-fade-in">
                      {/* Leads bar */}
                      <div 
                        style={{ height: `${leadHeight}%` }} 
                        className="w-4.5 bg-blue-500 hover:bg-blue-600 rounded-t-sm transition-all duration-300 relative group cursor-pointer"
                        title={`Leads: ${row.leads}`}
                      >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-30">
                          L: {row.leads}
                        </div>
                      </div>
                      {/* Won bar */}
                      <div 
                        style={{ height: `${wonHeight}%` }} 
                        className="w-4.5 bg-emerald-500 hover:bg-emerald-600 rounded-t-sm transition-all duration-300 relative group cursor-pointer"
                        title={`Won: ${row.won}`}
                      >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-30">
                          W: {row.won}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-txt-primary">{row.team}</span>
                    <span className="text-[9px] text-txt-secondary font-bold">{row.rev}</span>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-center gap-4 text-[9px] font-bold text-txt-secondary">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-500"></span> Assigned Leads</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Won Opportunities</span>
            </div>
          </div>

          {/* Horizontal Bar Chart & Donut: Top Salespersons */}
          <div className="bg-card border border-border-crm rounded-2xl p-5 flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <h3 className="font-extrabold text-sm tracking-tight text-txt-primary">Top Sales Executives</h3>
              <p className="text-[10px] text-txt-secondary">Revenue generated by leading sales reps.</p>
              
              <div className="space-y-4">
                {topSalespersonsChart.map((row) => (
                  <div key={row.rank} className="space-y-1 text-xs">
                    <div className="flex justify-between items-center font-bold">
                      <div className="flex items-center space-x-2">
                        <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[9px] text-white font-extrabold ${
                          row.rank === 1 ? 'bg-yellow-500' : row.rank === 2 ? 'bg-slate-400' : 'bg-amber-600'
                        }`}>
                          {row.rank}
                        </span>
                        <span className="text-txt-primary">{row.name}</span>
                      </div>
                      <span className="text-primary">{row.revStr}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${row.pct}%` }} 
                        className="bg-primary h-full rounded-full transition-all duration-500"
                      ></div>
                    </div>
                  </div>
                ))}
                {topSalespersonsChart.length === 0 && (
                  <div className="text-center py-10 text-txt-secondary text-xs italic">
                    No salesperson performance data registered.
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic Sales by Team Donut Chart */}
            <div className="w-full md:w-44 shrink-0 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-border-crm pt-4 md:pt-0 md:pl-6">
              <span className="text-[10px] font-bold text-txt-secondary uppercase tracking-wider mb-3">Sales Share by Team</span>
              <div className="relative w-28 h-28 animate-pulse-subtle">
                <svg viewBox="-2 -2 40 40" className="w-full h-full transform -rotate-90">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F1F5F9" strokeWidth="4" />
                  {donutSegments.map((seg, idx) => (
                    <circle 
                      key={idx}
                      cx="18" 
                      cy="18" 
                      r="15.915" 
                      fill="none" 
                      stroke={seg.color} 
                      strokeWidth="4.2" 
                      strokeDasharray={seg.dashArray} 
                      strokeDashoffset={seg.dashOffset} 
                      className="transition-all duration-550"
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-extrabold text-txt-primary">
                    {formatCRMRevenue(totalTeamClosedRevenue)}
                  </span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase">Total Won</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 text-[9px] font-bold mt-4 justify-center">
                {donutSegments.map((seg, idx) => (
                  <span key={idx} className="flex items-center gap-1 select-none">
                    <span style={{ backgroundColor: seg.color }} className="w-2.5 h-2.5 rounded-full shrink-0"></span>
                    <span>{seg.name} ({seg.pct}%)</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    );
  }

  // --- DASHBOARD 2: ADMIN DASHBOARD (DEPARTMENT/TEAM VIEW) ---
  if (userRole === 'ADMIN') {
    return (
      <div className="space-y-6 text-txt-primary animate-fade-in">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-txt-primary">Overview</h2>
            {/* <p className="text-xs text-txt-secondary">Workload balancing, deal distributions, and executive schedules.</p> */}
          </div>
          
        </div>

        {/* 1. Team KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {[
            { label: "Members", val: teamKPIs.members.toString(), sub: "Active Reps" },
            { label: "Leads", val: teamKPIs.leads.toString(), sub: "Unconverted entries" },
            { label: "Opportunities", val: teamKPIs.opps.toString(), sub: "Active Pipeline" },
            { label: "Quotations", val: teamKPIs.quotes.toString(), sub: "Sent to clients" },
            { label: "Clients", val: teamKPIs.cust.toString(), sub: "Converted accounts" },
            { label: "Retentions", val: referrals.length.toLocaleString(), sub: "Total submissions" },
            { label: "Revenue", val: teamKPIs.rev, sub: "Total closed" }
          ].map((card, idx) => (
            <div key={idx} className="bg-card border border-border-crm rounded-2xl p-4.5 shadow-xs text-left">
              <p className="text-[9px] font-bold text-txt-secondary uppercase tracking-wider mb-1">{card.label}</p>
              <h3 className="text-xl font-extrabold text-primary">{card.val}</h3>
              <p className="text-[9px] text-slate-400 mt-1 font-semibold">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* 3. Workload & Breakdown Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left: Lead Breakdown Segmented Stacked Bar Chart */}
          <div className="bg-card border border-border-crm rounded-2xl p-5 space-y-4">
            <h3 className="font-extrabold text-sm tracking-tight text-txt-primary">Lead Breakdown States</h3>
            <p className="text-[10px] text-txt-secondary">Segmented lifecycle distribution of opportunities.</p>
            
            {(() => {
              const newLeads = opportunities.filter(o => o.stageId === 'p_1' || (o.stage || '').toLowerCase() === 'new').length;
              const qualified = opportunities.filter(o => 
                (o.stageId === 'p_2' || o.stageId === 'p_3' || o.stageId === 'p_5' || 
                 ['qualified', 'discussion', 'negotiation'].includes((o.stage || '').toLowerCase())) ||
                (!['p_1', 'p_4', 'p_6', 'p_7'].includes(o.stageId) && !['new', 'proposal', 'won', 'lost'].includes((o.stage || '').toLowerCase()))
              ).length;
              const proposals = opportunities.filter(o => o.stageId === 'p_4' || (o.stage || '').toLowerCase() === 'proposal').length;
              const won = opportunities.filter(o => o.stageId === 'p_6' || (o.stage || '').toLowerCase() === 'won').length;
              const lost = opportunities.filter(o => o.stageId === 'p_7' || (o.stage || '').toLowerCase() === 'lost').length;
              
              const total = newLeads + qualified + proposals + won + lost || 1;
              
              const newPct = (newLeads / total) * 100;
              const qualPct = (qualified / total) * 100;
              const propPct = (proposals / total) * 100;
              const wonPct = (won / total) * 100;
              const lostPct = (lost / total) * 100;
              
              return (
                <div className="space-y-6 pt-2">
                  <div className="w-full h-4.5 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 border border-border-crm/40">
                    {newLeads > 0 && <div style={{ width: `${newPct}%` }} className="bg-blue-600 h-full hover:opacity-90 transition-all" title={`New: ${newLeads}`}></div>}
                    {qualified > 0 && <div style={{ width: `${qualPct}%` }} className="bg-primary h-full hover:opacity-90 transition-all" title={`Qualified: ${qualified}`}></div>}
                    {proposals > 0 && <div style={{ width: `${propPct}%` }} className="bg-blue-400 h-full hover:opacity-90 transition-all" title={`Proposals: ${proposals}`}></div>}
                    {won > 0 && <div style={{ width: `${wonPct}%` }} className="bg-emerald-500 h-full hover:opacity-90 transition-all" title={`Won: ${won}`}></div>}
                    {lost > 0 && <div style={{ width: `${lostPct}%` }} className="bg-rose-500 h-full hover:opacity-90 transition-all" title={`Lost: ${lost}`}></div>}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-txt-secondary pt-3">
                    {[
                      { label: "New Leads", count: newLeads, color: "bg-blue-600" },
                      { label: "Qualified", count: qualified, color: "bg-primary" },
                      { label: "Proposals", count: proposals, color: "bg-blue-400" },
                      { label: "Won Deals", count: won, color: "bg-emerald-500" },
                      { label: "Lost Deals", count: lost, color: "bg-rose-500" }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center space-x-2.5">
                        <span className={`w-3.5 h-3.5 rounded-full ${item.color} shrink-0`}></span>
                        <span className="truncate text-txt-secondary">{item.label}:</span>
                        <span className="text-txt-primary font-bold text-sm ml-1">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Right: Workload Distribution Gauges */}
          <div className="bg-card border border-border-crm rounded-2xl p-5 space-y-4">
            <h3 className="font-extrabold text-sm tracking-tight text-txt-primary">Workload Distribution</h3>
            <p className="text-[10px] text-txt-secondary">Percentage share of active leads assigned to team members.</p>
            
            <div className="space-y-4 mt-2">
              {workloadData.map((row, idx) => (
                <div key={idx} className="space-y-1.5 text-xs font-semibold">
                  <div className="flex justify-between">
                    <span className="text-txt-primary font-bold">{row.name}</span>
                    <span className="text-txt-secondary">{row.count} Leads ({row.pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${row.pct}%` }} 
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 0 ? 'bg-blue-600' : idx === 1 ? 'bg-primary' : 'bg-blue-400'
                      }`}
                    ></div>
                  </div>
                </div>
              ))}
              {workloadData.length === 0 && (
                <div className="text-center py-6 text-txt-secondary text-xs">No active workload registered.</div>
              )}
            </div>
          </div>

        </div>

        {/* 4. Leaderboard & Bar Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Scorecards: Salesperson Performance Leaderboard */}
          <div className="bg-card border border-border-crm rounded-2xl p-5 space-y-4 lg:col-span-2">
            <h3 className="font-extrabold text-sm tracking-tight text-txt-primary">Salesperson Leaderboard</h3>
            <p className="text-[10px] text-txt-secondary">Comparative representation of deals won vs leads assigned.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
              {dynamicLeaderboard.map((row, idx) => (
                <div key={idx} className="bg-bg-main border border-border-crm/40 rounded-xl p-4.5 space-y-3 shadow-xs transition hover:border-primary/30">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-txt-primary">{row.name}</span>
                    <Award className={`w-5 h-5 ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-slate-400' : 'text-amber-600'}`} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Revenue Closed</p>
                    <h4 className="text-base font-extrabold text-primary">{row.rev}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-txt-secondary border-t border-border-crm/40 pt-2.5">
                    <div>
                      <span className="block text-[8px] text-slate-400 uppercase">Leads</span>
                      <span className="text-txt-primary">{row.leads}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] text-slate-400 uppercase">Won</span>
                      <span className="text-txt-primary">{row.won}</span>
                    </div>
                  </div>
                </div>
              ))}
              {dynamicLeaderboard.length === 0 && (
                <div className="col-span-3 text-center py-6 text-txt-secondary text-xs italic">No salesperson performance data registered.</div>
              )}
            </div>
            
            {/* Entire Revenue Chart with Filters (Weekly, Monthly, Yearly) */}
            <div className="pt-4 border-t border-border-crm/50 space-y-3">
              {(() => {
                const now = new Date();
                let chartBars: { name: string; val: number }[] = [];

                if (adminFinFilter === 'year') {
                  for (let i = 5; i >= 0; i--) {
                    const yr = now.getFullYear() - i;
                    const val = opportunities
                      .filter(o => o.stageId === 'p_6')
                      .filter(o => {
                        const d = new Date(o.closedDate || o.createdDate || o.createdAt || now);
                        return d.getFullYear() === yr;
                      })
                      .reduce((s, o) => s + (o.dealValue || 0), 0);
                    chartBars.push({ name: String(yr), val });
                  }
                } else if (adminFinFilter === 'month') {
                  for (let i = 5; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const yr = d.getFullYear(); const mo = d.getMonth();
                    const val = opportunities
                      .filter(o => o.stageId === 'p_6')
                      .filter(o => {
                        const cd = new Date(o.closedDate || o.createdDate || o.createdAt || now);
                        return cd.getFullYear() === yr && cd.getMonth() === mo;
                      })
                      .reduce((s, o) => s + (o.dealValue || 0), 0);
                    chartBars.push({ name: d.toLocaleString('default', { month: 'short' }), val });
                  }
                } else {
                  for (let i = 6; i >= 0; i--) {
                    const day = new Date(now); day.setDate(now.getDate() - i); day.setHours(0,0,0,0);
                    const dayEnd = new Date(day); dayEnd.setHours(23,59,59,999);
                    const val = opportunities
                      .filter(o => o.stageId === 'p_6')
                      .filter(o => {
                        const cd = new Date(o.closedDate || o.createdDate || o.createdAt || now);
                        return cd >= day && cd <= dayEnd;
                      })
                      .reduce((s, o) => s + (o.dealValue || 0), 0);
                    chartBars.push({ name: day.toLocaleString('default', { weekday: 'short' }), val });
                  }
                }

                const maxBarVal = Math.max(...chartBars.map(b => b.val)) || 1;

                return (
                  <>
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[10px] font-bold text-txt-secondary uppercase tracking-wider block">Closed Won Revenue Chart</span>
                      
                      {/* Filter tabs */}
                      <div className="flex items-center bg-bg-main border border-border-crm rounded-lg p-0.5 gap-0.5 shrink-0">
                        {(['year', 'month', 'week'] as const).map(f => (
                          <button
                            key={f}
                            onClick={() => setAdminFinFilter(f)}
                            className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide transition-all duration-200 cursor-pointer ${
                              adminFinFilter === f
                                ? 'bg-primary text-white shadow-xs'
                                : 'text-txt-secondary hover:text-txt-primary hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {f === 'year' ? 'Year' : f === 'month' ? 'Month' : 'Week'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative w-full h-48 bg-bg-main border border-border-crm/40 rounded-xl overflow-hidden p-4 flex items-end justify-around">
                      {chartBars.map((bar, idx) => {
                        const heightPercent = maxBarVal > 0 ? (bar.val / maxBarVal) * 80 : 20;
                        const isLatest = idx === chartBars.length - 1;
                        
                        return (
                          <div key={idx} className="flex flex-col items-center group relative h-full justify-end" style={{ width: `${100 / chartBars.length}%` }}>
                            {/* Label of value */}
                            <span className="text-[8px] font-bold text-primary mb-1">{formatCRMRevenue(bar.val)}</span>
                            
                            {/* Bar Graphic */}
                            <div className={`w-5 border rounded-t-sm transition-all duration-300 relative group cursor-pointer ${
                              isLatest
                                ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300/50'
                                : 'bg-slate-100 dark:bg-slate-800/40 border-border-crm/30'
                            }`} style={{ height: `${Math.max(heightPercent, bar.val > 0 ? 4 : 0)}%` }}>
                              <div className="w-full h-full bg-primary hover:bg-primary/95 rounded-t-sm" />
                            </div>

                            {/* Period label */}
                            <span className={`text-[8px] font-bold uppercase mt-1.5 ${
                              isLatest ? 'text-primary' : 'text-slate-400'
                            }`}>{bar.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* List: Upcoming Activities */}
          <div className="bg-card border border-border-crm rounded-2xl p-5 space-y-4">
            <h3 className="font-extrabold text-sm tracking-tight text-txt-primary">Upcoming Activities</h3>
            <div className="space-y-3">
              {filteredActivities.length > 0 ? (
                filteredActivities.slice(0, 5).map((act, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-150 dark:border-border-crm p-3.5 rounded-xl space-y-1 text-txt-primary text-xs">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-primary">{act.salesperson || "Unassigned"}</span>
                      <span className="text-[9px] font-bold bg-blue-100 text-primary px-1.5 py-0.5 rounded">
                        {act.date || "Scheduled"}
                      </span>
                    </div>
                    <p className="font-bold text-txt-primary">{act.title}</p>
                    <p className="text-[10px] text-txt-secondary leading-normal">{act.description}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-txt-secondary text-xs italic">
                  No upcoming activities scheduled.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    );
  }

  // --- DASHBOARD 3: SALES EXECUTIVE DASHBOARD (PERSONAL VIEW) ---
  return (
    <div className="space-y-6 text-txt-primary">
      
      {/* Header Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-txt-primary">Personal Workspace</h2>
          {/* <p className="text-xs text-txt-secondary">My pipelines, day-to-day checklist schedule.</p> */}
        </div>
       
      </div>

      {/* 1. Personal KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "My Leads", val: myKPIs.leads.toString(), sub: "Total leads" },
          { label: "Opportunities", val: myKPIs.opps.toString(), sub: "Active deals" },
          { label: "My Quotations", val: myKPIs.quotes.toString(), sub: "Draft / Sent" },
          { label: "My Customers", val: myKPIs.cust.toString(), sub: "Won accounts" },
          { label: "My Revenue", val: myKPIs.rev, sub: "Closed sales", isPrimary: true }
        ].map((card, idx) => (
          <div 
            key={idx} 
            className={`rounded-2xl p-4 shadow-xs text-left border ${
              card.isPrimary 
                ? 'bg-primary text-white border-primary/50 col-span-2 md:col-span-1' 
                : 'bg-card border-border-crm text-txt-primary'
            }`}
          >
            <p className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${card.isPrimary ? 'text-blue-100' : 'text-txt-secondary'}`}>
              {card.label}
            </p>
            <h3 className="text-xl font-extrabold">{card.val}</h3>
            <p className={`text-[9px] mt-1 font-semibold ${card.isPrimary ? 'text-blue-200' : 'text-slate-400'}`}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* 2. Pipeline Stages & Daily Schedule (Row 1 - 2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* My Pipeline Stages Progress */}
        <div className="bg-card border border-border-crm rounded-2xl p-6 space-y-4.5 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm tracking-tight text-txt-primary mb-1">My Pipeline Stages</h3>
            <p className="text-[10px] text-txt-secondary">Personal deal counts in active pipeline categories.</p>
          </div>

          <div className="space-y-3.5 mt-4">
            {myPipelineStages.map((stg, idx) => (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex justify-between font-semibold">
                  <span className="text-txt-primary">{stg.stage}</span>
                  <span className="text-txt-secondary">{stg.count} deals ({stg.pct}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${stg.pct}%` }} 
                    className={`${stg.color} h-full rounded-full transition-all duration-500`}
                  ></div>
                </div>
              </div>
            ))}
            {myPipelineStages.reduce((sum, s) => sum + s.count, 0) === 0 && (
              <div className="text-center py-6 text-txt-secondary text-xs">
                No active deals in your pipeline.
              </div>
            )}
          </div>
        </div>

        {/* Checklist: My Daily Schedule */}
        <div className="bg-card border border-border-crm rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm tracking-tight text-txt-primary flex items-center gap-1.5 mb-1">
              <CheckSquare className="w-4.5 h-4.5 text-primary" /> My Daily Schedule
            </h3>
            <p className="text-[10px] text-txt-secondary">Upcoming uncompleted activities.</p>
          </div>
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 mt-4 flex-1">
            {myUpcomingActivities.map(item => (
              <div 
                key={item.id} 
                onClick={() => onToggleActivityDone(item.id, item.done)}
                className="flex gap-3 items-start p-3 border border-border-crm hover:border-primary/30 rounded-xl transition cursor-pointer select-none bg-card text-txt-primary animate-fade-in"
              >
                <div className="w-4 h-4 rounded-md border mt-0.5 flex items-center justify-center transition shrink-0 border-slate-300 bg-white">
                  {/* Empty checkbox since it is not done */}
                </div>
                <div className="text-xs min-w-0">
                  <p className="font-bold">{item.title}</p>
                  <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                    {item.date} {item.time ? `at ${item.time}` : ''} ({item.type})
                  </p>
                </div>
              </div>
            ))}
            {myUpcomingActivities.length === 0 && (
              <div className="text-center py-12 text-txt-secondary text-xs select-none">
                No upcoming activities. You are all caught up!
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 3. Recent Leads & Recent Quotations (Row 2 - 2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Table: My Recent Leads */}
        <div className="bg-card border border-border-crm rounded-2xl p-5 space-y-4">
          <h3 className="font-extrabold text-sm tracking-tight text-txt-primary">My Recent Leads</h3>
          <div className="overflow-x-auto border border-border-crm/45 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-bg-main border-b border-border-crm text-[10px] font-extrabold uppercase text-txt-secondary tracking-wider">
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3 text-right">Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-crm text-txt-primary font-medium">
                {myRecentLeads.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold truncate max-w-28">{row.name}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.color}`}>
                        {row.stage}
                      </span>
                    </td>
                  </tr>
                ))}
                {myRecentLeads.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-txt-secondary">
                      No leads assigned.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table: My Recent Quotations */}
        <div className="bg-card border border-border-crm rounded-2xl p-5 space-y-4">
          <h3 className="font-extrabold text-sm tracking-tight text-txt-primary">My Recent Quotations</h3>
          <div className="overflow-x-auto border border-border-crm/45 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-bg-main border-b border-border-crm text-[10px] font-extrabold uppercase text-txt-secondary tracking-wider">
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3 text-center">Amount</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-crm text-txt-primary font-medium">
                {myRecentQuotations.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold truncate max-w-20">{row.name}</td>
                    <td className="px-4 py-3 text-center text-txt-secondary font-bold">{row.amt}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.color}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {myRecentQuotations.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-txt-secondary">
                      No recent quotations.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
