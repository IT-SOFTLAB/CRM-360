"use client";

import { useContext } from 'react';
import { ActivityContext, ActivityContextType } from '../context/ActivityContext';

export const useActivities = (): ActivityContextType => {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error('useActivities must be used within an ActivityProvider');
  }
  return context;
};
