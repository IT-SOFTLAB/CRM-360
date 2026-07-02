import React from 'react';
import { Check, ChevronRight, Plus, Pencil } from 'lucide-react';
import ReferralDetailsDrawer from "./ReferralDetailsDrawer";


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
onPayReward: (rewardId: string) => void;
  onDeleteReferral: (id: string) => void;

onMoveReferral: (
    referralId: string,
    stageId: string
) => void;

onOpenReferral: (id: string) => void;

onAddStage: (
    stageName:string
)=>Promise<void>;

onDeleteStage: (stageId: string) => void;

onReorderStage: (
    stageId: string,
    direction: "left" | "right"
) => void;

 selectedReferral: any;

  loadReferralDetails: (
    id: string
  ) => Promise<void>;


dashboard: any;

onRenameStage: (
    stageId: string,
    name: string
) => void;

onSetFinalStage: (
    stageId:string
)=>void;
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

onPayReward,

onDeleteReferral,

onMoveReferral,

onOpenReferral,

onAddStage,

onDeleteStage,
onRenameStage,
onReorderStage,

onSetFinalStage,
selectedReferral,

loadReferralDetails,

dashboard
}: ReferralsViewProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReferral(referralForm);
  };


  const [showReferralDrawer, setShowReferralDrawer] =
React.useState(false);

const [statusFilter, setStatusFilter] = React.useState("All");

const [search, setSearch] = React.useState("");

const [showStageModal, setShowStageModal] = React.useState(false);

const [showRenameModal, setShowRenameModal] = React.useState(false);

const [stageName, setStageName] = React.useState("");

const [selectedStage, setSelectedStage] = React.useState<any>(null);

