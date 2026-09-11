const express = require("express");
const router = express.Router();

const superAdminController = require("../controllers/superAdminController");

router.post("/super-admin", superAdminController.createSuperAdmin);

module.exports = router;