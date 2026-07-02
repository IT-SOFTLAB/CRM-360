const express = require("express");

const router = express.Router();

const rewardController = require("../controllers/rewardController");

// Get All Rewards
router.get("/", rewardController.getRewards);

// Get Reward Dashboard
router.get("/dashboard", rewardController.dashboard);

// Approve Reward
router.patch("/approve/:id", rewardController.approveReward);

router.patch("/:id/pay", rewardController.payReward);

// Reject Reward
router.patch("/reject/:id", rewardController.rejectReward);

// Mark Reward Paid
router.patch("/paid/:id", rewardController.markRewardPaid);

// Reward History
router.get("/history/:id", rewardController.rewardHistory);

module.exports = router;