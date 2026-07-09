const express = require('express');
const router = express.Router();
const bootstrap = require('../controllers/bootstrapController');
const authenticateJWT = require('../middlewares/authMiddleware');

router.use(authenticateJWT);

router.get('/', bootstrap.getBootstrapData);

module.exports = router;
