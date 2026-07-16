"use client";
import React, {
  createContext,
  useState,
  useContext
} from "react";

import { Referral } from '../types/referral';
import { referralService } from '../services/referral.service';
import { ToastContext } from './ToastContext';
//import { AuthContext } from './AuthContext';
import { DEFAULT_REFERRAL_FORM } from '../utils/constants';
export interface ReferralContextType {
  referrals: Referral[];
  setReferrals: React.Dispatch<React.SetStateAction<Referral[]>>;

  referralForm: any;
  setReferralForm: React.Dispatch<React.SetStateAction<any>>;

  showReferralModal: boolean;
  setShowReferralModal: React.Dispatch<React.SetStateAction<boolean>>;


  dashboard:any;
  setDashboard: React.Dispatch<React.SetStateAction<any>>;

loadDashboard:()=>Promise<void>;
  loadReferrals: () => Promise<void>;

  handleReferralCreate: (form: any) => Promise<void>;

  handleApproveReward: (id: string) => Promise<void>;
  handlePayReward: (id: string) => Promise<void>;

  handleDeleteReferral: (id: string) => Promise<void>;

  handleMoveReferral: (id: string, stageId: string) => Promise<void>;
}
export const ReferralContext = createContext<ReferralContextType | undefined>(undefined);

export const ReferralProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralForm, setReferralForm] = useState<any>(DEFAULT_REFERRAL_FORM);
  const [showReferralModal, setShowReferralModal] = useState(false);
const [dashboard, setDashboard] = useState({

  totalReferrals: 0,

  qualifiedLeads: 0,

  conversions: 0,

  totalRewardsPaid: 0,

  pendingRewardAmount: 0

});
  const toastCtx = useContext(ToastContext);
  //const authCtx = useContext(AuthContext);

  const loadReferrals = async () => {
  try {


const data = await referralService.getReferrals();
setReferrals(data ?? []);
await loadDashboard();

  } catch (err) {
    console.warn(err);
    toastCtx?.addToast("error", "Unable to load referrals");
  }
};


const loadDashboard = async () => {

    try{

        const data =
            await referralService.getDashboard();

        if(data){

            setDashboard(data);

        }

    }
    catch(err){
        console.warn(err);
    }

};
const handleReferralCreate = async (form: any) => {

  try {

    await referralService.createReferral(form);

  await loadReferrals();
    toastCtx?.addToast(
      "success",
      "Referral submitted successfully."
    );

    setShowReferralModal(false);

    setReferralForm(DEFAULT_REFERRAL_FORM);

    
  } catch (err) {
    console.warn(err);
    toastCtx?.addToast(
      "error",
      "Unable to create referral."
    );
  }

};

 const handleApproveReward = async (id: string) => {

  try {

    await referralService.approveReward(id);

   await loadReferrals();
    toastCtx?.addToast(
      "success",
      "Reward Approved"
    );

  } catch (err) {
    console.warn(err);
    toastCtx?.addToast(
      "error",
      "Unable to approve reward."
    );
  }

};

const handlePayReward = async (id: string) => {
  try {
    await referralService.payReward(id);
    await loadReferrals();
    toastCtx?.addToast(
      "success",
      "Reward Paid successfully!"
    );
  } catch (err) {
    console.warn(err);
    toastCtx?.addToast(
      "error",
      "Unable to pay reward."
    );
  }
};

const handleDeleteReferral = async (id: string) => {

  try {

    await referralService.deleteReferral(id);

 await loadReferrals();
    toastCtx?.addToast(
      "success",
      "Referral deleted"
    );

  } catch (err) {
    console.warn(err);
    toastCtx?.addToast(
      "error",
      "Unable to delete referral."
    );
  }

};

const handleMoveReferral = async (
  id: string,
  stageId: string
) => {
  const originalReferrals = [...referrals];

  // Optimistically update the list stage
  setReferrals((prev) =>
    prev.map((ref) =>
      ref.id === id ? { ...ref, currentStageId: stageId } : ref
    )
  );

  try {
    await referralService.moveReferral(id, stageId);
    await loadDashboard();
  } catch (err) {
    console.warn(err);
    // Rollback on error
    setReferrals(originalReferrals);
    toastCtx?.addToast(
      "error",
      "Unable to move referral"
    );
  }
};




  return (
    <ReferralContext.Provider value={{
     referrals,

  setReferrals,

  referralForm,

  setReferralForm,

  showReferralModal,

  setShowReferralModal,

  loadReferrals,

  handleReferralCreate,

  handleApproveReward,
  handlePayReward,

  handleDeleteReferral,

  handleMoveReferral,
  dashboard,
  setDashboard,

loadDashboard
    }}>
      {children}
    </ReferralContext.Provider>
  );
};
