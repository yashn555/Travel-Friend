const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const auth = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(auth.protect);

router.post('/request-join', groupController.requestJoinGroup);
router.post('/create', groupController.createGroup);
router.get('/my-groups', groupController.getUserGroups);

module.exports = router;