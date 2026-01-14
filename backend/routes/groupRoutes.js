const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const controller = require('../controllers/groupController');

router.use(auth.protect);

router.post('/create', controller.createGroup);
router.post('/request-join', controller.requestJoinGroup);
router.post('/handle-request', controller.handleJoinRequest);
router.get('/my-groups', controller.getUserGroups);

module.exports = router;