const filteredReferrals = referrals.filter((ref) => {

    const query = search.toLowerCase();

    return (

        ref.referrerName?.toLowerCase().includes(query) ||

        ref.referrerCompany?.toLowerCase().includes(query) ||

        ref.referredLeadName?.toLowerCase().includes(query) ||

        ref.referredCompany?.toLowerCase().includes(query)

    );

});

  return (
    <div className="space-y-6 text-xs text-slate-800 dark:text-slate-200">
      
      {/* KPI Referral Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        
        <div className="bg-card rounded-2xl p-5 border border-border-crm shadow-xs">
          <p className="text-xs font-bold text-txt-secondary uppercase tracking-wide">Total Referrers</p>
          <h3 className="text-2xl font-extrabold text-txt-primary mt-1">
            {dashboard?.totalReferrals || 0}
          </h3>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border-crm shadow-xs">
          <p className="text-xs font-bold text-txt-secondary uppercase tracking-wide">Pending Rewards</p>
          <h3 className="text-2xl font-extrabold text-success mt-1">
           ₹{dashboard?.pendingRewardAmount || 0}
          </h3>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border-crm shadow-xs">
          <p className="text-xs font-bold text-txt-secondary uppercase tracking-wide">Qualified Leads</p>
          <h3 className="text-2xl font-extrabold text-warning mt-1">
            {dashboard?.qualifiedLeads || 0}
          </h3>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border-crm shadow-xs">
          <p className="text-xs font-bold text-txt-secondary uppercase tracking-wide">Conversions</p>
          <h3 className="text-2xl font-extrabold text-primary mt-1">
            {dashboard?.conversions || 0}
          </h3>
        </div>

      </div>

      {/* Workflow Diagram */}
     {/* Custom Referral Pipeline */}

<div className="bg-card border border-border-crm rounded-2xl p-5">

    <div className="flex justify-between items-center mb-4">

        <h3 className="font-bold text-xl text-slate-700">

            Referral Pipeline

        </h3>

        <button

            onClick={() => {
              setStageName("");
              setShowStageModal(true);
            }}

            className="bg-primary text-white px-3 py-2 rounded-lg text-xs"

        >

            + Add Stage

        </button>

    </div>

    <div className="flex gap-4 overflow-x-auto pb-2">

        {referralPipelines.map((stage) => (

            <div

                key={stage.id}

                className="min-w-[220px] border-black rounded-xl p-4 bg-slate-50 dark:bg-slate-100"

            >

                <div className="flex justify-between items-center">

                    <h4 className="font-bold text-slate-900">

                        {stage.name}

                    </h4>

                    {stage.isFinal && (

                        <span className="text-green-600 text-xs">

                            Final

                        </span>

                    )}

                </div>

                <p className="text-xs text-gray-800 mt-1">

                   {stage.totalReferrals === 0
    ? "No Referrals"
    : `${stage.totalReferrals} Referrals`}

                </p>

    <div className="flex flex-wrap gap-2 mt-4">

    {/* Rename */}

    <button

       onClick={() => {

    setSelectedStage(stage);

    setStageName(stage.name);

    setShowRenameModal(true);

}}
        className="px-2 py-1 rounded border-black border-1 bg-white text-slate-600 text-xs"

    >

     Rename

    </button>

    {/* Final Stage */}

    {

        stage.isFinal ?

        (

            <span className="px-2 py-1 rounded bg-white text-slate-600 border-1 border-black text-xs">

                ✔ Final

            </span>

        )

        :

        (

            <button

                onClick={() =>

                    onSetFinalStage(
                        stage.id
                    )

                }

                className="px-2 py-1 rounded bg-white text-slate-600 border-1 border-black text-xs"

            >

                Set Final

            </button>

        )

    }

    {/* Left */}

    <button

        onClick={() =>

            onReorderStage(
                stage.id,
                "left"
            )

        }

        className="px-2 py-1 rounded bg-gray-500 border-1 border-black"

    >

        ←

    </button>

    {/* Right */}

    <button

        onClick={() =>

            onReorderStage(
                stage.id,
                "right"
            )

        }

        className="px-2 py-1 rounded bg-gray-500 border-1 border-black"

    >

        →

    </button>

    {/* Delete */}

    <button

        onClick={() => {

            if (

                window.confirm(

                    "Delete this stage?"

                )

            ) {

                onDeleteStage(stage.id);

            }

        }}

        className="px-2 py-1 rounded border-1 bg-slate-200 text-black"

    >

        Delete

    </button>

</div>
            </div>

        ))}

    </div>

</div>

      {/* Referrals table list */}
      <div className="bg-card border border-border-crm rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border-crm bg-bg-main flex justify-between items-center">
          <input
    type="text"
    placeholder="Search Referrer, Lead or Company..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="border border-border-crm rounded-xl px-3 py-2 text-xs w-72 bg-white dark:bg-slate-800"
/>

          <span className="font-bold text-xs text-txt-primary">Submitted Referrals Log</span>
     
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-main border-b border-border-crm font-bold text-txt-secondary uppercase tracking-wider">
                <th className="px-6 py-4">Referrer Client</th>
                <th className="px-6 py-4">Referred Contact</th>
                <th className="px-6 py-4 ">Incentive Type</th>
                <th className="px-6 py-4">Stage</th>
                <th className="px-6 py-4">Action</th>

                
              </tr>
            </thead>
           <tbody className="divide-y divide-border-crm">

{filteredReferrals.map(ref => (

<tr className="cursor-pointer hover:bg-slate-50"
    key={ref.id}
   onClick={async () => {
    await loadReferralDetails(ref.id);
    setShowReferralDrawer(true);
}}
  
>

<td className="px-6 py-4">

<div className="font-semibold text-slate-600">

{ref.referrerName}

</div>

<div className="text-xs text-slate-500">

{ref.referrerCompany}

</div>

</td>

<td className="px-6 py-4">

<div className="text-xs text-slate-500">

{ref.referredLeadName}

</div>

<div className="text-xs text-slate-500">

{ref.referredCompany}

</div>

</td>

<td className="px-6 py-4">

<div className="text-xs text-slate-600">

{ref.rewardType}

</div>

<div className="text-xs text-slate-700">

₹{ref.rewards?.[0]?.amount || 0}

</div>

</td>

<td className="px-6 py-4">

<select

value={ref.currentStageId}

onClick={(e)=>e.stopPropagation()}

onChange={async (e) => {
    const stageId = e.target.value;

    // update UI immediately
    ref.currentStageId = stageId;

    // then save
    await onMoveReferral(ref.id, stageId);
}}

className="border border-border-crm rounded-lg px-2 py-1 bg-white dark:bg-slate-800 text-xs"

>

{

referralPipelines.map(stage=>(

<option

key={stage.id}

value={stage.id}

>

{stage.name}

</option>

))

}

</select>

</td>

<td className="px-6 py-4">

<div className="flex flex-col gap-2">

{!ref.rewards?.[0]?.approved ? (

<>

<span className="text-xs bg-gray-100 text-center text-black border-1 rounded px-2 py-1 hover:bg-slate-200">

Pending Approval

</span>

<button

onClick={(e)=>{

e.stopPropagation();

onApproveReward(

ref.rewards[0].id

);

}}

className=" bg-gray-100 text-black border-1 rounded px-2 py-1 hover:bg-slate-200"

>

Approve

</button>

</>

)

:

!ref.rewards?.[0]?.paid ?

(

<>

<span className="text-xs text-center hover:bg-slate-300 border-1 border-black text-black rounded px-2 py-1">

Approved

</span>

<button

onClick={(e)=>{

e.stopPropagation();

onPayReward(

ref.rewards[0].id

);

}}

className="bg-white text-black text-center hover:bg-slate-300 border-1 border-black  rounded px-2 py-1"

>

Pay

</button>




</>



)

:

(

<span className="bg-gray-100 text-center text-black border-1 hover:bg-slate-300  rounded px-2 py-1">

Paid

</span>

)}


<button
    onClick={(e) => {
        e.stopPropagation();

        if (window.confirm("Delete this referral?")) {
            onDeleteReferral(ref.id);
        }
    }}
    className="bg-red-400 text-white rounded px-2 py-1 text-xs"
>
    Delete
</button>

</div>
</td>

</tr>

))}



{filteredReferrals.length === 0 && (
    <tr>
        <td
            colSpan={5}
            className="text-center py-12 text-slate-400"
        >
            <div className="flex flex-col items-center py-10">

                <div className="text-5xl mb-4">
                    📋
                </div>

                <h3 className="font-semibold text-lg">
                    No Referrals Yet
                </h3>

                <p>
                    Create your first referral.
                </p>

            </div>
        </td>
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

referrerId: oppObj?.id,

referrerName:e.target.value,

referrerCompany:oppObj?.company || ""

})
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

   <div>
  <label className="block text-slate-400 font-semibold mb-1">
    Referred Email
  </label>

  <input
    type="email"
    className="w-full border border-border-crm bg-bg-main rounded-xl px-3 py-2"
    value={referralForm.referredEmail}
    onChange={(e) =>
      setReferralForm({
        ...referralForm,
        referredEmail: e.target.value,
      })
    }
  />
</div>




<div>

<label className="block text-slate-400 font-semibold mb-1">

Phone

</label>

<input

type="text"

className="w-full border border-border-crm rounded-xl px-3 py-2"

value={referralForm.referredPhone}

onChange={(e)=>

setReferralForm({

...referralForm,

referredPhone:e.target.value

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
                   <option value="Cash">
Cash Incentive
</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Reward Value</label>
                  <input
                    type="number" required
                    className="w-full border border-border-crm bg-bg-main rounded-xl px-3 py-2 text-txt-primary focus:outline-none bg-white dark:bg-slate-800"
                    value={referralForm.rewardValue}
                    onChange={(e)=>

setReferralForm({

...referralForm,

rewardValue:Number(e.target.value)

})

}
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

      
<ReferralDetailsDrawer
    open={showReferralDrawer}
    referral={selectedReferral}
    onClose={() => setShowReferralDrawer(false)}
/>

{ showStageModal && (
<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

<div className="bg-card rounded-2xl w-full max-w-md p-6">

<h3 className="text-lg font-semibold mb-5 text-slate-600">

Add Pipeline Stage

</h3>

<input

type="text"

placeholder="Stage Name"

value={stageName}

onChange={(e)=>setStageName(e.target.value)}

className="w-full border rounded-xl px-3 py-2 mb-5 border-1 text-slate-600"

/>

<div className="flex justify-end gap-3">

<button

onClick={()=>setShowStageModal(false)}

className="border rounded-xl px-4 py-2 text-slate-500 hover:bg-red-300 border-1 border-black"

>

Cancel

</button>

<button

onClick={async()=>{

if (!stageName.trim()) return;

await onAddStage(stageName);

setStageName("");

setShowStageModal(false);

setShowStageModal(false);

}}

className="bg-primary text-white rounded-xl px-4 py-2"

>

Create Stage

</button>

</div>

</div>

</div>
)}


{showRenameModal && (

<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

<div className="bg-card rounded-2xl w-full max-w-md p-6">

<h3 className="text-lg font-semibold mb-5 text-gray-600">

Rename Stage

</h3>

<input

type="text"

value={stageName}

onChange={(e)=>setStageName(e.target.value)}

className="w-full border rounded-xl px-3 py-2 mb-5"

/>

<div className="flex justify-end gap-3">

<button

onClick={()=>setShowRenameModal(false)}

className="border rounded-xl px-4 py-2 border-1 border-black hover:bg-red-300 text-black"

>

Cancel

</button>

<button

onClick={async()=>{

if (!selectedStage) return;

if (!stageName.trim()) return;

await onRenameStage(
    selectedStage.id,
    stageName
);

setStageName("");

setSelectedStage(null);

setShowRenameModal(false);

}}

className="bg-primary text-white rounded-xl px-4 py-2"

>

Save

</button>

</div>

</div>

</div>

)}

    </div>
  );
}
