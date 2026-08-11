const express = require("express");

const router = express.Router();

const { chat } = require("../controllers/ai.controller");

const authenticateJWT = require("../../middlewares/authMiddleware");

router.post(
    "/chat",
    authenticateJWT,
    chat
);

module.exports = router;