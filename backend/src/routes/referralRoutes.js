const express = require("express");

const router = express.Router();

const referralController = require("../controllers/referralController");


// Create Referral
router.post("/", referralController.createReferral);

// Get All Referrals
router.get("/", referralController.getReferrals);

router.get("/dashboard",referralController.dashboard )

router.patch("/move/:id", referralController.moveReferral);

router.get("/:id/history", referralController.getHistory);

router.get("/:id/reward", referralController.getReward);

router.get("/:id/details", referralController.getReferralDetails);

router.get("/analytics", referralController.analytics);
// Get Single Referral
router.get("/:id", referralController.getReferral);

// Update Referral
router.put("/:id", referralController.updateReferral);

// Delete Referral
router.delete("/:id", referralController.deleteReferral);

module.exports = router;