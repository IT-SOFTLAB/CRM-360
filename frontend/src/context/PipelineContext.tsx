"use client";
import React, {
  createContext,
  useContext,
  useState
} from "react";

import { pipelineService } from "../services/pipeline.service";
import { ReferralPipeline } from "../types/referralPipeline";
import { ToastContext } from "./ToastContext";

export interface PipelineContextType {
  stages: ReferralPipeline[];
  setStages: React.Dispatch<React.SetStateAction<ReferralPipeline[]>>;

  loadStages: () => Promise<void>;

  handleCreateStage: (stage: any) => Promise<void>;

  handleDeleteStage: (id: string) => Promise<void>;

  handleReorderStages: (stages: ReferralPipeline[]) => Promise<void>;

  handleReorderStage: (stageId: string, direction: 'left' | 'right') => Promise<void>;
}

export const PipelineContext =
  createContext<PipelineContextType | undefined>(undefined);

export const PipelineProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [stages, setStages] = useState<ReferralPipeline[]>([]);

  const toastCtx = useContext(ToastContext);

  const loadStages = async () => {
    try {
      const data = await pipelineService.getStages();

      setStages(data ?? []);
    } catch (err) {
      console.warn(err);
      toastCtx?.addToast("error", "Unable to load stages");
    }
  };

  const handleCreateStage = async (stage: any) => {
    try {
      await pipelineService.createStage(stage);
      await loadStages();
      toastCtx?.addToast("success", "Stage created");
    } catch (err) {
      console.warn(err);
      toastCtx?.addToast("error", "Unable to create stage");
    }
  };

  const handleDeleteStage = async (id: string) => {
    const stage = stages.find(s => s.id === id);
    const mandatory = ['new', 'won', 'lost'];
    if (stage && mandatory.includes((stage.name || '').trim().toLowerCase())) {
      toastCtx?.addToast("error", `Stage "${stage.name}" is mandatory and cannot be deleted.`);
      return;
    }

    try {
      await pipelineService.deleteStage(id);
      await loadStages();
      toastCtx?.addToast("success", "Stage deleted");
    } catch (err) {
      console.warn(err);
      toastCtx?.addToast("error", "Unable to delete stage");
    }
  };

  const handleReorderStages = async (
    stagesList: ReferralPipeline[]
  ) => {
    try {
      const res = await pipelineService.reorderStages(stagesList);
      if (res && Array.isArray(res)) {
        setStages(res);
      } else {
        await loadStages();
      }
    } catch (err) {
      console.warn(err);
      toastCtx?.addToast("error", "Unable to reorder stages");
    }
  };

  const handleReorderStage = async (stageId: string, direction: 'left' | 'right') => {
    const sorted = [...stages].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
    const stageIdx = sorted.findIndex(s => s.id === stageId);
    if (stageIdx === -1) return;
    const targetIdx = direction === 'left' ? stageIdx - 1 : stageIdx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;

    const temp = sorted[stageIdx];
    sorted[stageIdx] = sorted[targetIdx];
    sorted[targetIdx] = temp;

    const updated = sorted.map((st, index) => ({
      ...st,
      sequence: index + 1,
    }));

    setStages(updated);

    try {
      const res = await pipelineService.reorderStages(updated);
      if (res && Array.isArray(res)) {
        setStages(res);
      } else {
        await loadStages();
      }
    
    } catch (err) {
      console.warn(err);
      toastCtx?.addToast("error", "Unable to reorder stages");
    }
  };

  return (
    <PipelineContext.Provider
      value={{
        stages,
        setStages,
        loadStages,
        handleCreateStage,
        handleDeleteStage,
        handleReorderStages,
        handleReorderStage,
      }}
    >
      {children}
    </PipelineContext.Provider>
  );
};