const express = require("express");

const router = express.Router();

const activityController = require("../controllers/activityController");
const authenticateJWT = require("../middlewares/authMiddleware");

router.use(authenticateJWT);


router.post("/", activityController.createActivity);

router.get("/", activityController.getActivities);

router.put("/:id", activityController.updateActivity);

router.patch("/:id/done", activityController.toggleDone);

router.delete("/:id", activityController.deleteActivity);

module.exports = router;