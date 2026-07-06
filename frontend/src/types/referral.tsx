export interface Referral {
  id: string;
  referrerName: string;
  referrerCompany: string;
  referredLeadName: string;
  referredCompany: string;
  dealValue: number | string;
  stage: string;
  dateSubmitted: string;
  rewardType: string;
  rewardValue: string;
  rewardApproved: boolean;
}
