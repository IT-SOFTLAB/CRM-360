const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const authenticateJWT = require('../middlewares/authMiddleware');
const { requireAdminOrSuperAdmin } = require('../middlewares/roleMiddleware');

// Setup checks
router.get('/setup-status', auth.setupStatus);
router.post('/setup', auth.setup);

// Standard auth endpoints
router.post('/login', auth.login);
router.post('/refresh', auth.refresh);
router.post('/logout', auth.logout);

// Protected endpoints
router.post('/change-password', authenticateJWT, auth.changePassword);
router.post('/invite', authenticateJWT, requireAdminOrSuperAdmin, auth.inviteUser);
router.post('/accept-invitation', auth.acceptInvitation);

// Outlook callback integrity
router.get('/callback', auth.callback);

module.exports = router;