"use client";

import React, { createContext, useState, useContext } from 'react';
import { Activity } from '../types/activity';
import { activityService } from '../services/activity.service';
import { ToastContext } from './ToastContext';

export interface ActivityContextType {
  activities: Activity[];
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
  showActivityModal: boolean;
  setShowActivityModal: React.Dispatch<React.SetStateAction<boolean>>;
  loadActivities: () => Promise<void>;
  handleActivityCreate: (activityForm: any) => Promise<void>;
  toggleActivityDone: (activityId: string, currentStatus: boolean) => Promise<void>;
}

export const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export const ActivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const toastCtx = useContext(ToastContext);

  const loadActivities = async () => {
    const apiActivities = await activityService.getActivities();
    if (apiActivities) {
      setActivities(apiActivities);
    }
  };

  const handleActivityCreate = async (activityForm: any) => {
    try {
      const res = await activityService.createActivity(activityForm);
      await loadActivities();
      if (toastCtx) {
        toastCtx.addToast("success", "Activity scheduled!");
      }
      setShowActivityModal(false);
    } catch (err) {
      if (toastCtx) {
        toastCtx.addToast("error", "Unable to schedule activity.");
      }
    }
  };

  const toggleActivityDone = async (activityId: string, currentStatus: boolean) => {
    try {
      await activityService.updateActivity(activityId, { done: !currentStatus });
      await loadActivities();
      if (toastCtx) {
        toastCtx.addToast("success", "Activity updated");
      }
    } catch {
      if (toastCtx) {
        toastCtx.addToast("error", "Unable to update activity");
      }
    }
  };

  return (
    <ActivityContext.Provider value={{
      activities,
      setActivities,
      showActivityModal,
      setShowActivityModal,
      loadActivities,
      handleActivityCreate,
      toggleActivityDone
    }}>
      {children}
    </ActivityContext.Provider>
  );
};
