"use client";

import { useCRM } from "@/context/CRMContext";
import LoginView from "@/components/crm/LoginView";

export default function OrganizationLoginPage() {
  const crm = useCRM();

  return (
    <LoginView
      authMode={crm.authMode}
      setAuthMode={crm.setAuthMode}
      authForm={crm.authForm}
      setAuthForm={crm.setAuthForm}
      onSubmit={crm.handleAuthSubmit}
      addToast={crm.addToast}
      setupRequired={crm.setupRequired}
      onSetupSubmit={crm.handleSetupSubmit}
    />
  );
}