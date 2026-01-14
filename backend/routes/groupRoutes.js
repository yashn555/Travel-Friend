const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const auth = require('../middleware/authMiddleware');

// All routes require authentication
router.use(auth.protect);

// Group CRUD operations
router.post('/create', groupController.createGroup);
router.get('/all-groups', groupController.getAllGroups);
router.get('/my-groups', groupController.getMyGroups);
router.get('/:groupId', groupController.getGroupById); // Add this route

// Join request operations
router.post('/join-request', groupController.requestJoinGroup);
router.get('/:groupId/requests', groupController.getJoinRequests);
router.put('/handle-request', groupController.handleJoinRequest);
router.get('/:groupId/requests', groupController.getJoinRequestsByGroup);

module.exports = router;