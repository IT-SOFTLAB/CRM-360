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
    setShowActivityModal(false);
    
    // Optimistically add activity instantly
    const tempId = 'act_temp_' + Date.now();
    const tempActivity = {
      id: tempId,
      title: activityForm.title || "Untitled Activity",
      type: activityForm.type || "Call",
      description: activityForm.description || "",
      date: activityForm.date || new Date().toISOString().split('T')[0],
      time: activityForm.time || "12:00 PM",
      done: false,
      salesperson: activityForm.salesperson || "Unassigned",
      leadId: activityForm.leadId || "",
      duration: Number(activityForm.duration || 0),
      opportunityId: activityForm.opportunityId || ""
    };
    setActivities(prev => [tempActivity as any, ...prev]);

    try {
      const res = await activityService.createActivity(activityForm);
      if (res) {
        setActivities(prev => prev.map(a => a.id === tempId ? res : a));
      }
      if (toastCtx) {
        toastCtx.addToast("success", "Activity scheduled!");
      }
    } catch (err) {
      setActivities(prev => prev.filter(a => a.id !== tempId));
      if (toastCtx) {
        toastCtx.addToast("error", "Unable to schedule activity.");
      }
    }
  };

  const toggleActivityDone = async (activityId: string, currentStatus: boolean) => {
    // Optimistically toggle activity status immediately
    setActivities(prev => prev.map(a => a.id === activityId ? { ...a, done: !currentStatus } : a));

    try {
      await activityService.updateActivity(activityId, { done: !currentStatus });
      if (toastCtx) {
        toastCtx.addToast("success", "Activity updated");
      }
    } catch {
      // Revert if failed
      setActivities(prev => prev.map(a => a.id === activityId ? { ...a, done: currentStatus } : a));
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
