"use client";

import { useCRM } from "@/context/CRMContext";
import ActivitiesView from "@/components/crm/ActivitiesView";

export default function ActivitiesPage() {
  const crm = useCRM();

  return (
  <ActivitiesView
    activities={crm.activities}
    user={crm.user}

    onToggleActivityDone={crm.toggleActivityDone}
    onScheduleActivity={crm.handleActivityCreate}

    showActivityModal={crm.showActivityModal}
    setShowActivityModal={crm.setShowActivityModal}

    calendarConnected={crm.calendarConnected}
    calendarEmail={crm.calendarEmail}
    connectCalendar={crm.connectCalendar}
/>
  );
}