const express = require('express');
const router = express.Router();
const savedFilter = require('../controllers/savedFilterController');
const authenticateJWT = require('../middlewares/authMiddleware');

// Protect all routes under this router
router.use(authenticateJWT);

router.get('/', savedFilter.getSavedFilters);
router.post('/', savedFilter.createSavedFilter);
router.delete('/:id', savedFilter.deleteSavedFilter);

module.exports = router;
