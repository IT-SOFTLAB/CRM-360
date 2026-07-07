const express = require('express');
const router = express.Router();
const tasks = require('../controllers/taskController');
const authenticateJWT = require('../middlewares/authMiddleware');
const { requireAdminOrSuperAdmin, authorizeOwnership } = require('../middlewares/roleMiddleware');

router.use(authenticateJWT);

router.get('/', tasks.getTasks);
router.get('/:id', authorizeOwnership('Task'), tasks.getTaskById);
router.post('/', requireAdminOrSuperAdmin, tasks.createTask);
router.put('/:id', authorizeOwnership('Task'), tasks.updateTask);
router.delete('/:id', authorizeOwnership('Task'), tasks.deleteTask);

router.post('/:id/comments', authorizeOwnership('Task'), tasks.addTaskComment);

module.exports = router;
