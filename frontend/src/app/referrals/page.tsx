"use client";

import { useCRM } from "@/context/CRMContext";
import ReferralsView from "@/components/crm/ReferralsView";

export default function ReferralsPage() {
  const crm = useCRM();
  return (
    <ReferralsView
      referrals={crm.referrals}
      opportunities={crm.opportunities}
      referralPipelines={crm.referralPipelines}
      user={crm.user}
      showReferralModal={crm.showReferralModal}
      setShowReferralModal={crm.setShowReferralModal}
      referralForm={crm.referralForm}
      setReferralForm={crm.setReferralForm}
      onSubmitReferral={crm.handleReferralCreate}
      onApproveReward={crm.handleApproveReward}
    onDeleteReferral={crm.handleDeleteReferral}
    onMoveReferral={crm.handleMoveReferral}

onAddReferralStage={crm.handleAddReferralStage}

onDeleteReferralStage={crm.handleDeleteReferralStage}
dashboard={crm.dashboard}
    />
  );
}
