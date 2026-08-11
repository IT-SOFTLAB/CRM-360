"use client";

import { useCRM } from "@/context/CRMContext";
import DashboardView from "@/components/crm/DashboardView";
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function DashboardPage() {
  const { leads, opportunities, pipelines, activities, toggleActivityDone, addToast } = useCRM();
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
