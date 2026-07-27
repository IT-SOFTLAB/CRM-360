"use client";

import { useCRM } from "@/context/CRMContext";
import LeadsView from "@/components/crm/LeadsView";

export default function LeadsPage() {
  const crm = useCRM();
  return (
    <LeadsView
      leads={crm.leads}
      opportunities={crm.opportunities}
      categories={crm.categories}
      user={crm.user}
      searchQuery={crm.searchQuery}
      activeFilters={crm.activeFilters}
      onConvertLead={crm.handleConvertLeadFromView}
      onDeleteLead={crm.handleDeleteLeadFromView}
      onCreateLead={crm.handleCreateLeadFromView}
      onUpdateLead={crm.handleUpdateLeadFromView}
      showLeadCreateModal={crm.showLeadCreateModal}
      setShowLeadCreateModal={crm.setShowLeadCreateModal}
      applyFilters={crm.applyFilters}
      settingsUsers={crm.settingsUsers}
      onBulkAssignLeads={crm.handleBulkAssignLeads}
    />
  );
}
