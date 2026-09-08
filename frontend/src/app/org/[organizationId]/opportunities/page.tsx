"use client";

import { useEffect } from "react";
import { useCRM } from "@/context/CRMContext";
import { useOpportunities } from "@/hooks/useOpportunities";
import OpportunitiesView from "@/components/crm/OpportunitiesView";

export default function OpportunitiesPage() {
  const crm = useCRM();
  const { loadOpportunities } = useOpportunities();

  useEffect(() => {
    // Triggers /api/org/:orgId/opportunities which hits Redis caching
    loadOpportunities();
  }, []);

  return (
    <OpportunitiesView
      opportunities={crm.opportunities}
      pipelines={crm.pipelines}
      user={crm.user}
      searchQuery={crm.searchQuery}
      activeFilters={crm.activeFilters}
      onMoveOpportunity={crm.handleMoveOpportunity}
      onDeleteOpportunity={crm.handleDeleteOpportunity}
      onAddStage={crm.handleAddStage}
      onReorderStage={crm.handleStageReorder}
      onDeleteStage={crm.handleStageDelete}
      applyFilters={crm.applyFilters}
      showStageModal={crm.showStageModal}
      setShowStageModal={crm.setShowStageModal}
      addToast={crm.addToast}
      leads={crm.leads}
      onUpdateOpportunity={crm.handleUpdateOpportunity}
      settingsUsers={crm.settingsUsers}
      onBulkAssignOpportunities={crm.handleBulkAssignOpportunities}
      onBulkDeleteOpportunities={crm.handleBulkDeleteOpportunities}
      settingsCategories={crm.categories}
    />
  );
}