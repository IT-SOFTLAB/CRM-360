const express = require("express");

const router = express.Router({ mergeParams: true });

const pipelineController = require("../controllers/pipeline.controller");

const authenticateJWT = require("../middlewares/authMiddleware");

router.use(authenticateJWT);

// Get all stages
router.get("/", pipelineController.getStages);

// Create stage
router.post("/", pipelineController.createStage);

// Delete stage
router.delete("/:id", pipelineController.deleteStage);

// Reorder stages
router.put("/reorder", pipelineController.reorderStages);

module.exports = router;