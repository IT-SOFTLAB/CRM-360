"use client";

import React, { useState, useRef } from 'react';
import { ChevronRight, Trash2, Plus, X, Briefcase, Calendar, DollarSign, User, Mail, Phone, Tag, Clipboard, Info, CheckCircle2, List, LayoutGrid, Star, Clock, Upload } from 'lucide-react';
import QuotationForm from "./QuotationForm";
import { emailService } from '../../services/email.service';
import { useCRM } from '../../context/CRMContext';

interface OpportunitiesViewProps {
  opportunities: any[];
  pipelines: any[];
  user: any;
  searchQuery: string;
  activeFilters: any;
  onMoveOpportunity: (oppId: string, stageId: string) => void;
  onDeleteOpportunity: (oppId: string) => void;
  onAddStage: (stageName: string) => void;
  onReorderStage: (stageId: string, direction: 'left' | 'right') => void;
  onDeleteStage: (stageId: string) => void;
  applyFilters: (data: any[], type: 'leads' | 'opportunities' | 'emails') => any[];
  showStageModal: boolean;
  setShowStageModal: (show: boolean) => void;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  leads: any[];
  onUpdateOpportunity: (oppId: string, oppData: any) => Promise<void> | void;
}

export default function OpportunitiesView({
  opportunities,
  pipelines,
  user,
  searchQuery,
  activeFilters,
  onMoveOpportunity,
  onDeleteOpportunity,
  onAddStage,
  onReorderStage,
  onDeleteStage,
  applyFilters,
  showStageModal,
  setShowStageModal,
  addToast,
  leads,
  onUpdateOpportunity
}: OpportunitiesViewProps) {
  const crmCtx = useCRM();
  const activities = crmCtx.activities || [];
  const theme = crmCtx.theme || 'light';
  const isDark = theme === 'dark';

  const getPriorityStars = (priority: any): number => {
    if (typeof priority === 'number') return priority;
    if (!priority) return 0;
    const p = String(priority).toLowerCase();
    if (p === 'high' || p === 'very_high') return 3;
    if (p === 'medium') return 2;
    if (p === 'low') return 1;
    return 0;
  };

  const getTagColors = (tag?: string, isDark: boolean = false) => {
    const safeTag = (tag || '').trim().toLowerCase();
    let hash = 0;
    for (let i = 0; i < safeTag.length; i++) {
      hash = safeTag.charCodeAt(i) + ((hash << 5) - hash);
    }
    const odooColors = [
      { bg: '#FFD6D6', text: '#D63030', darkBg: '#5c1919', darkText: '#ff8a8a' }, // Red
      { bg: '#FFEAD2', text: '#C46200', darkBg: '#592e00', darkText: '#ffb973' }, // Orange
      { bg: '#FFF3D6', text: '#B58100', darkBg: '#4f3b00', darkText: '#ffd459' }, // Yellow
      { bg: '#D4F8ED', text: '#0A976E', darkBg: '#004732', darkText: '#7af8cc' }, // Green
      { bg: '#D1FBFB', text: '#008585', darkBg: '#003d3d', darkText: '#7bffff' }, // Teal
      { bg: '#E2EFFF', text: '#1E6BD9', darkBg: '#09336d', darkText: '#9ac3ff' }, // Blue
      { bg: '#ECE0FD', text: '#5119B5', darkBg: '#25085c', darkText: '#c9afff' }, // Purple
      { bg: '#FDE2FA', text: '#BF26A8', darkBg: '#59094c', darkText: '#ff9be9' }, // Pink
      { bg: '#D2F4EC', text: '#077E60', darkBg: '#02382a', darkText: '#6bf0d1' }, // Light Green
      { bg: '#D3F8FF', text: '#007C9A', darkBg: '#003a49', darkText: '#7be5ff' }  // Cyan
    ];
    const index = Math.abs(hash) % odooColors.length;
    const color = odooColors[index];
    if (isDark) {
      return { bg: color.darkBg, text: color.darkText };
    }
    return { bg: color.bg, text: color.text };
  };
  const handleStarClick = (oppId: string, starIndex: number) => {
    const opp = opportunities.find(o => o.id === oppId);
    if (!opp) return;
    const currentStars = getPriorityStars(opp.priority);
    const newPriority = currentStars === starIndex ? starIndex - 1 : starIndex;
    onUpdateOpportunity(oppId, { priority: newPriority });
  };

  const renderActivityIcon = (opp: any) => {
    const oppActivities = activities.filter((a: any) => 
      (a.opportunityId === opp.id || a.leadId === opp.leadId) && !a.done
    );

    if (oppActivities.length === 0) {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            crmCtx.setShowActivityModal(true);
          }}
          className="p-1 rounded-full text-slate-350 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center cursor-pointer shrink-0"
          title="No activities. Click to schedule."
        >
          <Clock className="w-3.5 h-3.5" />
        </button>
      );
    }

    const sorted = [...oppActivities].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const act = sorted[0];

    const actDate = new Date(act.date);
    const today = new Date();
    today.setHours(0,0,0,0);
    const compareDate = new Date(actDate);
    compareDate.setHours(0,0,0,0);

    let colorClass = "text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20";
    let statusLabel = "Upcoming Activity";
    if (compareDate < today) {
      colorClass = "text-rose-500 bg-rose-500/10 dark:bg-rose-500/20";
      statusLabel = `Overdue: ${act.title}`;
    } else if (compareDate.getTime() === today.getTime()) {
      colorClass = "text-amber-500 bg-amber-500/10 dark:bg-amber-500/20";
      statusLabel = `Today: ${act.title}`;
    } else {
      statusLabel = `Future: ${act.title}`;
    }

    let Icon = Clock;
    const type = (act.type || '').toLowerCase();
    if (type.includes('call') || type.includes('phone')) {
      Icon = Phone;
    } else if (type.includes('mail') || type.includes('email')) {
      Icon = Mail;
    } else if (type.includes('meeting') || type.includes('calendar') || type.includes('event')) {
      Icon = Calendar;
    }

    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          addToast('info', `Upcoming task: ${act.title}`);
        }}
        className={`p-1 rounded-full ${colorClass} transition flex items-center justify-center shrink-0 cursor-pointer`}
        title={`${statusLabel} (${new Date(act.date).toLocaleDateString()})`}
      >
        <Icon className="w-3 h-3" />
      </button>
    );
  };

  const handleExportCSV = () => {
    if (opportunities.length === 0) {
      addToast('info', 'No opportunities to export');
      return;
    }

    const headers = [
      'ID',
      'Opportunity / Customer Name',
      'Company',
      'Email',
      'Phone',
      'Deal Value',
      'Stage',
      'Expected Closing',
      'Priority (Stars)',
      'Tags',
      'Salesperson',
      'Created Date'
    ];

    const rows = opportunities.map(opp => [
      opp.id,
      opp.customerName || '',
      opp.company || '',
      opp.email || '',
      opp.phone || '',
      opp.dealValue || 0,
      opp.stage || '',
      opp.expectedClosing ? new Date(opp.expectedClosing).toLocaleDateString() : '',
      getPriorityStars(opp.priority),
      (opp.tags || []).join('; '),
      opp.assignedSalesperson || '',
      opp.createdAt ? new Date(opp.createdAt).toLocaleDateString() : ''
    ]);

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(row => row.map(val => {
        const str = String(val).replace(/"/g, '""');
        return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `opportunities_pipeline_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Opportunities exported successfully!');
  };

  const [newStageName, setNewStageName] = useState('');
  const [draggedOppId, setDraggedOppId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [selectedOpp, setSelectedOpp] = useState<any | null>(null);
  const [showQuotationForm, setShowQuotationForm] = useState(false);
  const [quotationOpportunity, setQuotationOpportunity] = useState<any>(null);

  const [oppDescription, setOppDescription] = useState('');
  const [saveNotesLoading, setSaveNotesLoading] = useState(false);

  React.useEffect(() => {
    if (selectedOpp) {
      setOppDescription(selectedOpp.description || '');
    } else {
      setOppDescription('');
    }
  }, [selectedOpp]);

  const handleSaveNotes = async () => {
    if (!selectedOpp) return;
    setSaveNotesLoading(true);
    try {
      await onUpdateOpportunity(selectedOpp.id, { description: oppDescription });
      setSelectedOpp((prev: any) => prev ? { ...prev, description: oppDescription } : null);
      // addToast('success', 'Notes saved successfully!');
    } catch (err: any) {
      addToast('error', 'Failed to save notes');
    } finally {
      setSaveNotesLoading(false);
    }
  };

  const [newTagInput, setNewTagInput] = useState('');

  const handleAddTag = async () => {
    const trimmed = newTagInput.trim();
    if (!trimmed || !selectedOpp) return;
    const currentTags = selectedOpp.tags || [];
    if (currentTags.includes(trimmed)) {
      addToast('info', 'Tag already exists on this opportunity');
      return;
    }
    const updatedTags = [...currentTags, trimmed];
    try {
      await onUpdateOpportunity(selectedOpp.id, { tags: updatedTags });
      setSelectedOpp((prev: any) => prev ? { ...prev, tags: updatedTags } : null);
      setNewTagInput('');
      
    } catch (err: any) {
      addToast('error', 'Failed to add tag');
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!selectedOpp) return;
    const currentTags = selectedOpp.tags || [];
    const updatedTags = currentTags.filter((t: string) => t !== tagToRemove);
    try {
      await onUpdateOpportunity(selectedOpp.id, { tags: updatedTags });
      setSelectedOpp((prev: any) => prev ? { ...prev, tags: updatedTags } : null);
      
    } catch (err: any) {
      addToast('error', 'Failed to remove tag');
    }
  };

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', body: '' });
  const [emailLoading, setEmailLoading] = useState(false);

  const [selectedOppIds, setSelectedOppIds] = useState<string[]>([]);
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
 const [bulkEmailForm, setBulkEmailForm] = useState({
    cc: "",
    bcc: "",
    template: "",
    subject: "",
    body: ""
});
  const [bulkEmailLoading, setBulkEmailLoading] = useState(false);

const GENERAL_TEMPLATES = [
    { id: 'blank', label: 'Blank Email', subject: '', body: '' },
    {
      id: 'welcome',
      label: 'Welcome Email',
      subject: 'Welcome to CRM-360',
      body: `Hi {{contactName}},\n\nWelcome to CRM-360.\n\nThank you for connecting with us.\n\nWe look forward to helping your organization streamline customer relationship management and improve sales productivity.\n\nIf you have any questions, feel free to contact us.\n\nBest Regards,\n\n{{senderName}}\n\nCRM-360`
    },
    {
      id: 'product_intro',
      label: 'Product Introduction',
      subject: 'Introducing CRM-360',
      body: `Hi {{contactName}},\n\nI hope you're doing well.\n\nI'd like to introduce CRM-360, a complete CRM platform designed to manage leads, opportunities, customer interactions, quotations, and sales activities efficiently.\n\nWe would love to demonstrate how CRM-360 can benefit your organization.\n\nPlease let us know if you'd like to schedule a demo.\n\nBest Regards,\n\n{{senderName}}\n\nCRM-360`
    },
    {
      id: 'follow_up',
      label: 'Follow-up',
      subject: 'Following Up on Our Previous Conversation',
      body: `Hi {{contactName}},\n\nI hope you're doing well.\n\nI wanted to follow up regarding our previous discussion.\n\nPlease let us know if you have any questions or require additional information.\n\nLooking forward to your response.\n\nBest Regards,\n\n{{senderName}}\n\nCRM-360`
    },
    {
      id: 'meeting_request',
      label: 'Meeting Request',
      subject: 'Meeting Request',
      body: `Hi {{contactName}},\n\nI hope you're doing well.\n\nWe would appreciate the opportunity to meet with you to discuss your business requirements and demonstrate how CRM-360 can help your organization.\n\nPlease let us know a suitable date and time.\n\nLooking forward to meeting with you.\n\nBest Regards,\n\n{{senderName}}\n\nCRM-360`
    },
    {
      id: 'quote_follow_up',
      label: 'Quotation Follow-up',
      subject: 'Follow-up Regarding Your Quotation',
      body: `Hi {{contactName}},\n\nI hope you're doing well.\n\nI wanted to follow up regarding the quotation we shared.\n\nPlease let us know if you have any questions or if you require any modifications.\n\nWe look forward to hearing from you.\n\nBest Regards,\n\n{{senderName}}\n\nCRM-360`
    },
    {
      id: 'thank_you',
      label: 'Thank You',
      subject: 'Thank You',
      body: `Hi {{contactName}},\n\nThank you for taking the time to connect with us.\n\nWe truly appreciate the opportunity to work with you.\n\nIf there is anything else we can assist you with, please don't hesitate to reach out.\n\nBest Regards,\n\n{{senderName}}\n\nCRM-360`
    }
  ];

    const getCategoryTemplates = (categoriesList: string[]) => {
    return categoriesList.map(cat => ({
      id: `category_${cat}`,
      label: `${cat} Template`,
      subject: `Helping Your ${cat} Business Grow with CRM-360`,
      body: `Hi {{contactName}},\n\nI hope you're doing well.\n\nWe noticed that your organization operates in the ${cat} industry.\n\nCRM-360 helps businesses manage leads, automate follow-ups, organize sales pipelines, and improve customer relationships from one platform.\n\nWe would be happy to schedule a quick demonstration and discuss how CRM-360 can support your business.\n\nPlease let us know a convenient time.\n\nBest Regards,\n\n{{senderName}}\n\nCRM-360`
    }));
  };

    const resolvePlaceholders = (text: string, lead: any, senderUser: any, categoryName?: string) => {
    if (!text) return "";
    const currentDate = new Date().toISOString().split('T')[0];
    return text
      .replace(/\{\{contactName\}\}/g, lead?.contactName || lead?.name || "")
      .replace(/\{\{companyName\}\}/g, lead?.company || "")
      .replace(/\{\{category\}\}/g, categoryName || lead?.category || "")
      .replace(/\{\{email\}\}/g, lead?.email || "")
      .replace(/\{\{phone\}\}/g, lead?.phone || "")
      .replace(/\{\{assignedUser\}\}/g, lead?.assignedUser || "")
      .replace(/\{\{senderName\}\}/g, senderUser?.name || "")
      .replace(/\{\{senderEmail\}\}/g, senderUser?.email || "")
      .replace(/\{\{organizationName\}\}/g, senderUser?.company || "")
      .replace(/\{\{currentDate\}\}/g, currentDate);
  };

const categories = [
  ...new Set(
    leads
      .map((lead) => lead.category)
      .filter(Boolean)
  ),
];

const categoryTemplates = getCategoryTemplates(categories);

const [selectedTemplateId, setSelectedTemplateId] = useState("");

const [isTemplateManuallySelected, setIsTemplateManuallySelected] = useState(false);

const matchedLead = leads.find((lead) =>
  selectedOppIds.some((id) => {
    const opp = opportunities.find((o) => o.id === id);
    return (
      opp &&
      (lead.email === opp.email ||
        lead.id === opp.leadId)
    );
  })
);

 const applyTemplate = (template: any, lead: any) => {
    const resolvedSubject = resolvePlaceholders(template.subject, lead, user, lead?.category || (template.id.startsWith('category_') ? template.id.replace('category_', '') : ''));
    const resolvedBody = resolvePlaceholders(template.body, lead, user, lead?.category || (template.id.startsWith('category_') ? template.id.replace('category_', '') : ''));
    setBulkEmailForm(prev => ({
      ...prev,
      subject: resolvedSubject,
      body: resolvedBody
    }));
  };

    const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setIsTemplateManuallySelected(true);

    if (!templateId || templateId === 'blank') {
      setBulkEmailForm(prev => ({ ...prev, subject: '', body: '' }));
      return;
    }

    const template = GENERAL_TEMPLATES.find(t => t.id === templateId) || 
                     categoryTemplates.find(t => t.id === templateId);



    if (template) {
      applyTemplate(template, matchedLead);
    }
  };

  const handleToggleViewMode = (mode: 'kanban' | 'list') => {
    setViewMode(mode);
    setSelectedOppIds([]);
  };

  const filteredOpps = applyFilters(opportunities, 'opportunities');

  const handleSelectAllToggle = () => {
    const allFilteredIds = filteredOpps.map(opp => opp.id);
    const areAllSelected = allFilteredIds.every(id => selectedOppIds.includes(id));
    if (areAllSelected) {
      setSelectedOppIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedOppIds(prev => {
        const uniqueNewIds = allFilteredIds.filter(id => !prev.includes(id));
        return [...prev, ...uniqueNewIds];
      });
    }
  };

  const handleSelectOppToggle = (oppId: string) => {
    setSelectedOppIds(prev =>
      prev.includes(oppId) ? prev.filter(id => id !== oppId) : [...prev, oppId]
    );
  };

 const handleSendBulkEmailSubmit = async (
  e: React.FormEvent
) => {

  e.preventDefault();

  if (selectedOppIds.length === 0) {
    addToast("error", "No opportunities selected");
    return;
  }

  try {

    setBulkEmailLoading(true);

  await emailService.sendBulkEmail({
    opportunityIds: selectedOppIds,
    cc: bulkEmailForm.cc,
    bcc: bulkEmailForm.bcc,
    subject: bulkEmailForm.subject,
    body: bulkEmailForm.body
});

    addToast(
      "success",
      "Bulk email sent successfully!"
    );

    setShowBulkEmailModal(false);

setBulkEmailForm({
    cc: "",
    bcc: "",
    template: "",
    subject: "",
    body: ""
});

setSelectedTemplateId("");
setIsTemplateManuallySelected(false);
setShowBulkEmailModal(true);

  } catch (err: any) {

    addToast(
      "error",
      err.response?.data?.message ||
      "Failed to send bulk email."
    );

  } finally {

    setBulkEmailLoading(false);

  }

};

  const handleOpenEmailModal = (opp: any) => {
    const associatedLead = leads.find(l =>
      l.id === opp.leadId ||
      ((l.contactName === opp.customerName || l.name === opp.customerName) && l.company === opp.company)
    );
    const resolvedEmail = opp.email || associatedLead?.email || '';
    setEmailForm({
      to: resolvedEmail,
      subject: `Regarding your Opportunity: ${opp.customerName}`,
      body: `Hi ${opp.customerName},\n\n`
    });
    setShowEmailModal(true);
  };

  const handleSendEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForm.to.trim()) {
      addToast('error', 'Recipient email is required');
      return;
    }
    setEmailLoading(true);
    const payload = {
      sender: user?.email || 'superadmin@crm.com',
      to: emailForm.to,
      subject: emailForm.subject,
      body: emailForm.body,
      folder: 'Sent'
    };
    try {
      const res = await emailService.sendEmail(payload);
      if (res) {
        addToast('success', `Email sent successfully to ${emailForm.to}!`);
        setShowEmailModal(false);
      } else {
        addToast('error', 'Failed to send email.');
      }
    } catch (err: any) {
      console.warn("Error sending email:", err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to send email.';
      addToast('error', errMsg);
    } finally {
      setEmailLoading(false);
    }
  };

  const formatCreatedOn = (opp: any) => {
    const dateStr = opp.createdAt || opp.createdDate;
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day} ${month}, ${hours}:${minutes} ${ampm}`;
  };

  const userRole = (user?.role || '').toUpperCase().replace(/[\s_]+/g, '_');

  const handleStageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStageName.trim()) {
      onAddStage(newStageName.trim());
      setNewStageName('');
      setShowStageModal(false);
    }
  };

  const handleDragStart = (oppId: string) => {
    setDraggedOppId(oppId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    const edgeSize = 100; // Trigger zone near left/right edges (in pixels)
    const scrollSpeed = 15; // Amount to scroll per drag event
    
    if (x < edgeSize) {
      container.scrollLeft -= scrollSpeed;
    } else if (rect.width - x < edgeSize) {
      container.scrollLeft += scrollSpeed;
    }
  };

  const handleDrop = (stageId: string) => {
    if (!draggedOppId) return;
    const opp = opportunities.find(o => o.id === draggedOppId);
    if (!opp) return;

    if (userRole === 'USER' && opp.assignedSalesperson !== user?.name) {
      addToast('error', 'Access Denied: You can only move opportunities assigned to you');
      setDraggedOppId(null);
      return;
    }

    onMoveOpportunity(draggedOppId, stageId);
    setDraggedOppId(null);
  };

  const handleShiftOpportunity = (oppId: string, direction: 'left' | 'right') => {
    const opp = opportunities.find(o => o.id === oppId);
    if (!opp) return;

    if (userRole === 'USER' && opp.assignedSalesperson !== user?.name) {
      addToast('error', 'Access Denied: You can only move opportunities assigned to you');
      return;
    }

    const currentStageIdx = pipelines.findIndex(p => p.id === opp.stageId || p.name?.toLowerCase() === opp.stage?.toLowerCase());
    if (currentStageIdx === -1) return;

    const targetStageIdx = direction === 'left' ? currentStageIdx - 1 : currentStageIdx + 1;
    if (targetStageIdx >= 0 && targetStageIdx < pipelines.length) {
      onMoveOpportunity(oppId, pipelines[targetStageIdx].id);
    }
  };

  return (
    <div className="flex flex-col gap-4 text-xs text-txt-primary">
      {/* View Toggle Bar */}
      <div className="flex justify-between items-center bg-card border border-border-crm rounded-2xl py-2.5 px-4 shrink-0 shadow-xs">
        <div className="flex items-center space-x-2">
          <span className="font-extrabold text-sm text-txt-primary">Pipeline</span>
          {viewMode === 'list' && selectedOppIds.length > 0 && (
            <div className="flex items-center space-x-2 ml-4 animate-in fade-in slide-in-from-left-2 duration-200">
              <span className="text-xs text-txt-secondary font-semibold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                {selectedOppIds.length} Selected
              </span>
              <button
                onClick={() => {
                setBulkEmailForm({
    cc: "",
    bcc: "",
    template: "",
    subject: "Update regarding your project/opportunity",
    body:
        "Hi,\n\nI wanted to reach out regarding the status of our current project/opportunity. Let me know if you have any questions.\n\nBest regards,\nSuperadmin"
});
                  setShowBulkEmailModal(true);
                }}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow flex items-center gap-1.5 transition cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send Bulk Email</span>
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {/* Export File Button */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-txt-primary hover:text-primary rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs border border-border-crm/30"
            title="Export Opportunities to CSV"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Export File</span>
          </button>

          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => handleToggleViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                  : 'text-txt-secondary hover:text-txt-primary'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Card View</span>
            </button>
            <button
              onClick={() => handleToggleViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                  : 'text-txt-secondary hover:text-txt-primary'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <div
          ref={scrollContainerRef}
          onDragOver={handleDragOver}
          className="flex space-x-4 overflow-x-auto pb-4 items-start select-none"
        >
          {pipelines.map(stage => {
            const stageOpps = applyFilters(
              opportunities.filter(
                o => o.stage?.toLowerCase() === stage.name?.toLowerCase()
              ),
              "opportunities"
            );
            const totalValue = stageOpps.reduce((sum, opp) => sum + opp.dealValue, 0);

            return (
              <div
                key={stage.id}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stage.id)}
                className="w-72 shrink-0 bg-slate-50 dark:bg-slate-900/20 border border-border-crm rounded-2xl p-4 flex flex-col max-h-160"
              >
                <div className="flex items-center justify-between pb-3 border-b border-border-crm mb-4">
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-txt-primary truncate" title={stage.name}>
                      {stage.name}
                    </h4>
                    <p className="text-[10px] text-txt-secondary mt-0.5">₹{totalValue.toLocaleString()}</p>
                  </div>

                  {/* Controls for stage (All users) */}
                  <div className="flex items-center space-x-1 shrink-0 ml-1">
                    <button
                      onClick={() => onReorderStage(stage.id, 'left')}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 cursor-pointer"
                      title="Move Stage Left"
                    >
                      <ChevronRight className="w-3 h-3 rotate-180" />
                    </button>
                    <button
                      onClick={() => onReorderStage(stage.id, 'right')}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 cursor-pointer"
                      title="Move Stage Right"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onDeleteStage(stage.id)}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-rose-500 cursor-pointer"
                      title="Delete Stage"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 min-h-24">
                  {stageOpps.map(opp => (
                    <div
                      key={opp.id}
                      draggable
                      onDragStart={() => handleDragStart(opp.id)}
                      onClick={() => setSelectedOpp(opp)}
                      className="group bg-card border border-border-crm rounded-xl p-3 shadow-xs hover:shadow-md hover:border-primary/40 transition-all cursor-pointer text-txt-primary flex flex-col gap-1.5 relative"
                    >
                      {/* Top Line: Title & Hover Delete */}
                      <div className="flex justify-between items-start gap-2">
                        <h5 className="font-bold text-[13px] text-txt-primary leading-tight truncate flex-1" title={opp.customerName}>
                          {opp.customerName}
                        </h5>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this opportunity?')) {
                              onDeleteOpportunity(opp.id);
                            }
                          }}
                          className="p-1 text-slate-350 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0 opacity-0 group-hover:opacity-100"
                          title="Delete Opportunity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Deal Value */}
                      <div className="text-[12px] font-semibold text-txt-primary leading-none">
                        ₹{Number(opp.dealValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>

                      {/* Customer / Company */}
                      {opp.company && (
                        <div className="text-[11px] text-txt-secondary truncate leading-none mt-0.5">
                          {opp.company}
                        </div>
                      )}

                      {/* Tag Pills */}
                      {opp.tags && opp.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {opp.tags.map((tag: string, idx: number) => {
                            const colors = getTagColors(tag, isDark);
                            return (
                              <span
                                key={idx}
                                className="text-[9px] px-2 py-0.5 rounded-full font-bold select-none"
                                style={{ backgroundColor: colors.bg, color: colors.text }}
                              >
                                {tag}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Bottom Accessories Bar */}
                      <div className="flex items-center justify-between border-t border-border-crm/40 pt-2 mt-1 select-none">
                        {/* 3-Star priority rating */}
                        <div className="flex items-center space-x-0.5" onClick={(e) => e.stopPropagation()}>
                          {[1, 2, 3].map((star) => {
                            const isFilled = star <= getPriorityStars(opp.priority);
                            return (
                              <button
                                key={star}
                                onClick={() => handleStarClick(opp.id, star)}
                                className="focus:outline-none transition-transform hover:scale-125 p-0.5 cursor-pointer"
                                title={`Set priority: ${star} star${star > 1 ? 's' : ''}`}
                              >
                                <Star
                                  className={`w-3.5 h-3.5 ${
                                    isFilled
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-slate-350 dark:text-slate-600'
                                  }`}
                                />
                              </button>
                            );
                          })}
                        </div>

                        {/* Status Icon & Assignee Avatar */}
                        <div className="flex items-center space-x-2 shrink-0">
                          {/* Activity indicator */}
                          {renderActivityIcon(opp)}

                          {/* Assignee initials badge */}
                          <div
                            className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 border border-border-crm flex items-center justify-center text-[9px] font-bold text-txt-secondary uppercase select-none shrink-0"
                            title={opp.assignedSalesperson || 'Unassigned'}
                          >
                            {opp.assignedSalesperson ? opp.assignedSalesperson.substr(0, 2) : 'UN'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {stageOpps.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-[10px]">
                      Drag deals here.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Render List View Table */
        <div className="bg-card border border-border-crm rounded-2xl p-5 shadow-xs text-txt-primary">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-crm text-[10px] text-txt-secondary font-bold uppercase">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      className="rounded text-primary border-border-crm focus:ring-0 cursor-pointer w-3.5 h-3.5"
                      checked={filteredOpps.length > 0 && filteredOpps.every(opp => selectedOppIds.includes(opp.id))}
                      onChange={handleSelectAllToggle}
                    />
                  </th>
                  <th className="py-3 px-4">Created on</th>
                  <th className="py-3 px-4">Opportunity</th>
                  <th className="py-3 px-4">Contact Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Salesperson</th>
                  <th className="py-3 px-4">Expected Revenue</th>
                  <th className="py-3 px-4">Tags</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-crm text-xs">
                {filteredOpps.map(opp => {
                  const associatedLead = leads.find(l =>
                    l.id === opp.leadId ||
                    ((l.contactName === opp.customerName || l.name === opp.customerName) && l.company === opp.company)
                  );
                  const resolvedEmail = opp.email || associatedLead?.email || 'N/A';
                  const resolvedCompany = opp.company || associatedLead?.company || 'N/A';

                  return (
                    <tr key={opp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="py-3.5 px-4 w-10">
                        <input
                          type="checkbox"
                          className="rounded text-primary border-border-crm focus:ring-0 cursor-pointer w-3.5 h-3.5"
                          checked={selectedOppIds.includes(opp.id)}
                          onChange={() => handleSelectOppToggle(opp.id)}
                        />
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-500 whitespace-nowrap">
                        {formatCreatedOn(opp)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-txt-primary">
                        <button
                          onClick={() => setSelectedOpp(opp)}
                          className="hover:underline cursor-pointer text-left focus:outline-none"
                        >
                          {opp.customerName}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-txt-secondary">
                        {resolvedCompany}
                      </td>
                      <td className="py-3.5 px-4 text-txt-secondary whitespace-nowrap">
                        {resolvedEmail}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span className="w-5 h-5 bg-slate-100 dark:bg-slate-850 rounded-full flex items-center justify-center text-[9px] font-bold text-slate-500 uppercase select-none">
                            {opp.assignedSalesperson ? opp.assignedSalesperson.substr(0, 2) : 'UN'}
                          </span>
                          <span className="font-semibold text-txt-primary">
                            {opp.assignedSalesperson || 'Unassigned'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-primary whitespace-nowrap">
                        ₹{opp.dealValue.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[160px]">
                          {opp.tags && opp.tags.length > 0 ? (
                            opp.tags.map((tag: string, idx: number) => {
                              const colors = getTagColors(tag, isDark);
                              return (
                                <span
                                  key={idx}
                                  className="text-[9.5px] px-1.5 py-0.5 rounded font-bold select-none whitespace-nowrap"
                                  style={{ backgroundColor: colors.bg, color: colors.text }}
                                >
                                  {tag}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">None</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="bg-blue-50 dark:bg-blue-950/40 text-primary border border-blue-100 dark:border-blue-900 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          {opp.stage || 'New'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex justify-end items-center space-x-2">
                          <button
                            onClick={() => handleOpenEmailModal(opp)}
                            className="inline-flex items-center space-x-1 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg px-2.5 py-1 text-[10px] font-bold transition cursor-pointer"
                            title="Send Email"
                          >
                            <Mail className="w-3 h-3" />
                            <span>Email</span>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this opportunity?')) {
                                onDeleteOpportunity(opp.id);
                              }
                            }}
                            className="p-1 text-slate-450 hover:text-rose-500 rounded transition cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredOpps.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-400 font-medium italic">
                      No opportunities matching the criteria found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showStageModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border-crm rounded-2xl shadow-2xl p-6 max-w-sm w-full text-txt-primary">
            <h4 className="font-bold text-sm tracking-tight mb-4">Add Sales Stage</h4>
            <form onSubmit={handleStageSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Stage Name</label>
                <input
                  type="text" required
                  className="w-full border border-border-crm bg-bg-main rounded-xl px-3 py-2 text-txt-primary focus:outline-none bg-white"
                  value={newStageName}
                  onChange={e => setNewStageName(e.target.value)}
                  placeholder="e.g. Demonstration"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button" onClick={() => setShowStageModal(false)}
                  className="flex-1 border border-border-crm hover:bg-slate-50 rounded-xl py-2 font-semibold text-txt-primary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary-hover text-white rounded-xl py-2 font-semibold shadow cursor-pointer"
                >
                  Create Stage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Centered Opportunity Detail Modal styled like a Lead Card */}
      {selectedOpp && (() => {
        const associatedLead = leads.find(l =>
          l.id === selectedOpp.leadId ||
          ((l.contactName === selectedOpp.customerName || l.name === selectedOpp.customerName) && l.company === selectedOpp.company)
        ) || {
          contactName: selectedOpp.customerName,
          company: selectedOpp.company || '',
          email: selectedOpp.email || 'info@' + (selectedOpp.company ? selectedOpp.company.toLowerCase().replace(/[^a-z0-9]/g, '') : 'example') + '.com',
          phone: selectedOpp.phone || 'xxxxxxxxxx',
          category: selectedOpp.tags?.[1] || 'IT Services',
          serviceType: selectedOpp.tags?.[0] || 'Service Based',
          assignedUser: selectedOpp.assignedSalesperson || 'Unassigned',
          status: pipelines.find(p => p.id === selectedOpp.stageId)?.name || 'New',
          createdAt:
            selectedOpp.createdDate ||
            (selectedOpp.createdAt
              ? selectedOpp.createdAt.split('T')[0]
              : new Date().toISOString().split('T')[0]),
        };

        const contactName = associatedLead.contactName || associatedLead.name || 'Unknown';
        const company = associatedLead.company || '';
        const email = associatedLead.email || '';
        const phone = associatedLead.phone || '';
        const category = associatedLead.category || '';
        const serviceType = associatedLead.serviceType || '';
        const assignedUser = associatedLead.assignedUser || 'Unassigned';
        const status = associatedLead.status || 'New';
        const createdAt = associatedLead.createdAt
          ? associatedLead.createdAt.split('T')[0]
          : '';

        return (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 transition-all animate-in fade-in duration-200"
            onClick={() => setSelectedOpp(null)}
          >
            <div
              className="relative w-full max-w-3xl bg-card shadow-2xl border border-border-crm rounded-2xl p-5 flex flex-col z-10 text-txt-primary animate-in fade-in zoom-in-95 duration-200"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center pb-3 border-b border-border-crm shrink-0 mb-3.5">
                <h3 className="font-extrabold text-xs tracking-tight text-txt-primary flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" /> Opportunity Profile
                </h3>
                <button
                  onClick={() => setSelectedOpp(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-400 hover:text-txt-primary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body: 2-Column Grid for wider and shorter layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1 overflow-y-auto max-h-[60vh] py-1 pr-1">
                
                {/* Column 1: Contact Details & Metadata */}
                <div className="space-y-3.5">
                  <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-150 dark:border-border-crm rounded-xl p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-slate-400 font-semibold uppercase text-[9px]">Contact Name</p>
                        <input
                          type="text"
                          value={contactName}
                          readOnly
                          className="w-full border border-border-crm bg-bg-main dark:bg-slate-900 rounded-lg px-2.5 py-1.5 font-bold text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-400 font-semibold uppercase text-[9px]">Company</p>
                        <input
                          type="text"
                          value={company}
                          readOnly
                          className="w-full border border-border-crm bg-bg-main dark:bg-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="bg-blue-50 dark:bg-blue-950/40 text-primary border border-blue-100 dark:border-blue-900 text-[9px] px-2 py-0.5 rounded font-semibold">
                        {category}
                      </span>
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[9px] px-2 py-0.5 rounded font-semibold">
                        {associatedLead.source || 'Opportunity'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-slate-400 font-semibold uppercase text-[9px] mb-1">Email</p>
                      <input
                        type="email"
                        value={email}
                        readOnly
                        className="w-full border border-border-crm bg-bg-main dark:bg-slate-900 rounded-lg px-2.5 py-1.5 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-slate-400 font-semibold uppercase text-[9px] mb-1">Phone</p>
                      <input
                        type="text"
                        value={phone}
                        readOnly
                        className="w-full border border-border-crm bg-bg-main dark:bg-slate-900 rounded-lg px-2.5 py-1.5 focus:outline-none"
                      />
                    </div>
                    <div>
                      <p className="text-slate-400 font-semibold uppercase text-[9px] mb-0.5">Assigned Rep</p>
                      <p className="font-bold text-txt-primary text-xs">{assignedUser}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-semibold uppercase text-[9px] mb-0.5">Service Type</p>
                      <p className="font-bold text-txt-primary text-xs">{serviceType}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-semibold uppercase text-[9px] mb-0.5">Lead Sync</p>
                      <p className="font-bold text-txt-primary text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-success shrink-0" />
                        {status}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-semibold uppercase text-[9px] mb-0.5">Created At</p>
                      <p className="font-bold text-txt-primary text-xs flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        {createdAt}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Column 2: Tags & Notes */}
                <div className="flex flex-col justify-between space-y-4">
                  {/* Opportunity Tags Section */}
                  <div className="space-y-1.5">
                    <p className="text-slate-400 font-semibold uppercase text-[9px]">Opportunity Tags</p>
                    
                    {/* Current Tags List */}
                    <div className="flex flex-wrap gap-1.5 min-h-[20px] max-h-[70px] overflow-y-auto pr-1">
                      {selectedOpp.tags && selectedOpp.tags.length > 0 ? (
                        selectedOpp.tags.map((tag: string, idx: number) => {
                          const colors = getTagColors(tag, isDark);
                          return (
                            <span
                              key={idx}
                              className="text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 select-none transition-all"
                              style={{ backgroundColor: colors.bg, color: colors.text }}
                            >
                              <span>{tag}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className="hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 shrink-0 transition cursor-pointer"
                                style={{ color: colors.text }}
                              >
                                <X className="w-2 h-2" />
                              </button>
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-[11px] text-slate-400 ">No tags added yet.</span>
                      )}
                    </div>

                    {/* Add Tag Input */}
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        placeholder="Add tag (e.g. urgent, retail)..."
                        value={newTagInput}
                        onChange={e => setNewTagInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        className="flex-grow border border-border-crm bg-bg-main dark:bg-slate-900 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="bg-primary hover:bg-primary-hover text-white text-[10px] font-bold px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap"
                      >
                        Add Tag
                      </button>
                    </div>
                  </div>

                  {/* Description / Notes Section */}
                  <div className="space-y-1.5 pt-3 border-t border-border-crm/30">
                    <div className="flex justify-between items-center">
                      <p className="text-slate-400 font-semibold uppercase text-[9px]">Description / Notes</p>
                      <button
                        type="button"
                        disabled={saveNotesLoading}
                        onClick={handleSaveNotes}
                        className="bg-primary hover:bg-primary-hover text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        {saveNotesLoading ? 'Saving...' : 'Save Notes'}
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={oppDescription}
                      onChange={e => setOppDescription(e.target.value)}
                      placeholder="Enter notes or description about this opportunity..."
                      className="w-full border border-border-crm bg-bg-main dark:bg-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary resize-none mt-1"
                    />
                  </div>
                </div>

              </div>

              <div className="border-t border-border-crm pt-3.5 mt-5 flex gap-2 justify-end">
                <button
                  onClick={() => setSelectedOpp(null)}
                  className="px-4 py-2 border border-border-crm hover:bg-slate-50 dark:hover:bg-slate-800 text-txt-secondary text-[11px] font-semibold rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  className="bg-primary hover:bg-primary-hover text-white text-[11px] font-semibold px-4 py-2 rounded-xl shadow transition cursor-pointer"
                  onClick={() => setShowQuotationForm(true)}
                >
                  New Quotation
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {showQuotationForm && selectedOpp && (
        <QuotationForm
          opportunity={selectedOpp}
          onClose={() => setShowQuotationForm(false)}
        />
      )}

      {showEmailModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 transition-all animate-in fade-in duration-200">
          <div className="bg-card border border-border-crm rounded-2xl shadow-2xl p-6 max-w-md w-full text-txt-primary animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-border-crm mb-4">
              <h4 className="font-extrabold text-sm tracking-tight flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" /> Send Email
              </h4>
              <button
                onClick={() => setShowEmailModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-400 hover:text-txt-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSendEmailSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">To</label>
                <input
                  type="email" required
                  className="w-full border border-border-crm bg-bg-main dark:bg-slate-900 rounded-xl px-3 py-2 text-txt-primary focus:outline-none"
                  value={emailForm.to}
                  onChange={e => setEmailForm({ ...emailForm, to: e.target.value })}
                  placeholder="name@company.com"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Subject</label>
                <input
                  type="text" required
                  className="w-full border border-border-crm bg-bg-main dark:bg-slate-900 rounded-xl px-3 py-2 text-txt-primary focus:outline-none bg-white"
                  value={emailForm.subject}
                  onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })}
                  placeholder="Opportunity Discussion..."
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Body</label>
                <textarea
                  required rows={6}
                  className="w-full border border-border-crm bg-bg-main dark:bg-slate-900 rounded-xl px-3 py-2 text-txt-primary focus:outline-none bg-white resize-none"
                  value={emailForm.body}
                  onChange={e => setEmailForm({ ...emailForm, body: e.target.value })}
                  placeholder="Enter message details here..."
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button" onClick={() => setShowEmailModal(false)}
                  className="flex-1 border border-border-crm hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl py-2 font-semibold text-txt-primary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={emailLoading}
                  className="flex-1 bg-primary hover:bg-primary-hover text-white rounded-xl py-2 font-semibold shadow cursor-pointer disabled:opacity-50"
                >
                  {emailLoading ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showBulkEmailModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 transition-all animate-in fade-in duration-200">
          <div className="bg-card border border-border-crm rounded-2xl shadow-2xl p-6 max-w-md w-full text-txt-primary animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-border-crm mb-4">
              <h4 className="font-extrabold text-sm tracking-tight flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" /> Send Bulk Email
              </h4>
              <button
                onClick={() => setShowBulkEmailModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-400 hover:text-txt-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSendBulkEmailSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">To</label>
                <input
                  type="text" readOnly
                  className="w-full border border-border-crm bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-2 text-txt-secondary font-semibold"
                  value={`${selectedOppIds.length} selected recipients`}
                />

                <div>
  <label className="block text-slate-400 font-semibold mb-1">CC</label>
  <input
    type="email"
    value={bulkEmailForm.cc}
    onChange={(e) =>
      setBulkEmailForm({
        ...bulkEmailForm,
        cc: e.target.value,
      })
    }
    className="w-full border border-border-crm rounded-xl px-3 py-2"
    placeholder="cc@example.com"
  />
</div>


<div>
  <label className="block text-slate-400 font-semibold mb-1">BCC</label>
  <input
    type="email"
    value={bulkEmailForm.bcc}
    onChange={(e) =>
      setBulkEmailForm({
        ...bulkEmailForm,
        bcc: e.target.value,
      })
    }
    className="w-full border border-border-crm rounded-xl px-3 py-2"
    placeholder="bcc@example.com"
  />
</div>
              </div>
              <div>
  <label className="block text-slate-400 font-semibold mb-1">
    Choose Template
  </label>

  <select
    value={selectedTemplateId}
    onChange={(e) => handleTemplateChange(e.target.value)}
    className="w-full border border-border-crm rounded-xl px-3 py-2"
  >
    <option value="">Select Template</option>

    <optgroup label="General Templates">
      {GENERAL_TEMPLATES.map((t) => (
        <option key={t.id} value={t.id}>
          {t.label}
        </option>
      ))}
    </optgroup>

    <optgroup label="Category Templates">
      {categoryTemplates.map((t) => (
        <option key={t.id} value={t.id}>
          {t.label}
        </option>
      ))}
    </optgroup>
  </select>
</div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Subject</label>
                <input
                  type="text" required
                  className="w-full border border-border-crm bg-bg-main dark:bg-slate-900 rounded-xl px-3 py-2 text-txt-primary focus:outline-none bg-white"
                  value={bulkEmailForm.subject}
                  onChange={e => setBulkEmailForm({ ...bulkEmailForm, subject: e.target.value })}
                  placeholder="Bulk Update..."
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Body</label>
                <textarea
                  required rows={6}
                  className="w-full border border-border-crm bg-bg-main dark:bg-slate-900 rounded-xl px-3 py-2 text-txt-primary focus:outline-none bg-white resize-none"
                  value={bulkEmailForm.body}
                  onChange={e => setBulkEmailForm({ ...bulkEmailForm, body: e.target.value })}
                  placeholder="Enter bulk message details here..."
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button" onClick={() => setShowBulkEmailModal(false)}
                  className="flex-1 border border-border-crm hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl py-2 font-semibold text-txt-primary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={bulkEmailLoading}
                  className="flex-1 bg-primary hover:bg-primary-hover text-white rounded-xl py-2 font-semibold shadow cursor-pointer disabled:opacity-50"
                >
                  {bulkEmailLoading ? 'Sending...' : 'Send Bulk Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
