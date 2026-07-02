import React from "react";
import {
  X,
  User,
  Building2,
  Mail,
  Phone,
  Gift,
  MapPin,
  Clock,
  Hash
} from "lucide-react";

interface Props {
    referral: any;
    open: boolean;
    onClose: () => void;
}

export default function ReferralDetailsDrawer({
    referral,
    open,
    onClose
}: Props) {

    if (!open || !referral) return null;

    return (

        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">

            <div className="w-[560px] h-full bg-white shadow-2xl overflow-y-auto">

          <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">

                    <div>

<h2 className="text-2xl font-bold text-gray-800">

Referral Details

</h2>

<p className="text-sm text-gray-500 mt-1">

Complete customer referral information

</p>

</div >

                    <button onClick={onClose} className="text-red-600">
                        <X />
                    </button>

                </div>

               <div className="p-6 space-y-6">

    {/* Referral Information */}

    <div className="bg-white border border-gray-200 rounded-xl p-5">

        <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-4">

            <Hash size={18} />

            Referral Information

        </h3>

        <div className="grid grid-cols-2 gap-4 text-sm ">

            <div className="text-slate-500">
                Referral Code
            </div>

            <div className="font-medium text-slate-700">
                {referral.referralCode}
            </div>

            <div className="text-slate-500">
                Current Stage
            </div>

            <div>

                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs">

                    {referral.currentStage?.name}

                </span>

            </div>

        </div>

    </div>

    {/* Referrer */}

    <div className="bg-white border border-gray-200 rounded-xl p-5">

        <h3 className="font-semibold flex items-center gap-2 mb-4 text-black">

            <User size={18} />

            Referrer

        </h3>

        <div className="grid grid-cols-2 gap-4 text-sm">

            <div className="text-slate-500 ">
                Name
            </div>

            <div className="text-blue-700">{referral.referrerName}</div>

            <div className="text-slate-500">
                Company
            </div>

            <div  className="text-slate-600">{referral.referrerCompany}</div>

        </div>

    </div>

    {/* Referred Lead */}

    <div className="bg-white border border-gray-200 rounded-xl p-5">

        <h3 className="font-semibold flex items-center gap-2 mb-4 text-black">

            <Building2 size={18} />

            Referred Contact

        </h3>

        <div className="grid grid-cols-2 gap-4 text-sm">

            <div className="text-slate-500">
                Name
            </div>

            <div  className="text-slate-600">{referral.referredLeadName}</div>

            <div className="text-slate-500">
                Company
            </div>

            <div  className="text-slate-600">{referral.referredCompany}</div>

            <div className="text-slate-500 flex items-center gap-2">

                <Mail size={14} />

                Email

            </div>

            <div  className="text-slate-600">{referral.referredEmail}</div>

            <div className="text-slate-500 flex items-center gap-2">

                <Phone size={14} />

                Phone

            </div>

            <div  className="text-slate-600">{referral.referredPhone}</div>

        </div>

    </div>

            </div>

        </div>
       
<div className="overflow-y-auto">


<div className="bg-white border border-gray-200 rounded-xl p-5">

    <div>

    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">

        Referral Details

    </h2>

    <p className="text-2xl py-2 text-gray-800 ">

        Complete referral information

    </p>

</div >
    <div className="grid grid-cols-2 gap-4 text-sm py-2 overflow-y-auto">

        <div className="text-slate-700">
            Reward Type
        </div>

        <div className="text-blue-600">
            {referral.rewardType}
        </div>

        <div className="text-slate-700">
            Reward Amount
        </div>

        <div className="text-slate-600"> 
            ₹{referral.rewards?.[0]?.amount || 0}
        </div>

        <div className="text-slate-500">
            Approval
        </div>

        <div>

            <span
                className={`px-3 py-1 border-1 border-blue-500 rounded-full text-xs ${
                    referral.rewards?.[0]?.approved
                        ? "bg-green-50 border border-green-200 text-green-700"
                        : "bg-orange-50 border border-orange-200 text-orange-700"
                }`}
            >
                {referral.rewards?.[0]?.approved
                    ? "Approved"
                    : "Pending"}

            </span>

        </div>

        <div className="text-slate-500">
            Payment
        </div>

       

            <span
                className={`px-3 py-1 rounded-full text-xs ${
                    referral.rewards?.[0]?.paid
                        ? "bg-blue-50 border border-blue-200 text-blue-700"
                        : "bg-gray-200 text-gray-700"
                }`}
            >
                {referral.rewards?.[0]?.paid
                    ? "Paid"
                    : "Not Paid"}

            </span>

        

    </div>



{/* Timeline */}

<div className=" rounded-xl p-3 py-1">

    <h3 className="font-semibold flex items-center gap-2 mb-4 text-slate-800 dark:text-white">

        <Clock size={18} />

        Referral Timeline

    </h3>

    {referral.histories?.length > 0 ? (

        referral.histories.map((history: any) => (

            <div
                key={history.id}
              className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-3"
            >

                <div className="font-semibold text-slate-800 dark:text-white">

                    {history.pipeline?.name}

                </div>

                <div className="text-sm text-slate-500">

                    {history.remarks}

                </div>

                <div className="text-xs text-slate-400 mt-1">

                    {new Date(history.createdAt).toLocaleString()}

                </div>

            </div>

        ))

    ) : (

        <p className="text-sm text-slate-500">
            No timeline available.
        </p>

    )}

</div>
 </div>
</div>
</div>
    );

}