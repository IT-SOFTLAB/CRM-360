export interface ReferralPipeline {

  id: string;

  name: string;

  sequence: number;

  color?: string;

  isFinal: boolean;

  createdAt: string;

  _count?: {

    referrals: number;

  };

}