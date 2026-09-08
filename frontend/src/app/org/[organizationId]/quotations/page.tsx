"use client";

import { useEffect } from "react";
import { useCRM } from "@/context/CRMContext";
import { useQuotations } from "@/hooks/useQuotations";
import QuotationsView from "@/components/crm/QuotationsView";

export default function QuotationsPage() {
  const crm = useCRM();
  const { loadQuotations } = useQuotations();

  useEffect(() => {
    loadQuotations();
  }, []);

  return (
    <QuotationsView
      quotations={crm.quotations}
      opportunities={crm.opportunities}
      user={crm.user}
      onApproveReject={crm.updateQuoteStatus}
      onCreateQuotation={crm.handleQuotationCreate}
      showQuoteModal={crm.showQuoteModal}
      setShowQuoteModal={crm.setShowQuoteModal}
      companyBranding={crm.companyBranding}
      onUpdateQuotation={crm.handleQuotationUpdate}
    />
  );
}