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

      onPayReward={crm.handlePayReward}

      onDeleteReferral={crm.handleDeleteReferral}

      onMoveReferral={crm.handleMoveReferral}

      onOpenReferral={crm.loadReferralDetails}

   onAddStage={crm.handleAddReferralStage}
   
      onDeleteStage={crm.handleDeleteReferralStage}

      onReorderStage={crm.handleReferralStageReorder}

      selectedReferral={crm.selectedReferral}

      loadReferralDetails={crm.loadReferralDetails}

      dashboard={crm.referralDashboard}

      onRenameStage={crm.handleRenameReferralStage}

onSetFinalStage={crm.handleSetFinalStage}
      
    />
  );
}