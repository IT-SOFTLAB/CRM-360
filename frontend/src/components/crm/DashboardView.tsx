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
  UserCheck
} from 'lucide-react';
import { useCRM } from "../../context/CRMContext";
import api from "../../services/api";

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
  const { user, customers = [], quotations = [] } = useCRM();

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

  useEffect(() => {
    if (isManager) {
      api.get('/users')
        .then(res => setUsersList(res.data || []))
        .catch(err => console.warn('Failed loading users for dashboard', err));
        
      api.get('/salesteam')
        .then(res => setTeamsList(res.data || []))
        .catch(err => console.warn('Failed loading sales teams for dashboard', err));
    }
  }, [isManager]);



  // Total Revenue calculation
  const totalRevenueVal = useMemo(() => {
    const oppWonSum = opportunities
      .filter(o => o.stageId === 'p_6')
      .reduce((sum, o) => sum + (o.dealValue || 0), 0);
    const quoteWonSum = quotations
      .filter(q => q.status === 'Confirmed')
      .reduce((sum, q) => sum + (q.total || q.grandTotal || 0), 0);
    return Math.max(oppWonSum, quoteWonSum);
  }, [opportunities, quotations]);

  const displayRevenueStr = useMemo(() => {
    const value = totalRevenueVal > 0 ? totalRevenueVal : 24000000; // Default ₹2.4 Cr fallback
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(1)} Cr`;
    }
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(0)} Lakh`;
    }
    return `₹${value.toLocaleString()}`;
  }, [totalRevenueVal]);

  // Conversion rate calculation
  const conversionRate = useMemo(() => {
    if (!opportunities.length) return 28; // Default fallback
    const wonCount = opportunities.filter(o => o.stageId === 'p_6').length;
    return Math.round((wonCount / opportunities.length) * 100);
  }, [opportunities]);

  // Lead Funnel Progression calculation
  const funnelData = useMemo(() => {
    const newCount = activeLeads.length;
    const qualifiedCount = opportunities.filter(o => o.stageId !== 'p_6' && o.stageId !== 'p_7').length;
    const convertedCount = opportunities.filter(o => o.stageId === 'p_6').length;
    const lostCount = opportunities.filter(o => o.stageId === 'p_7').length;
    
    // Fallback if empty
    if (newCount === 0 && qualifiedCount === 0 && convertedCount === 0 && lostCount === 0) {
      return { new: 300, qualified: 420, converted: 350, lost: 180 };
    }
    return { new: newCount, qualified: qualifiedCount, converted: convertedCount, lost: lostCount };
  }, [activeLeads, opportunities]);

  // Opportunity Pipeline count
  const pipelineChartData = useMemo(() => {
    const openCount = opportunities.filter(o => o.stageId !== 'p_6' && o.stageId !== 'p_7').length;
    const wonCount = opportunities.filter(o => o.stageId === 'p_6').length;
    const lostCount = opportunities.filter(o => o.stageId === 'p_7').length;

    if (openCount === 0 && wonCount === 0 && lostCount === 0) {
      return { open: 210, won: 95, lost: 35 };
    }
    return { open: openCount, won: wonCount, lost: lostCount };
  }, [opportunities]);

  // Table A: Team Performance Metrics
  const teamPerformanceData = useMemo(() => {
    if (teamsList.length === 0) {
      return [
        { team: "Gamma", leads: 150, won: 60, rev: "₹36 Lakh" },
        { team: "Alpha", leads: 120, won: 45, rev: "₹28 Lakh" },
        { team: "Beta", leads: 98, won: 38, rev: "₹21 Lakh" }
      ];
    }
    return teamsList.map(team => {
      const memberNames = (team.members || []).map((m: any) => m.name);
      const teamOpps = opportunities.filter(o => memberNames.includes(o.assignedSalesperson));
      const wonOpps = teamOpps.filter(o => o.stageId === 'p_6');
      const revSum = wonOpps.reduce((sum, o) => sum + (o.dealValue || 0), 0);
      return {
        team: team.name,
        leads: teamOpps.length,
        won: wonOpps.length,
        rev: revSum > 0 ? `₹${(revSum / 100000).toFixed(0)} Lakh` : "₹0"
      };
    });
  }, [teamsList, opportunities]);

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
    if (opportunities.length > 0) {
      const mapped = opportunities.map(o => {
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
  }, [opportunities]);

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
    activeLeads.forEach(ld => {
      const rep = ld.assignedUser || "Unassigned";
      counts[rep] = (counts[rep] || 0) + 1;
    });
    const totalLeads = activeLeads.length || 1;
    const list = Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / totalLeads) * 100)
    })).sort((a, b) => b.count - a.count);
    
    if (!list.length) {
      return [
        { name: "Rahul", count: 45, pct: 45 },
        { name: "Priya", count: 30, pct: 30 },
        { name: "Aman", count: 25, pct: 25 }
      ];
    }
    return list;
  }, [activeLeads]);

  // Admin view team-wide KPI totals
  const teamKPIs = useMemo(() => {
    if (opportunities.length === 0) {
      return { members: 12, leads: 45, opps: 84, quotes: 156, cust: 92, rev: "₹84 Lakh" };
    }
    // Calculate team total values based on available dataset
    const teamOpps = opportunities.length;
    const teamQuotes = quotations.length;
    const teamCusts = customers.length;
    const revSum = opportunities
      .filter(o => o.stageId === 'p_6')
      .reduce((sum, o) => sum + (o.dealValue || 0), 0);
    return {
      members: usersList.length || 12,
      leads: activeLeads.length || 45,
      opps: teamOpps,
      quotes: teamQuotes,
      cust: teamCusts,
      rev: revSum > 0 ? `₹${(revSum / 100000).toFixed(0)} Lakh` : "₹84 Lakh"
    };
  }, [opportunities, quotations, customers, usersList, leads]);

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



  // --- DASHBOARD 1: SUPER ADMIN DASHBOARD ---
  if (userRole === 'SUPER_ADMIN') {
    return (
      <div className="space-y-6 text-txt-primary">
        
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-txt-primary">Company Overview</h2>
            <p className="text-xs text-txt-secondary">High-level enterprise visualization, pipeline analytics and global KPIs.</p>
          </div>
         
        </div>

      
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Users", val: usersList.length > 0 ? usersList.length : "145", change: "Active across platform", icon: Users, isPrimary: false },
            { label: "Total Sales Teams", val: teamsList.length > 0 ? teamsList.length : "8", change: "Active divisions", icon: Briefcase, isPrimary: false },
            { label: "Total Customers", val: customers.length > 0 ? customers.length.toLocaleString() : "1,120", change: "Accounts registered", icon: UserCheck, isPrimary: false },
            { label: "Total Leads", val: activeLeads.length > 0 ? activeLeads.length.toLocaleString() : "1,250", change: "Unconverted entries", icon: Layers, isPrimary: false },
            { label: "Total Opportunities", val: opportunities.length > 0 ? opportunities.length.toLocaleString() : "340", change: "Active deals", icon: ClipboardList, isPrimary: false },
            { label: "Total Quotations", val: quotations.length > 0 ? quotations.length.toLocaleString() : "850", change: "Sent to clients", icon: FileText, isPrimary: false },
            { label: "Total Revenue", val: displayRevenueStr, change: "Closed won statistics", icon: IndianRupee, isPrimary: true },
            { label: "Conversion Rate", val: `${conversionRate}%`, change: "Lead conversion ratio", icon: TrendingUp, isPrimary: false }
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

        {/* 2. Funnel and Pipeline Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column - Lead Conversion Funnel */}
          <div className="bg-card border border-border-crm rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-sm tracking-tight text-txt-primary mb-1">Lead Conversion Funnel</h3>
              <p className="text-[10px] text-txt-secondary mb-6">Visual progression from lead registration to final conversion.</p>
            </div>

            {/* Funnel SVG Render */}
            <div className="flex flex-col items-center justify-center space-y-3.5 py-2">
              {[
                { stage: "New Leads", count: funnelData.new, color: "fill-primary", width: 340, height: 35 },
                { stage: "Qualified", count: funnelData.qualified, color: "fill-blue-600", width: 280, height: 35 },
                { stage: "Converted", count: funnelData.converted, color: "fill-blue-500", width: 220, height: 35 },
                { stage: "Lost Leads", count: funnelData.lost, color: "fill-blue-400/80", width: 160, height: 35 }
              ].map((lvl, index) => (
                <div key={index} className="w-full flex items-center justify-between max-w-md gap-4">
                  <span className="text-xs font-semibold text-txt-secondary w-20 shrink-0 text-left">{lvl.stage}</span>
                  <div className="flex-1 flex justify-center">
                    <svg width="100%" height={lvl.height} viewBox={`0 0 340 ${lvl.height}`} preserveAspectRatio="none">
                      <polygon 
                        points={`
                          ${(340 - lvl.width) / 2},0 
                          ${340 - (340 - lvl.width) / 2},0 
                          ${340 - (340 - (lvl.width - 25)) / 2},${lvl.height} 
                          ${(340 - (lvl.width - 25)) / 2},${lvl.height}
                        `}
                        className={`${lvl.color} transition-all hover:opacity-90`}
                      />
                      <text x="170" y="22" textAnchor="middle" className="fill-white font-extrabold text-xs">
                        {lvl.count}
                      </text>
                    </svg>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border-crm pt-4 mt-6 text-center">
              <span className="text-[10px] text-txt-secondary font-medium">Progressive conversion pipeline visualization</span>
            </div>
          </div>

          {/* Right Column - Opportunity Pipeline */}
          <div className="bg-card border border-border-crm rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight text-txt-primary mb-1">Opportunity Pipeline Chart</h3>
                  <p className="text-[10px] text-txt-secondary">Pipeline state count for active opportunities.</p>
                </div>
                <span className="bg-emerald-50 border border-emerald-200 text-success text-[10px] px-2.5 py-1 rounded-md font-bold shrink-0">
                  Active
                </span>
              </div>
            </div>

            {/* Custom SVG Pipeline Chart */}
            <div className="py-6 flex flex-col items-center">
              <div className="w-full max-w-sm space-y-4">
                {[
                  { name: "Open Deals", count: pipelineChartData.open, color: "bg-primary", pct: Math.round((pipelineChartData.open / (pipelineChartData.open + pipelineChartData.won + pipelineChartData.lost || 1)) * 100) },
                  { name: "Won Deals", count: pipelineChartData.won, color: "bg-emerald-500", pct: Math.round((pipelineChartData.won / (pipelineChartData.open + pipelineChartData.won + pipelineChartData.lost || 1)) * 100) },
                  { name: "Lost Deals", count: pipelineChartData.lost, color: "bg-rose-500", pct: Math.round((pipelineChartData.lost / (pipelineChartData.open + pipelineChartData.won + pipelineChartData.lost || 1)) * 100) }
                ].map((deal, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-txt-primary">{deal.name}</span>
                      <span className="text-txt-secondary">{deal.count} ({deal.pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${deal.pct}%` }} 
                        className={`${deal.color} h-full rounded-full transition-all duration-700`}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Pipeline Callout */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex justify-between items-center mt-4">
              <div className="flex items-center space-x-2">
                <div className="bg-primary text-white p-2 rounded-lg">
                  <IndianRupee className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs font-bold text-txt-primary">Total Pipeline Value</span>
              </div>
              <span className="text-lg font-extrabold text-primary">{displayRevenueStr}</span>
            </div>
          </div>

        </div>

        {/* 3. Financial Performance Section */}
        <div className="bg-card border border-border-crm rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-extrabold text-sm tracking-tight text-txt-primary mb-1">Financial Performance</h3>
              <p className="text-[10px] text-txt-secondary">Monthly sales revenue growth statistics and trends.</p>
            </div>
            
            <div className="flex items-center gap-6 text-xs font-semibold">
              <div className="text-left">
                <p className="text-slate-400 text-[10px] uppercase">This Month</p>
                <p className="text-txt-primary font-bold">{totalRevenueVal > 0 ? `₹${(totalRevenueVal / 100000).toFixed(0)} L` : "₹45 Lakh"}</p>
              </div>
              <div className="text-left border-l border-border-crm pl-6">
                <p className="text-slate-400 text-[10px] uppercase">Last Month</p>
                <p className="text-txt-primary font-bold">{totalRevenueVal > 0 ? `₹${((totalRevenueVal * 0.85) / 100000).toFixed(0)} L` : "₹38 Lakh"}</p>
              </div>
              <span className="bg-emerald-50 border border-emerald-200 text-success text-[10px] px-2.5 py-1 rounded-md font-bold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> +18% Growth
              </span>
            </div>
          </div>

          {/* Revenue Trend Line Chart */}
          <div className="relative w-full h-44 bg-bg-main border border-border-crm/40 rounded-xl overflow-hidden p-2 flex items-end">
            <svg className="absolute inset-0 w-full h-full p-6" preserveAspectRatio="none" viewBox="0 0 100 100">
              <line x1="0" y1="20" x2="100" y2="20" stroke="#F1F5F9" strokeWidth="0.5" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="#F1F5F9" strokeWidth="0.5" />
              <line x1="0" y1="80" x2="100" y2="80" stroke="#F1F5F9" strokeWidth="0.5" />
              
              <path 
                d="M0,80 Q20,68 40,75 T80,40 T100,25 L100,100 L0,100 Z" 
                fill="url(#grad)" 
                opacity="0.15"
              />
              <path 
                d="M0,80 Q20,68 40,75 T80,40 T100,25" 
                fill="none" 
                stroke="#2563EB" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
              />
              
              <circle cx="0" cy="80" r="3" fill="#2563EB" />
              <circle cx="20" cy="68" r="3" fill="#2563EB" />
              <circle cx="40" cy="75" r="3" fill="#2563EB" />
              <circle cx="60" cy="57" r="3" fill="#2563EB" />
              <circle cx="80" cy="40" r="3" fill="#2563EB" />
              <circle cx="100" cy="25" r="3" fill="#2563EB" />

              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#FFFFFF" />
                </linearGradient>
              </defs>
            </svg>
            <div className="w-full flex justify-between px-6 text-[9px] font-bold text-slate-400 select-none z-10">
              <span>JAN</span>
              <span>FEB</span>
              <span>MAR</span>
              <span>APR</span>
              <span>MAY</span>
              <span>JUN</span>
            </div>
          </div>
        </div>

        {/* 4. Enterprise Performance Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Table A: Team Performance */}
          <div className="bg-card border border-border-crm rounded-2xl p-5 space-y-4">
            <h3 className="font-extrabold text-sm tracking-tight text-txt-primary">Team Performance Metrics</h3>
            <div className="overflow-x-auto border border-border-crm/45 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-bg-main border-b border-border-crm text-[10px] font-extrabold uppercase text-txt-secondary tracking-wider">
                    <th className="px-4 py-3">Team</th>
                    <th className="px-4 py-3 text-center">Leads</th>
                    <th className="px-4 py-3 text-center">Won</th>
                    <th className="px-4 py-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-crm text-txt-primary font-medium">
                  {teamPerformanceData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-bold">{row.team}</td>
                      <td className="px-4 py-3 text-center text-txt-secondary">{row.leads}</td>
                      <td className="px-4 py-3 text-center text-txt-secondary">{row.won}</td>
                      <td className="px-4 py-3 text-right font-extrabold text-primary">{row.rev}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table B: Top Salespersons */}
          <div className="bg-card border border-border-crm rounded-2xl p-5 flex flex-col md:flex-row gap-6">
            
            {/* Top Salesperson List */}
            <div className="flex-1 space-y-4">
              <h3 className="font-extrabold text-sm tracking-tight text-txt-primary">Top Sales Executives</h3>
              <div className="overflow-x-auto border border-border-crm/45 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-bg-main border-b border-border-crm text-[10px] font-extrabold uppercase text-txt-secondary tracking-wider">
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-crm text-txt-primary font-medium">
                    {topSalespersonsData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 flex items-center space-x-1.5">
                          <Award className={`w-4 h-4 ${row.rank === 1 ? 'text-yellow-500' : row.rank === 2 ? 'text-slate-400' : 'text-amber-600'}`} />
                          <span className="font-bold">{row.name}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-extrabold text-primary">{row.rev}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sales by Team Donut Chart */}
            <div className="w-full md:w-44 shrink-0 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-border-crm pt-4 md:pt-0 md:pl-6">
              <span className="text-[10px] font-bold text-txt-secondary uppercase tracking-wider mb-3">Sales by Team</span>
              <div className="relative w-28 h-28">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F1F5F9" strokeWidth="4.2" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#2563EB" strokeWidth="4.5" strokeDasharray="42 58" strokeDashoffset="0" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#60A5FA" strokeWidth="4.5" strokeDasharray="33 67" strokeDashoffset="-42" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#1E3A8A" strokeWidth="4.5" strokeDasharray="25 75" strokeDashoffset="-75" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-extrabold text-txt-primary">₹85 L</span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase">Closed</span>
                </div>
              </div>
              <div className="flex gap-2 text-[9px] font-bold mt-3 text-txt-secondary">
                <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-blue-600"></span> G</span>
                <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-blue-400"></span> A</span>
                <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-blue-900"></span> B</span>
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
      <div className="space-y-6 text-txt-primary">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-txt-primary">Team Overview</h2>
            <p className="text-xs text-txt-secondary">Workload balancing, deal distributions, and executive schedules.</p>
          </div>
          <span className="bg-primary text-white text-[10px] uppercase px-3 py-1.5 rounded-full font-bold tracking-widest self-start md:self-center shadow-xs">
            CRM Manager View
          </span>
        </div>

        {/* 1. Team KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Team Members", val: teamKPIs.members.toString(), sub: "Active Reps" },
            { label: "Team Leads", val: "2", sub: "Managers" },
            { label: "Opportunities", val: teamKPIs.opps.toString(), sub: "Active Pipeline" },
            { label: "Team Quotations", val: teamKPIs.quotes.toString(), sub: "Sent to clients" },
            { label: "Team Customers", val: teamKPIs.cust.toString(), sub: "Converted accounts" },
            { label: "Team Revenue", val: teamKPIs.rev, sub: "Total closed" }
          ].map((card, idx) => (
            <div key={idx} className="bg-card border border-border-crm rounded-2xl p-4.5 shadow-xs text-left">
              <p className="text-[9px] font-bold text-txt-secondary uppercase tracking-wider mb-1">{card.label}</p>
              <h3 className="text-xl font-extrabold text-primary">{card.val}</h3>
              <p className="text-[9px] text-slate-400 mt-1 font-semibold">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* 2. Team Pipeline View (Kanban Board) */}
        <div className="bg-card border border-border-crm rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="font-extrabold text-sm tracking-tight text-txt-primary mb-1">Team Pipeline Stage board</h3>
            <p className="text-[10px] text-txt-secondary">Shift lead pipeline stages interactively across team workflows.</p>
          </div>

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

                  <div className="space-y-2 flex-1 overflow-y-auto max-h-72">
                    {dealsInCol.map(deal => (
                      <div key={deal.id} className="bg-card border border-border-crm rounded-lg p-3 shadow-xs space-y-2 text-txt-primary text-xs hover:border-primary/40 transition">
                        <div className="font-bold text-txt-primary truncate">{deal.name}</div>
                        <div className="flex justify-between text-[10px] text-txt-secondary font-medium">
                          <span>Rep: {deal.rep}</span>
                          <span className="font-bold text-primary">{deal.value}</span>
                        </div>
                        <div className="flex justify-end gap-1.5 pt-1 border-t border-border-crm/40">
                          {col !== 'New' && (
                            <button 
                              onClick={() => moveKanban(deal.id, 'left')}
                              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                              title="Move Left"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                          )}
                          {col !== 'Won' && (
                            <button 
                              onClick={() => moveKanban(deal.id, 'right')}
                              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                              title="Move Right"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {dealsInCol.length === 0 && (
                      <div className="text-center py-10 text-[10px] text-slate-400 select-none">Empty stage</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Workload & Breakdown Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left: Lead Breakdown List */}
          <div className="bg-card border border-border-crm rounded-2xl p-5 space-y-4">
            <h3 className="font-extrabold text-sm tracking-tight text-txt-primary">Lead Breakdown States</h3>
            <div className="space-y-3.5">
              {[
                { stage: "New Leads", count: activeLeads.length || 18, color: "bg-blue-600" },
                { stage: "Qualified Opportunities", count: opportunities.filter(o => o.stageId !== 'p_6' && o.stageId !== 'p_7').length || 24, color: "bg-primary" },
                { stage: "Proposal Submitted", count: opportunities.filter(o => o.stageId === 'p_4').length || 15, color: "bg-blue-400" },
                { stage: "Won Deals", count: opportunities.filter(o => o.stageId === 'p_6').length || 32, color: "bg-emerald-500" },
                { stage: "Lost Leads", count: opportunities.filter(o => o.stageId === 'p_7').length || 8, color: "bg-rose-500" }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center space-x-2">
                    <span className={`w-3 h-3 rounded-full ${item.color}`}></span>
                    <span className="text-txt-primary">{item.stage}</span>
                  </div>
                  <span className="bg-slate-50 border border-slate-200/60 text-txt-secondary text-[10px] px-2.5 py-1 rounded-md font-bold">
                    {item.count} leads
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Workload Distribution Table */}
          <div className="bg-card border border-border-crm rounded-2xl p-5 space-y-4">
            <h3 className="font-extrabold text-sm tracking-tight text-txt-primary">Workload Distribution</h3>
            <div className="overflow-x-auto border border-border-crm/45 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-bg-main border-b border-border-crm text-[10px] font-extrabold uppercase text-txt-secondary tracking-wider">
                    <th className="px-4 py-3">Salesperson</th>
                    <th className="px-4 py-3 text-right">Assigned Leads</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-crm text-txt-primary font-medium">
                  {workloadData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-bold">{row.name}</td>
                      <td className="px-4 py-3 text-right font-extrabold text-primary flex items-center justify-end space-x-2">
                        <span>{row.count}</span>
                        <span className="text-[10px] text-slate-400">({row.pct}%)</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* 4. Execution, Activities & Bar Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Table: Salesperson Performance */}
          <div className="bg-card border border-border-crm rounded-2xl p-5 space-y-4 lg:col-span-2">
            <h3 className="font-extrabold text-sm tracking-tight text-txt-primary">Salesperson Performance Table</h3>
            <div className="overflow-x-auto border border-border-crm/45 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-bg-main border-b border-border-crm text-[10px] font-extrabold uppercase text-txt-secondary tracking-wider">
                    <th className="px-4 py-3">Salesperson</th>
                    <th className="px-4 py-3 text-center">Leads</th>
                    <th className="px-4 py-3 text-center">Won</th>
                    <th className="px-4 py-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-crm text-txt-primary font-medium">
                  {[
                    { name: "Rahul", leads: activeLeads.filter(l => l.assignedUser === 'Rahul').length || 45, won: opportunities.filter(o => o.assignedSalesperson === 'Rahul' && o.stageId === 'p_6').length || 18, rev: "₹18 Lakh" },
                    { name: "Priya", leads: activeLeads.filter(l => l.assignedUser === 'Priya').length || 30, won: opportunities.filter(o => o.assignedSalesperson === 'Priya' && o.stageId === 'p_6').length || 12, rev: "₹12 Lakh" },
                    { name: "Aman", leads: activeLeads.filter(l => l.assignedUser === 'Aman').length || 25, won: opportunities.filter(o => o.assignedSalesperson === 'Aman' && o.stageId === 'p_6').length || 8, rev: "₹8 Lakh" }
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-bold">{row.name}</td>
                      <td className="px-4 py-3 text-center text-txt-secondary">{row.leads}</td>
                      <td className="px-4 py-3 text-center text-txt-secondary">{row.won}</td>
                      <td className="px-4 py-3 text-right font-extrabold text-primary">{row.rev}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* SVG Comparison Bar Chart */}
            <div className="pt-4 border-t border-border-crm/50">
              <span className="text-[10px] font-bold text-txt-secondary uppercase tracking-wider">Team Monthly Revenue Bar Chart</span>
              <div className="relative w-full h-36 bg-bg-main border border-border-crm/40 rounded-xl overflow-hidden p-4 flex items-end justify-around">
                {[
                  { month: "Jan", val: 12 },
                  { month: "Feb", val: 18 },
                  { month: "Mar", val: 28 },
                  { month: "Apr", val: 32 },
                  { month: "May", val: 40 },
                  { month: "Jun", val: 48 }
                ].map((bar, idx) => (
                  <div key={idx} className="flex flex-col items-center space-y-1.5 w-8">
                    <span className="text-[9px] font-bold text-primary">₹{bar.val}L</span>
                    <div 
                      style={{ height: `${(bar.val / 48) * 80}px` }} 
                      className="w-full bg-primary hover:bg-primary/95 rounded-t-sm transition-all duration-300 shadow-xs"
                    ></div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">{bar.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* List: Upcoming Activities */}
          <div className="bg-card border border-border-crm rounded-2xl p-5 space-y-4">
            <h3 className="font-extrabold text-sm tracking-tight text-txt-primary">Upcoming Activities</h3>
            <div className="space-y-3">
              {activities.length > 0 ? (
                activities.slice(0, 3).map((act, idx) => (
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
                [
                  { rep: "Rahul", action: "Call ABC Ltd", time: "Tomorrow", desc: "Qualify pricing request" },
                  { rep: "Priya", action: "Meeting XYZ", time: "2 PM today", desc: "Contract negotiations" },
                  { rep: "Aman", action: "Follow-up PQR", time: "Friday", desc: "Submit revised quota" }
                ].map((act, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-150 dark:border-border-crm p-3.5 rounded-xl space-y-1 text-txt-primary text-xs">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-primary">{act.rep}</span>
                      <span className="text-[9px] font-bold bg-blue-100 text-primary px-1.5 py-0.5 rounded">
                        {act.time}
                      </span>
                    </div>
                    <p className="font-bold text-txt-primary">{act.action}</p>
                    <p className="text-[10px] text-txt-secondary leading-normal">{act.desc}</p>
                  </div>
                ))
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
          <p className="text-xs text-txt-secondary">My pipelines, day-to-day checklist schedule.</p>
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

      {/* 2. Pipeline Stages & Daily Tasks (Row 1 - 2 Columns) */}
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
            <p className="text-[10px] text-txt-secondary">Upcoming uncompleted activities and tasks.</p>
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
                No upcoming tasks. You are all caught up!
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
                  <th className="px-4 py-3">Customer</th>
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
