const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Group CRUD operations
router.post('/create', groupController.createGroup);
router.get('/all-groups', groupController.getAllGroups);
router.get('/my-groups', groupController.getMyGroups);
router.get('/my-created-groups', groupController.getMyCreatedGroups);

// Group operations with ID
router.get('/search/location', groupController.searchGroupsByLocation); // This should come before :id routes
router.get('/:groupId', groupController.getGroupById);
router.put('/:groupId', groupController.updateGroup);
router.delete('/:groupId', groupController.deleteGroup);

// Location management
router.put('/:groupId/update-location', groupController.updateGroupLocation);
router.get('/:groupId/starting-city', groupController.getGroupStartingCity);
router.get('/:groupId/analytics', groupController.getGroupAnalytics);

// Member management
router.post('/:groupId/add-member', groupController.addMemberToGroup);
router.delete('/:groupId/members/:userId', groupController.removeMember);

// Join request operations
router.post('/join-request', groupController.requestJoinGroup);
router.get('/:groupId/requests', groupController.getJoinRequestsByGroup);
router.get('/:groupId/join-requests', groupController.getJoinRequests); // Alias for consistency
router.put('/handle-request', groupController.handleJoinRequest);
router.put('/:groupId/handle-request/:requestId', groupController.handleJoinRequest);

// Debug/test routes (optional)
router.get('/debug/test-requests/:groupId', groupController.getJoinRequestsByGroup);

module.exports = router;