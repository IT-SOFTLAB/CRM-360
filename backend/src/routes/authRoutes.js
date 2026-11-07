
const express = require('express');
const router = express.Router();

const auth = require('../controllers/authController');
const authenticateJWT = require('../middlewares/authMiddleware');
const { requireAdminOrSuperAdmin } = require('../middlewares/roleMiddleware');

// Login
router.post('/login', auth.login);

// Forgot Password - OTP flow
router.post('/forgot-password', auth.forgotPassword);
router.post('/verify-otp', auth.verifyOtp);
router.post('/reset-password', auth.resetPassword);

// Refresh and Logout
router.post('/refresh', auth.refresh);
router.post('/logout', auth.logout);

// Change Password
router.post('/change-password', authenticateJWT, auth.changePassword);

// User Invitation
router.post('/invite', authenticateJWT, requireAdminOrSuperAdmin, auth.inviteUser);
router.post('/accept-invitation', auth.acceptInvitation);

// Outlook Integration
router.get('/login/outlook', authenticateJWT, auth.outlookLogin);
router.get('/callback', auth.outlookCallback);

module.exports = router;
