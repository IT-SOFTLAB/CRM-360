export interface ReferralPipeline {
  id: string;
  name: string;
  sequence: number;
  color?: string;
  isFinal: boolean;
}

export interface ReferralReward {
  id: string;
  amount: number;
  rewardType: string;
  approved: boolean;
  paid: boolean;
  paidDate?: string;
}

export interface ReferralHistory {
  id: string;
  stageId: string;
  changedBy: string;
  remarks?: string;
  createdAt: string;
  pipeline: ReferralPipeline;
}

export interface Referral {
  id: string;

  referralCode: string;

  referrerId: string;

  referrerName: string;

  referrerCompany: string;

  referredLeadName: string;

  referredCompany: string;

  referredEmail?: string;

  referredPhone?: string;

  rewardType: string;

  rewardValue: number;

  rewardApproved: boolean;

  currentStageId: string;

  createdAt: string;

  updatedAt: string;

  currentStage: ReferralPipeline;

  referralRewards: ReferralReward[];

  referralHistories: ReferralHistory[];
}