import React, { useState } from "react";
import { Check, ChevronRight, Plus } from 'lucide-react';
import ReferralPipelineBoard from "./referrals/ReferralPipelineBoard";
import ReferralDetailsDrawer from "./referrals/ReferralDetailsDrawer";
import AddStageModal from "./referrals/AddStageModal";
interface ReferralsViewProps {

  referrals:any[];

  opportunities:any[];

  referralPipelines:any[];

  user:any;

  showReferralModal:boolean;

  setShowReferralModal:(val:boolean)=>void;

  referralForm:any;

  setReferralForm:(form:any)=>void;

  onSubmitReferral:(form:any)=>void;

  onApproveReward:(id:string)=>void;

  onDeleteReferral:(id:string)=>void;

  onMoveReferral:(

      id:string,

      stageId:string

  )=>void;

  onAddReferralStage:(

      stage:any

  )=>void;

  onDeleteReferralStage:(

      id:string

  )=>void;

  dashboard: any;

}

export default function ReferralsView({

    referrals,

    opportunities,

    referralPipelines,

    user,

    showReferralModal,

    setShowReferralModal,

    referralForm,

    setReferralForm,

    onSubmitReferral,

    onApproveReward,

    onDeleteReferral,

    onMoveReferral,

    onAddReferralStage,

    onDeleteReferralStage,

    dashboard

}: ReferralsViewProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReferral(referralForm);
  };

  const [selectedReferral, setSelectedReferral] = useState<any>(null);

const [showStageModal, setShowStageModal] = useState(false);

  return (
    <div className="space-y-6 text-xs text-slate-800 dark:text-slate-200">
      
    
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        
        <div className="bg-card rounded-2xl p-5 border border-border-crm shadow-xs">
          <p className="text-xs font-bold text-txt-secondary uppercase tracking-wide">Total Referrers</p>
          <h3 className="text-2xl font-extrabold text-txt-primary mt-1">
        {dashboard?.totalReferrals ?? 0}
          </h3>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border-crm shadow-xs">
          <p className="text-xs font-bold text-txt-secondary uppercase tracking-wide">Total Incentives Paid</p>
          <h3 className="text-2xl font-extrabold text-success mt-1">
      ₹{dashboard?.totalRewardsPaid ?? 0}
          </h3>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border-crm shadow-xs">
          <p className="text-xs font-bold text-txt-secondary uppercase tracking-wide">Qualified Leads</p>
          <h3 className="text-2xl font-extrabold text-warning mt-1">
         {
dashboard?.qualifiedLeads ?? 0
}
          </h3>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border-crm shadow-xs">
          <p className="text-xs font-bold text-txt-secondary uppercase tracking-wide">Conversions</p>
          <h3 className="text-2xl font-extrabold text-primary mt-1">
          {dashboard?.conversions ?? 0}
          </h3>
        </div>

      </div>

  
   

      {/* Referrals table list */}
     
   <ReferralPipelineBoard

    referrals={referrals}

    stages={referralPipelines}

    onMoveReferral={onMoveReferral}

    onDeleteStage={onDeleteReferralStage}

    onAddStage={() => setShowStageModal(true)}

    onOpenReferral={setSelectedReferral}

/>
     <ReferralDetailsDrawer

    referral={selectedReferral}

    open={!!selectedReferral}

    onClose={() => setSelectedReferral(null)}

    onApproveReward={onApproveReward}

    onDeleteReferral={onDeleteReferral}

/>

<AddStageModal

    open={showStageModal}

    onClose={() => setShowStageModal(false)}

    onCreate={onAddReferralStage}

/>


      {/* Submit Referral Modal */}
      {showReferralModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border-crm rounded-2xl shadow-2xl p-6 max-w-sm w-full text-txt-primary">
            <h4 className="font-bold text-sm tracking-tight mb-4">Submit Customer Referral</h4>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Referrer Name (Won Customer)</label>
                <select
                  className="w-full border border-border-crm bg-bg-main rounded-xl px-3 py-2 text-txt-primary focus:outline-none bg-white dark:bg-slate-800"
                  value={referralForm.referrerName}
                  onChange={e => {
                    const oppObj = opportunities.find(o => o.customerName === e.target.value);
                    setReferralForm({
  ...referralForm,

  referrerId: oppObj?.id || "",

  referrerName: oppObj?.customerName || "",

  referrerCompany: oppObj?.company || ""
});
                  }}
                >
                  <option value="">Select referrer</option>
                  {opportunities.filter(o => o.stageId === 'p_6').map(opp => (
                    <option key={opp.id} value={opp.customerName}>{opp.customerName} ({opp.company})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Referred Person Name</label>
                <input
                  type="text" required
                  className="w-full border border-border-crm bg-bg-main rounded-xl px-3 py-2 text-txt-primary focus:outline-none bg-white dark:bg-slate-600"
                value={referralForm.referredLeadName || ""}
                  onChange={e => setReferralForm({ ...referralForm, referredLeadName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Referred Company</label>
                <input
                  type="text" required
                  className="w-full border border-border-crm bg-bg-main rounded-xl px-3 py-2 text-txt-primary focus:outline-none bg-white dark:bg-slate-800"
                value={referralForm.referredCompany || ""}
                  onChange={e => setReferralForm({ ...referralForm, referredCompany: e.target.value })}
                />
              </div>

              <div>
  <label className="block text-slate-400 font-semibold mb-1">
    Referred Email
  </label>

  <input
    type="email"
    className="w-full border border-border-crm rounded-xl px-3 py-2"

   value={referralForm.referredEmail || ""}

    onChange={e =>
      setReferralForm({
        ...referralForm,
        referredEmail: e.target.value
      })
    }
  />
</div>

<div>
  <label className="block text-slate-400 font-semibold mb-1">
    Referred Phone
  </label>

  <input
    type="text"
    className="w-full border border-border-crm rounded-xl px-3 py-2"

  value={referralForm.referredPhone || ""}

    onChange={e =>
      setReferralForm({
        ...referralForm,
        referredPhone: e.target.value
      })
    }
  />
</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Reward Type</label>
                  <select
                    className="w-full border border-border-crm bg-bg-main rounded-xl px-3 py-2 text-txt-primary focus:outline-none bg-white dark:bg-slate-800"
                    value={referralForm.rewardType}
                    onChange={e => setReferralForm({ ...referralForm, rewardType: e.target.value })}
                  >
                    <option value="Credits">Credits</option>
                    <option value="Incentives">Cash Incentive</option>
                    <option value="Discount">Future Discount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Reward Value</label>
                  <input
                    type="text" required
                    className="w-full border border-border-crm bg-bg-main rounded-xl px-3 py-2 text-txt-primary focus:outline-none bg-white dark:bg-slate-800"
                   value={referralForm.rewardValue || ""}
                    onChange={e => setReferralForm({ ...referralForm, rewardValue: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button" onClick={() => setShowReferralModal(false)}
                  className="flex-1 border border-border-crm hover:bg-slate-50 rounded-xl py-2 font-semibold text-txt-primary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary-hover text-white rounded-xl py-2 font-semibold shadow cursor-pointer"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
