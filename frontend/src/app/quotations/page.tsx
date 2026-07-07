"use client";

import { useCRM } from "@/context/CRMContext";
import QuotationsView from "@/components/crm/QuotationsView";

export default function QuotationsPage() {
  const crm = useCRM();
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
