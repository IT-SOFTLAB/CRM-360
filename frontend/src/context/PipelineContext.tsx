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
    stages: ReferralPipeline[]
  ) => {
    try {
      await pipelineService.reorderStages(stages);
      await loadStages();
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
      }}
    >
      {children}
    </PipelineContext.Provider>
  );
};