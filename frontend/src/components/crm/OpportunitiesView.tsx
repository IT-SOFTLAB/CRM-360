import React, { useState } from 'react';
import { ChevronRight, Trash2, Plus, X, Briefcase, Calendar, DollarSign, User, Mail, Phone, Tag, Clipboard, Info, CheckCircle2 } from 'lucide-react';
import QuotationForm from "./QuotationForm";

interface OpportunitiesViewProps {
  opportunities: any[];
  pipelines: any[];
  user: any;
  searchQuery: string;
  activeFilters: any;
  onMoveOpportunity: (oppId: string, stageId: string) => void;
  onAddStage: (stageName: string) => void;
  onReorderStage: (stageId: string, direction: 'left' | 'right') => void;
  onDeleteStage: (stageId: string) => void;
  applyFilters: (data: any[], type: 'leads' | 'opportunities' | 'emails') => any[];
  showStageModal: boolean;
  setShowStageModal: (show: boolean) => void;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  leads: any[];
}


export default function OpportunitiesView({
  opportunities,
  pipelines,
  user,
  searchQuery,
  activeFilters,
  onMoveOpportunity,
  onAddStage,
  onReorderStage,
  onDeleteStage,
  applyFilters,
  showStageModal,
  setShowStageModal,
  addToast,
  leads
}: OpportunitiesViewProps) {
  const [newStageName, setNewStageName] = useState('');
  const [draggedOppId, setDraggedOppId] = useState<string | null>(null);
  const [selectedOpp, setSelectedOpp] = useState<any | null>(null);
  const [showQuotationForm, setShowQuotationForm] = useState(false);
  const [quotationOpportunity, setQuotationOpportunity] = useState<any>(null);

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
  };

  const handleDrop = (stageId: string) => {
    if (!draggedOppId) return;
    const opp = opportunities.find(o => o.id === draggedOppId);
    if (!opp) return;

    if (user?.role === 'User' && opp.assignedSalesperson !== user?.name) {
      addToast('error', 'Access Denied: You can only move opportunities assigned to you');
      setDraggedOppId(null);
      return;
    }

    onMoveOpportunity(draggedOppId, stageId);
    setDraggedOppId(null);
  };

  return (
    <div className="flex flex-col gap-4">


      <div className="flex space-x-4 overflow-x-auto pb-4 items-start select-none">

        {pipelines.map(stage => {
          const stageOpps = applyFilters(
            opportunities.filter(
              o => o.stage?.toLowerCase() === stage.name?.toLowerCase()
            ),
            "opportunities"
          );
          const totalValue = stageOpps.reduce((sum, opp) => sum + opp.dealValue, 0);
          console.log("Pipelines:", pipelines);
          console.log("Opportunities:", opportunities);
          return (
            <div
              key={stage.id}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.id)}
              className="w-72 shrink-0 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col max-h-160"
            >

              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                <div className="min-w-0">
                  <h4 className="font-bold text-xs text-txt-primary truncate" title={stage.name}>
                    {stage.name}
                  </h4>
                  <p className="text-[10px] text-txt-secondary mt-0.5">₹{totalValue.toLocaleString()}</p>
                </div>

                {/* Controls for stage (Super Admin limits) */}
                {user?.role === 'Super Admin' && (
                  <div className="flex items-center space-x-1 shrink-0 ml-1">
                    <button
                      onClick={() => onReorderStage(stage.id, 'left')}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                      title="Move Stage Left"
                    >
                      <ChevronRight className="w-3 h-3 rotate-180" />
                    </button>
                    <button
                      onClick={() => onReorderStage(stage.id, 'right')}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                      title="Move Stage Right"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onDeleteStage(stage.id)}
                      className="p-1 hover:bg-slate-200 rounded text-rose-500 cursor-pointer"
                      title="Delete Stage"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>


              <div className="flex-1 overflow-y-auto space-y-3 min-h-24">
                {stageOpps.map(opp => (
                  <div
                    key={opp.id}
                    draggable
                    onDragStart={() => handleDragStart(opp.id)}
                    onClick={() => setSelectedOpp(opp)}
                    className="bg-card border border-border-crm rounded-xl p-4 shadow-xs hover:shadow-md hover:border-primary/50 transition-all cursor-pointer text-txt-primary"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] text-slate-400 font-semibold">{opp.company}</span>

                    </div>

                    <h5 className="font-bold text-xs text-txt-primary mb-3 leading-tight">{opp.customerName}</h5>

                    <div className="flex items-center justify-between text-xs border-t border-border-crm pt-3">
                      <span className="font-extrabold text-primary">₹{opp.dealValue.toLocaleString()}</span>
                      <div className="flex items-center space-x-1">
                        <span className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase select-none">
                          {opp.assignedSalesperson.substr(0, 2)}
                        </span>
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
        // Find associated lead in leads list or construct from opportunity
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
          assignedUser: selectedOpp.assignedSalesperson || 'Kyle Reese',
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
              className="relative w-full max-w-md bg-card shadow-2xl border border-border-crm rounded-3xl p-6 flex flex-col z-10 text-txt-primary animate-in fade-in zoom-in-95 duration-200"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center pb-4 border-b border-border-crm shrink-0 mb-6">
                <h3 className="font-extrabold text-sm tracking-tight text-txt-primary flex items-center gap-2">
                  <Briefcase className="w-4.5 h-4.5 text-primary" /> Opportunity Detailed Profile
                </h3>
                <button
                  onClick={() => setSelectedOpp(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-400 hover:text-txt-primary transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Modal Body (Styled exactly like the Lead detailed timeline card in LeadsView) */}
              <div className="space-y-6 flex-1 overflow-y-auto">
                {/* Header profile details */}
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-150 dark:border-border-crm rounded-xl p-4 space-y-2">
                  <div className="space-y-1">
                    <p className="text-slate-400 font-semibold uppercase text-[10px]">Contact Name</p>
                    <input
                      type="text"
                      value={contactName}
                      readOnly
                      className="w-full border border-border-crm bg-bg-main dark:bg-slate-900 rounded-lg px-3 py-2 font-bold text-xs focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400 font-semibold uppercase text-[10px]">Company</p>
                    <input
                      type="text"
                      value={company}
                      readOnly
                      className="w-full border border-border-crm bg-bg-main dark:bg-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <span className="bg-blue-50 dark:bg-blue-950/40 text-primary border border-blue-100 dark:border-blue-900 text-[10px] px-2.5 py-0.5 rounded font-semibold">
                      {category}
                    </span>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] px-2.5 py-0.5 rounded font-semibold">
                      {associatedLead.source || 'Opportunity'}
                    </span>
                  </div>
                </div>


                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-slate-400 font-semibold uppercase text-[10px] mb-1">Email</p>
                    <input
                      type="email"
                      value={email}
                      readOnly
                      className="w-full border border-border-crm bg-bg-main dark:bg-slate-900 rounded-lg px-3 py-2 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-slate-400 font-semibold uppercase text-[10px] mb-1">Phone</p>
                    <input
                      type="text"
                      value={phone}
                      readOnly
                      className="w-full border border-border-crm bg-bg-main dark:bg-slate-900 rounded-lg px-3 py-2 focus:outline-none"
                    />
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold uppercase text-[10px] mb-1">Assigned Representative</p>
                    <p className="font-bold text-txt-primary mt-0.5 text-xs">{assignedUser}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold uppercase text-[10px] mb-1">Service Type</p>
                    <p className="font-bold text-txt-primary mt-0.5 text-xs">{serviceType}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold uppercase text-[10px] mb-1">Lead Sync Status</p>
                    <p className="font-bold text-txt-primary mt-0.5 text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                      {status}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold uppercase text-[10px] mb-1">Created At</p>
                    <p className="font-bold text-txt-primary mt-0.5 text-xs flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {createdAt}
                    </p>
                  </div>
                </div>
              </div>
              <br></br>
              {/* Modal Footer */}
              <button
                className="w-full mb-3 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-xl font-semibold cursor-pointer"
                onClick={() => setShowQuotationForm(true)}
              >
                New Quotation
              </button>
              <div className="border-t border-border-crm pt-4 mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedOpp(null)}
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-6 py-2.5 rounded-xl shadow transition cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {
    showQuotationForm &&
    selectedOpp && (
        <QuotationForm
            opportunity={selectedOpp}
            onClose={() => setShowQuotationForm(false)}
        />
    )
}
    </div>
  );
}
