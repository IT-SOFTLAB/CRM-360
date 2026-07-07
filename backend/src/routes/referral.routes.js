const express = require("express");
const router = express.Router();

const referralController = require("../controllers/referral.controller");
//const { authenticate } = require("../middlewares/auth");

// Referral CRUD
router.post("/", referralController.createReferral);

router.get("/", referralController.getAllReferrals);

router.get("/dashboard", referralController.getDashboard);

router.get("/:id", referralController.getReferral);

router.put("/:id",  referralController.updateReferral);

router.delete("/:id", referralController.deleteReferral);

// Reward approval
router.put("/:id/approve", referralController.approveReward);

// Move Pipeline
router.put("/:id/stage",  referralController.changeStage);

module.exports = router;