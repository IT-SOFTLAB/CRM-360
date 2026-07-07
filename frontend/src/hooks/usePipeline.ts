"use client";

import { useContext } from "react";
import {
  PipelineContext,
  PipelineContextType,
} from "../context/PipelineContext";

export const usePipeline = (): PipelineContextType => {
  const context = useContext(PipelineContext);

  if (!context) {
    throw new Error(
      "usePipeline must be used within PipelineProvider"
    );
  }

  return context;
};