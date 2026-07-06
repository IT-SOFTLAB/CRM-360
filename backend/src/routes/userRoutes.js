const express = require('express');
const router = express.Router();
const users = require('../controllers/userController');
const authenticateJWT = require('../middlewares/authMiddleware');
const { requireAdminOrSuperAdmin, requireSuperAdmin } = require('../middlewares/roleMiddleware');

router.use(authenticateJWT);

router.get('/', requireAdminOrSuperAdmin, users.getAllUsers);
router.put('/:id', requireAdminOrSuperAdmin, users.updateUser);
router.post('/:id/reset-password', requireAdminOrSuperAdmin, users.resetPassword);
router.delete('/:id', requireSuperAdmin, users.deleteUser);

module.exports = router;
