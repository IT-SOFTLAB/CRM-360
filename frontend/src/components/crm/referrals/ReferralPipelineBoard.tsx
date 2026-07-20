import React from "react";
import { Plus } from "lucide-react";
import {
  DragDropContext,
  DropResult,
} from "@hello-pangea/dnd";
import ReferralStageColumn from "./ReferralStageColumn";

interface Props {
  referrals: any[];
  stages: any[];

  onMoveReferral: (
    id: string,
    stageId: string
  ) => void;

  onDeleteStage: (
    id: string
  ) => void;

  onAddStage: () => void;

  onOpenReferral: (
    referral: any
  ) => void;
}

export default function ReferralPipelineBoard({
  referrals,
  stages,
  onMoveReferral,
  onDeleteStage,
  onAddStage,
  onOpenReferral,
}: Props) {

  const onDragEnd = (
    result: DropResult
  ) => {

    if (!result.destination) return;

    if (
      result.destination.droppableId ===
      result.source.droppableId
    )
      return;

    onMoveReferral(
      result.draggableId,
      result.destination.droppableId
    );
  };

  return (
    <div className="bg-card border border-border-crm rounded-2xl shadow-xs p-5">

      <div className="flex justify-between items-center mb-5">

        <div>

          <h3 className="font-bold text-sm text-blue-900">
            Retention Pipeline
          </h3>

          <p className="text-xs text-black">
            Manage referral workflow visually
          </p>

        </div>

        <button
          onClick={onAddStage}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl"
        >
          <Plus size={16} />
          Add Stage
        </button>

      </div>

      <DragDropContext onDragEnd={onDragEnd}>

        <div className="flex gap-5 overflow-x-auto pb-2">

         {(stages ?? []).map((stage) => {
  const stageReferrals = (referrals ?? []).filter(
    (r) => r.currentStageId === stage.id
  );

  console.log("Stage:", stage.name);
  console.log("Stage ID:", stage.id);
  console.log("Stage Referrals:", stageReferrals);

  return (
    <ReferralStageColumn
      key={stage.id}
      stage={stage}
      stages={stages}
      referrals={stageReferrals}
      onMoveReferral={onMoveReferral}
      onDeleteStage={onDeleteStage}
      onOpenReferral={onOpenReferral}
    />
  );
})}

        </div>

      </DragDropContext>

    </div>
  );
}