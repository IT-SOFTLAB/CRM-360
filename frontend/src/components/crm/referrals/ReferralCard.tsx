import React from "react";
import {
  Building2,
  Calendar,
  IndianRupee,
  MoveRight,
  User,
} from "lucide-react";
import { Draggable } from "@hello-pangea/dnd";

interface Props {
  referral: any;
  stages: any[];
  index: number;

  onMoveReferral: (
    id: string,
    stageId: string
  ) => void;

  onOpenReferral: (
    referral: any
  ) => void;
}

export default function ReferralCard({
  referral,
  stages,
  index,
  onMoveReferral,
  onOpenReferral,
}: Props) {
  return (
    <Draggable
      draggableId={referral.id}
      index={index}
    >
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onOpenReferral(referral)}
          className="bg-card border border-border-crm rounded-xl p-4 shadow-sm hover:shadow-md cursor-pointer transition-all"
        >
          {/* Referrer */}

          <div className="flex items-center gap-2 mb-3 text-black">
            <User size={15} />

            <span className="font-semibold text-sm text-gray-700">
              {referral.referrerName || "-"}
            </span>
          </div>

          {/* Company */}

          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 text-blue-600">
            <Building2 size={14} />

            {referral.referredCompany || "-"}
          </div>

          {/* Referred Lead */}

          <div className="flex items-center gap-2 text-xs mb-3 text-black">
            <User size={14} />

            <span className="font-medium text-gray-800">
              {referral.referredLeadName || "-"}
            </span>
          </div>

          {/* Current Stage */}

          <div className="mb-3">
            <span
              className="px-2 py-1 rounded-full text-[10px] text-white"
              style={{
                background:
                  referral.currentStage?.color ||
                  "#3B82F6",
              }}
            >
              {referral.currentStage?.name}
            </span>
          </div>

          {/* Reward */}

          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-1 font-semibold text-primary">
              <IndianRupee size={14} />

              {Number(
                referral.rewardValue || 0
              ).toLocaleString()}
            </div>

            {referral.rewardApproved ? (
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Approved
              </span>
            ) : (
              <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                Pending
              </span>
            )}
          </div>

          {/* Creator salesperson */}
          {referral.createdBy && (
            <div className="text-[10px] bg-bg-main border border-border-crm/45 text-txt-secondary px-2.5 py-1.5 rounded-lg mb-3 flex items-center gap-1 font-semibold select-none">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">By:</span> {referral.createdBy}
            </div>
          )}

          {/* Stage Dropdown */}

          <div
            className="mb-3 text-slate-700"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <select
              value={referral.currentStageId}
              onChange={(e) =>
                onMoveReferral(
                  referral.id,
                  e.target.value
                )
              }
              className="w-full border border-border-crm rounded-xl px-3 py-2 text-xs bg-background"
            >
              {(stages ?? []).map((stage) => (
                <option
                  key={stage.id}
                  value={stage.id}
                >
                  {stage.name}
                </option>
              ))}
            </select>
          </div>

          {/* Footer */}

          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <div className="flex items-center gap-1 text-slate-800">
              <Calendar size={13} />

              {new Date(
                referral.createdAt
              ).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </div>

            <div className="flex items-center gap-1 text-primary font-medium">
              Details

              <MoveRight size={14} />
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}