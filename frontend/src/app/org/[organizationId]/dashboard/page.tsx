"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useCRM } from "@/context/CRMContext";
import DashboardView from "@/components/crm/DashboardView";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import dashboardService from "@/services/dashboard.service";

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

  useEffect(() => {
    if (organizationId) {
      dashboardService.getDashboard(organizationId).catch((err) => {
        console.error("Failed to fetch Redis dashboard cache:", err);
      });
    }
  }, [organizationId]);

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