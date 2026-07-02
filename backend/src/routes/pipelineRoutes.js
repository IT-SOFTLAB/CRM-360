const express = require("express");

const router = express.Router();

const pipelineController = require("../controllers/pipelineController");

// Dashboard
router.get("/dashboard", pipelineController.dashboard);

// Get All Pipeline Stages
router.get("/", pipelineController.getPipeline);

router.get("/stats", pipelineController.getPipelineStats);
// Create Pipeline Stage
router.post("/", pipelineController.createStage);

// Update Pipeline Stage
router.put("/:id", pipelineController.updateStage);

// Delete Pipeline Stage
router.delete("/:id", pipelineController.deleteStage);

// Reorder Pipeline
router.patch("/reorder/:id", pipelineController.reorderStage);

// Move Referral To Another Stage
router.patch("/move/:id", pipelineController.moveReferral);

router.patch("/:id/rename", pipelineController.renameStage);

router.patch("/:id/final", pipelineController.setFinalStage);
module.exports = router;