const express = require("express");

const router = express.Router();

const { chat } = require("../controllers/ai.controller");

router.post("/chat", chat);

module.exports = router;