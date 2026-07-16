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
  calendarConnected: boolean;

calendarEmail: string;

checkCalendarStatus: () => Promise<any>;

connectCalendar: () => void;
}

export const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export const ActivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);

const [calendarEmail, setCalendarEmail] = useState("");
  const toastCtx = useContext(ToastContext);

 const checkCalendarStatus = async () => {
  try {
    console.log("Checking Outlook Calendar status...");

    const status = await activityService.getCalendarStatus();

    console.log("Calendar Status:", status);

    setCalendarConnected(status.connected);
    setCalendarEmail(status.email || "");

    return status;
  } catch (err) {
    console.error("Calendar Status Error:", err);

    setCalendarConnected(false);
    setCalendarEmail("");

    return {
      connected: false
    };
  }
};

const loadActivities = async () => {
  try {
    console.log("Loading CRM Activities...");

    const crmActivities = await activityService.getActivities();

    const outlookStatus = await checkCalendarStatus();

    console.log("Outlook Status:", outlookStatus);

    let mergedActivities = crmActivities || [];

    if (outlookStatus.connected) {
      console.log("Loading Outlook Events...");

      const outlookEvents =
        await activityService.getCalendarEvents();

      console.log("Outlook Events:", outlookEvents);

      const mappedEvents = (outlookEvents || []).map((event: any) => ({
        id: event.id,
        title: event.subject,
        description: event.bodyPreview || "",
        type: "Meeting",
        date: event.start?.dateTime?.split("T")[0],
        time: new Date(event.start?.dateTime).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        }),
        duration: 30,
        done: false,
        salesperson:
          event.organizer?.emailAddress?.name || "",
        location:
          event.location?.displayName || "",
        attendees:
          event.attendees?.map(
            (a: any) => a.emailAddress.address
          ) || [],
        startTime: event.start?.dateTime,
        endTime: event.end?.dateTime,
        isOutlookSynced: true,
        outlookEventId: event.id
      }));

     const crmIds = new Set(
  crmActivities
    .filter((a: any) => a.outlookEventId)
    .map((a: any) => a.outlookEventId)
);

mergedActivities = [
  ...crmActivities,
  ...mappedEvents.filter(
    (e: any) => !crmIds.has(e.outlookEventId)
  )
];
    }

    setActivities(mergedActivities);

  } catch (err) {
    console.error("loadActivities Error:", err);
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

  date:
    activityForm.date ||
    new Date().toISOString().split("T")[0],

  time:
    activityForm.time || "10:00",

  duration:
    Number(activityForm.duration || 30),

  done: false,

  salesperson:
    activityForm.salesperson || "Unassigned",

  leadId:
    activityForm.leadId || "",

  opportunityId:
    activityForm.opportunityId || "",

  // Outlook
  location:
    activityForm.location || "",

  attendees:
    activityForm.attendees || [],

  syncOutlook:
    activityForm.syncOutlook || false,

 

  startTime:
    activityForm.startTime,

  endTime:
    activityForm.endTime
};
    setActivities(prev => [tempActivity as any, ...prev]);

    try {
    const payload = {

  ...activityForm,

  attendees:
    Array.isArray(activityForm.attendees)
      ? activityForm.attendees
      : String(activityForm.attendees || "")
          .split(",")
          .map((e: string) => e.trim())
          .filter(Boolean)

};

const res = await activityService.createActivity(payload);

if (res) {

  setActivities(prev =>
    prev.map(a => a.id === tempId ? res : a)
  );

  // Reload from backend to get Outlook fields
  await loadActivities();

}
      if (toastCtx) {
    toastCtx.addToast(
  "success",
 activityForm.syncOutlook
    ? "Activity synced with Outlook Calendar!"
    : "Activity scheduled!"
);
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
      toggleActivityDone,
      calendarConnected,

calendarEmail,

checkCalendarStatus,

connectCalendar: activityService.connectCalendar
    }}>
      {children}
    </ActivityContext.Provider>
  );
};
