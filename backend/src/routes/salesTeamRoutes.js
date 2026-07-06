const express = require('express');
const router = express.Router();
const salesTeam = require('../controllers/salesTeamController');
const authenticateJWT = require('../middlewares/authMiddleware');
const { requireAdminOrSuperAdmin } = require('../middlewares/roleMiddleware');

router.use(authenticateJWT);

router.get('/', requireAdminOrSuperAdmin, salesTeam.getTeams);
router.get('/:id', salesTeam.getTeamById);
router.post('/', requireAdminOrSuperAdmin, salesTeam.createTeam);
router.put('/:id', requireAdminOrSuperAdmin, salesTeam.updateTeam);
router.delete('/:id', requireAdminOrSuperAdmin, salesTeam.deleteTeam);

module.exports = router;
