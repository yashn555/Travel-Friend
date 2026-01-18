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
router.get('/:groupId', groupController.getGroupById);
router.put('/handle-request', groupController.handleJoinRequest);
router.get('/:groupId/requests', groupController.getJoinRequestsByGroup);
router.get('/:id', groupController.getGroupById);
router.get('/my-created-groups', groupController.getMyCreatedGroups);
// Add this route after your other routes
router.get('/debug/test-requests/:groupId', groupController.getJoinRequestsByGroup);
router.get('/my-created-groups', groupController.getMyCreatedGroups);
// Add these routes:
router.put('/:id', groupController.updateGroup);
router.delete('/:id', groupController.deleteGroup);
module.exports = router;