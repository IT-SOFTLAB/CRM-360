"use client";

import React from "react";
import {
  X,
  User,
  Building2,
  Mail,
  Phone,
  Gift,
  Calendar,
  Hash,
  CheckCircle,
  Clock,
  Trash2
} from "lucide-react";

interface Props {
  referral: any;
  open: boolean;
  onClose: () => void;

  onApproveReward: (id: string) => void;
  onPayReward: (id: string) => void;

  onDeleteReferral: (id: string) => void;
}


export default function ReferralDetailsDrawer({

  referral,

  open,

  onClose,

  onApproveReward,
  onPayReward,

  onDeleteReferral

}: Props) {

  if (!open || !referral) return null;

  return (

    <>

      {/* Backdrop */}

      <div

        className="fixed inset-0 bg-black/40 z-40 text-red-500"

        onClick={onClose}

      />

      {/* Drawer */}

      <div className="fixed top-0 right-0 w-[470px] max-w-full h-screen bg-card shadow-2xl z-50 flex flex-col text-black">

        {/* Header */}

        <div className="flex justify-between items-center border-b border-border-crm px-6 py-5">

          <div>

            <h2 className="font-bold text-lg text-blue-800">

              Referral Details

            </h2>

            <p className="text-xs text-muted-foreground text-txt-primary">

              {referral.referralCode}

            </p>

          </div>

          <button onClick={onClose}>

            <X size={20} />

          </button>

        </div>

        {/* Scroll */}

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Referrer */}

          <div className="bg-muted/30 rounded-xl p-4">

            <div className="font-semibold mb-3 text-txt-primary">

              Referrer

            </div>

            <div className="space-y-3 text-sm">

              <div className="flex items-center gap-2 text-txt-primary">

                <User size={15} />

                {referral.referrerName}

              </div>

              <div className="flex items-center gap-2 text-txt-primary">

                <Building2 size={15} />

                {referral.referrerCompany}

              </div>

            </div>

          </div>

          {/* Referred Lead */}

          <div className="bg-muted/30 rounded-xl p-4">

            <div className="font-semibold mb-3 text-txt-primary ">

              Referred Lead

            </div>

            <div className="space-y-3 text-sm">

              <div className="flex items-center gap-2 text-txt-primary">

                <User size={15} />

                {referral.referredLeadName}

              </div>

              <div className="flex items-center gap-2 text-txt-primary">

                <Building2 size={15} />

                {referral.referredCompany}

              </div>

              <div className="flex items-center gap-2 text-txt-primary">

                <Mail size={15} />

                {referral.referredEmail || "-"}

              </div>

              <div className="flex items-center gap-2 text-blue-600">

                <Phone size={15} />

                {referral.referredPhone || "-"}

              </div>

            </div>

          </div>

          {/* Reward */}

          <div className="bg-muted/30 rounded-xl p-4">

            <div className="font-semibold mb-3 text-txt-primary">

              Reward

            </div>

            <div className="space-y-3 text-sm">

              <div className="flex items-center gap-2 text-txt-primary">

                <Gift size={15} />

                {referral.rewardType}

              </div>

              <div className="text-red-400">

                ₹ {referral.rewardValue}

              </div>

              <div>
                {referral.referralRewards?.some((r: any) => r.paid) ? (
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                    Paid
                  </span>
                ) : referral.rewardApproved ? (
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                    Approved
                  </span>
                ) : (
                  <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">
                    Pending
                  </span>
                )}
              </div>

            </div>

          </div>

          {/* Stage */}

          <div className="bg-muted/30 rounded-xl p-4">

            <div className="font-semibold mb-3 text-txt-primary">

              Current Stage

            </div>

            <div className="flex items-center gap-2 text-txt-primary">

              <Hash size={15} />

              {referral.currentStage?.name}

            </div>

          </div>

          {/* Timeline */}

          <div className="bg-muted/30 rounded-xl p-4">

            <div className="font-semibold mb-4 text-green-600 ">

              Timeline

            </div>

            <div className="space-y-4 text-txt-primary">

              {

                referral.referralHistories?.map(

                  (history: any) => (

                    <div

                      key={history.id}

                      className="flex gap-3"

                    >

                      <Clock

                        size={16}

                        className="mt-1"

                      />

                      <div>

                        <div className="font-medium text-txt-primary">

                          {history.pipeline?.name}

                        </div>

                        <div className="text-xs text-muted-foreground text-txt-primary">

                          {history.remarks}

                        </div>

                        <div className="text-xs text-muted-foreground text-txt-primary">

                          {

                            new Date(

                              history.createdAt

                            ).toLocaleString()

                          }

                        </div>

                      </div>

                    </div>

                  )

                )

              }

            </div>

          </div>

        </div>

        {/* Footer */}

        <div className="border-t border-border-crm p-5 flex gap-3 text-blue-600">

          {!referral.rewardApproved ? (
            <button
              onClick={() => onApproveReward(referral.id)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 flex items-center justify-center gap-2 font-bold cursor-pointer"
            >
              <CheckCircle size={18} />
              Approve Reward
            </button>
          ) : referral.referralRewards?.some((r: any) => r.paid) ? (
            <button
              disabled
              className="flex-1 bg-blue-100 text-blue-600 rounded-xl py-3 flex items-center justify-center gap-2 font-bold cursor-not-allowed"
            >
              <CheckCircle size={18} />
              Reward Paid
            </button>
          ) : (
            <button
              onClick={() => onPayReward(referral.id)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 flex items-center justify-center gap-2 font-bold cursor-pointer"
            >
              <Gift size={18} />
              Pay Reward
            </button>
          )}

          <button

            onClick={() =>

              onDeleteReferral(

                referral.id

              )

            }

            className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-5 flex items-center justify-center"

          >

            <Trash2 size={18} />

          </button>

        </div>

      </div>

    </>

  );

}