import React from "react";
import { Trash2 } from "lucide-react";
import { Droppable } from "@hello-pangea/dnd";
import ReferralCard from "./ReferralCard";

interface Props {
  stage: any;
  referrals: any[];
  stages: any[];

  onMoveReferral: (
    id: string,
    stageId: string
  ) => void;

  onDeleteStage: (
    id: string
  ) => void;

  onOpenReferral: (
    referral: any
  ) => void;
}

export default function ReferralStageColumn({
  stage,
  referrals,
  stages,
  onMoveReferral,
  onDeleteStage,
  onOpenReferral,
}: Props) {
  return (
    <div className="min-w-[320px] max-w-[320px] bg-muted/40 border border-border-crm rounded-2xl p-4 flex flex-col">

      {/* Header */}

      <div className="flex justify-between items-start mb-4">

        <div>

          <div className="flex items-center gap-2">

            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor:
                  stage.color || "#3B82F6",
              }}
            />

            <h3 className="font-semibold text-sm text-black">
              {stage.name}
            </h3>

          </div>

          <p className="text-xs text-muted-foreground mt-1 text-slate-700">
            {(referrals ?? []).length} Referral
            {(referrals ?? []).length !== 1 && "s"}
          </p>

        </div>

        {stage.sequence !== 1 && (
          <button
            onClick={() => onDeleteStage(stage.id)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 size={16} />
          </button>
        )}

      </div>

      <Droppable droppableId={stage.id}>

        {(provided) => (

          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="space-y-3 flex-1 min-h-[150px]"
          >

            {(referrals ?? []).length === 0 ? (

              <div className="border border-dashed rounded-xl p-6 text-center text-xs text-muted-foreground text-gray-600">

                No referrals

              </div>

            ) : (

              (referrals ?? []).map(
                (referral, index) => (

                  <ReferralCard
                    key={referral.id}
                    referral={referral}
                    index={index}
                    stages={stages}
                    onMoveReferral={onMoveReferral}
                    onOpenReferral={onOpenReferral}
                  />

                )
              )

            )}

            {provided.placeholder}

          </div>

        )}

      </Droppable>

    </div>
  );
}