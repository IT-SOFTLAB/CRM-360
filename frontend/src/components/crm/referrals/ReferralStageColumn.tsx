import React from "react";
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react";
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

  onReorderStage?: (
    stageId: string,
    direction: 'left' | 'right'
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
  onReorderStage,
  onOpenReferral,
}: Props) {
  return (
    <div className="min-w-[320px] max-w-[320px] bg-muted/40 border border-border-crm rounded-2xl p-4 flex flex-col">

      {/* Header */}

      <div className="flex justify-between items-start mb-4">

        <div>

          <div className="flex items-center gap-2">

            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{
                backgroundColor:
                  stage.color || "#3B82F6",
              }}
            />

            <h3 className="font-semibold text-sm text-txt-primary truncate">
              {stage.name}
            </h3>

          </div>

          <p className="text-xs text-muted-foreground mt-1 text-txt-primary">
            {(referrals ?? []).length} Referral
            {(referrals ?? []).length !== 1 && "s"}
          </p>

        </div>

        {/* Controls for stage (Shift Left / Right / Delete) */}
        <div className="flex items-center space-x-1 shrink-0 ml-1">
          {onReorderStage && (
            <>
              <button
                onClick={() => onReorderStage(stage.id, 'left')}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 cursor-pointer"
                title="Move Stage Left"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onReorderStage(stage.id, 'right')}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 cursor-pointer"
                title="Move Stage Right"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {stage.sequence !== 1 && !['new', 'won', 'lost'].includes((stage.name || '').trim().toLowerCase()) && (
            <button
              onClick={() => onDeleteStage(stage.id)}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-red-500 cursor-pointer"
              title="Delete Stage"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

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