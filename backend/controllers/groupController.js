const Group = require('../models/Group');

/**
 * CREATE GROUP
 */
exports.createGroup = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      destination,
      description,
      startDate,
      endDate,
      minBudget,
      maxBudget,
      maxMembers,
      groupType,
      tags
    } = req.body;

    const group = await Group.create({
      destination,
      description,
      startDate,
      endDate,
      budget: {
        min: minBudget,
        max: maxBudget
      },
      maxMembers,
      groupType,
      tags,
      createdBy: userId,
      currentMembers: [
        { user: userId } // creator auto-approved
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      group
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * REQUEST TO JOIN GROUP
 */
exports.requestJoinGroup = async (req, res) => {
  try {
    const { groupId, message } = req.body;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const alreadyMember = group.currentMembers.some(
      m => m.user.toString() === userId
    );
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'Already a member' });
    }

    const alreadyRequested = group.joinRequests.some(
      r => r.user.toString() === userId
    );
    if (alreadyRequested) {
      return res.status(400).json({ success: false, message: 'Already requested' });
    }

    group.joinRequests.push({ user: userId, message });
    await group.save();

    res.json({ success: true, message: 'Join request sent' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * APPROVE / REJECT REQUEST
 */
exports.handleJoinRequest = async (req, res) => {
  try {
    const { groupId, requestId, action } = req.body;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (group.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Only admin allowed' });
    }

    const request = group.joinRequests.id(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = action;

    if (action === 'approved') {
      group.currentMembers.push({ user: request.user });
    }

    await group.save();
    res.json({ success: true, message: `Request ${action}` });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET MY GROUPS
 */
exports.getUserGroups = async (req, res) => {
  const userId = req.user.id;

  const groups = await Group.find({
    $or: [
      { createdBy: userId },
      { 'currentMembers.user': userId }
    ]
  })
    .populate('createdBy', 'name')
    .populate('currentMembers.user', 'name');

  res.json({ success: true, groups });
};
