import React from 'react';
import { Check, ChevronRight, Plus } from 'lucide-react';

interface ReferralsViewProps {
  referrals: any[];
  opportunities: any[];
  referralPipelines: any[];
  user: any;
  showReferralModal: boolean;
  setShowReferralModal: (val: boolean) => void;
  referralForm: any;
  setReferralForm: (form: any) => void;
  onSubmitReferral: (form: any) => void;
  onApproveReward: (id: string) => void;
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
  onApproveReward
}: ReferralsViewProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReferral(referralForm);
  };

  return (
    <div className="space-y-6 text-xs text-slate-800 dark:text-slate-200">
      
      {/* KPI Referral Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        
        <div className="bg-card rounded-2xl p-5 border border-border-crm shadow-xs">
          <p className="text-xs font-bold text-txt-secondary uppercase tracking-wide">Total Referrers</p>
          <h3 className="text-2xl font-extrabold text-txt-primary mt-1">
            {new Set(referrals.map(r => r.referrerName)).size}
          </h3>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border-crm shadow-xs">
          <p className="text-xs font-bold text-txt-secondary uppercase tracking-wide">Total Incentives Paid</p>
          <h3 className="text-2xl font-extrabold text-success mt-1">
            ₹{(referrals.filter(r => r.rewardApproved).length * 1000).toLocaleString()}
          </h3>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border-crm shadow-xs">
          <p className="text-xs font-bold text-txt-secondary uppercase tracking-wide">Qualified Leads</p>
          <h3 className="text-2xl font-extrabold text-warning mt-1">
            {referrals.filter(r => r.stage !== 'rp_5').length}
          </h3>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border-crm shadow-xs">
          <p className="text-xs font-bold text-txt-secondary uppercase tracking-wide">Conversions</p>
          <h3 className="text-2xl font-extrabold text-primary mt-1">
            {referrals.filter(r => r.stage === 'rp_4' || r.stage === 'rp_5').length}
          </h3>
        </div>

      </div>

      {/* Workflow Diagram */}
      <div className="bg-card border border-border-crm rounded-2xl p-5 flex flex-col md:flex-row items-center justify-around gap-4 text-center">
        <div className="p-3 bg-blue-50 dark:bg-slate-200 border border-blue-100 dark:border-slate-700 rounded-xl w-44">
          <span className="font-extrabold text-primary dark:text-blue-400">Won Client</span>
          <p className="text-[10px] text-txt-secondary mt-1">Client deal marked Won</p>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400 rotate-90 md:rotate-0" />
        <div className="p-3 bg-blue-50 dark:bg-slate-200 border border-blue-100 dark:border-slate-700 rounded-xl w-44">
          <span className="font-extrabold text-primary dark:text-blue-400">Auto Enrolled</span>
          <p className="text-[10px] text-txt-secondary mt-1">Client gains referral code</p>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400 rotate-90 md:rotate-0" />
        <div className="p-3 bg-blue-50 dark:bg-slate-200 border border-blue-100 dark:border-slate-700 rounded-xl w-44">
          <span className="font-extrabold text-primary dark:text-blue-400">Referral Submitted</span>
          <p className="text-[10px] text-txt-secondary mt-1">New lead is registered</p>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400 rotate-90 md:rotate-0" />
        <div className="p-3 bg-success/10 border border-emerald-250 dark:border-emerald-200 rounded-xl w-44">
          <span className="font-extrabold text-success">Reward Approved</span>
          <p className="text-[10px] text-txt-secondary mt-1">Receive credit incentive</p>
        </div>
      </div>

      {/* Referrals table list */}
      <div className="bg-card border border-border-crm rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border-crm bg-bg-main flex justify-between items-center">
          <span className="font-bold text-xs text-txt-primary">Submitted Referrals Log</span>
          <button
            onClick={() => setShowReferralModal(true)}
            className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center space-x-1 shadow transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Submit Referral</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-main border-b border-border-crm font-bold text-txt-secondary uppercase tracking-wider">
                <th className="px-6 py-4">Referrer Client</th>
                <th className="px-6 py-4">Referred Contact</th>
                <th className="px-6 py-4 text-right">Incentive Type</th>
                <th className="px-6 py-4">Stage</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-crm">
              {referrals.map(ref => (
                <tr key={ref.id} className="hover:bg-slate-50 dark:hover:bg-slate-200 transition text-txt-primary font-medium">
                  <td className="px-6 py-4">
                    <div className="font-bold">{ref.referrerName}</div>
                    <div className="text-[10px] text-slate-400">{ref.referrerCompany}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div>{ref.referredLeadName}</div>
                    <div className="text-[10px] text-slate-400">{ref.referredCompany}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-bold text-primary dark:text-blue-400">{ref.rewardValue}</div>
                    <div className="text-[10px] text-txt-secondary">{ref.rewardType}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      ref.stage === 'rp_5' ? 'bg-emerald-50 border-emerald-200 text-success' : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}>
                      {referralPipelines.find(p => p.id === ref.stage)?.name || ref.stage}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {!ref.rewardApproved ? (
                      <button
                        onClick={() => onApproveReward(ref.id)}
                        className="bg-success hover:bg-emerald-600 text-white rounded px-2.5 py-1 font-bold text-[10px] cursor-pointer"
                      >
                        Approve Reward
                      </button>
                    ) : (
                      <span className="text-success font-bold flex items-center"><Check className="w-3 h-3 mr-0.5" /> Approved</span>
                    )}
                  </td>
                </tr>
              ))}
              {referrals.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">No referrals submitted.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                      referrerName: e.target.value,
                      referrerCompany: oppObj ? oppObj.company : ''
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
                  value={referralForm.referredLeadName}
                  onChange={e => setReferralForm({ ...referralForm, referredLeadName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Referred Company</label>
                <input
                  type="text" required
                  className="w-full border border-border-crm bg-bg-main rounded-xl px-3 py-2 text-txt-primary focus:outline-none bg-white dark:bg-slate-800"
                  value={referralForm.referredCompany}
                  onChange={e => setReferralForm({ ...referralForm, referredCompany: e.target.value })}
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
                    value={referralForm.rewardValue}
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
