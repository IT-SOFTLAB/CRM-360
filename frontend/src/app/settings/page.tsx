"use client";

import { useCRM } from "@/context/CRMContext";
import SettingsView from "@/components/crm/SettingsView";

export default function SettingsPage() {
  const crm = useCRM();
  return (
    <SettingsView
      companyBranding={crm.companyBranding}
      setCompanyBranding={crm.setCompanyBranding}
      categories={crm.categories}
      settingsUsers={crm.settingsUsers}
      user={crm.user}
      onSaveBranding={crm.handleBrandingSave}
      onAddCategory={crm.handleAddCategory}
      onDeleteCategory={crm.handleDeleteCategory}
      onDeleteUser={crm.handleDeleteUser}
      addToast={crm.addToast}
      onRefreshUsersList={crm.loadCRMData}
    />
  );
}
