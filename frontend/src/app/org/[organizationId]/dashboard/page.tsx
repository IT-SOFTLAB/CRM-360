"use client";

import { useParams } from "next/navigation";
import { useCRM } from "@/context/CRMContext";
import DashboardView from "@/components/crm/DashboardView";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function DashboardPage() {
  const params = useParams();

  const organizationId = params.organizationId as string;

  const {
    leads,
    opportunities,
    pipelines,
    activities,
    toggleActivityDone,
    addToast,
  } = useCRM();

  return (
    <ProtectedRoute>
      <DashboardView
        leads={leads}
        opportunities={opportunities}
        pipelines={pipelines}
        activities={activities}
        onToggleActivityDone={toggleActivityDone}
        addToast={addToast}
      />
    </ProtectedRoute>
  );
}