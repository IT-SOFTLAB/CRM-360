const express = require("express");
const router = express.Router({ mergeParams: true });
const dashboardController = require("../controllers/dashboardController");
const authenticateJWT = require("../middlewares/authMiddleware");

router.get("/", authenticateJWT, dashboardController.getSummary);

module.exports = router;
