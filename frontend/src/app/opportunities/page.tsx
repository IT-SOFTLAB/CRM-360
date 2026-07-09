"use client";

import { useCRM } from "@/context/CRMContext";
import OpportunitiesView from "@/components/crm/OpportunitiesView";

export default function OpportunitiesPage() {
  const crm = useCRM();
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
    />
  );
}
