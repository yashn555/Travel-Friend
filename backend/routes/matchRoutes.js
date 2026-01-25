const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const auth = require('../middleware/authMiddleware');

// All routes are protected
router.use(auth.protect);

// GET /api/match/find - Find matching travelers
router.get('/find', matchController.findMatches);

// GET /api/match/detailed/:userId - Get detailed match analysis
router.get('/detailed/:userId', matchController.getDetailedMatch);

module.exports = router;