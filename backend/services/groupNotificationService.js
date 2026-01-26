// backend/services/groupNotificationService.js
const GroupNotification = require('../models/GroupNotification');
const User = require('../models/User');
const Group = require('../models/Group');
const groupEmailService = require('./groupEmailService');

class GroupNotificationService {
  async createGroupInvitationNotification(invitationData) {
    try {
      const { groupId, userId, inviterId, invitationId, message } = invitationData;
      
      console.log(`📝 Creating group invitation notification:`, { groupId, userId, invitationId });
      
      // Get all required data
      const [group, inviter, recipient] = await Promise.all([
        Group.findById(groupId).select('destination startDate endDate maxMembers currentMembers budget'),
        User.findById(inviterId).select('name email profilePicture'),
        User.findById(userId).select('name email')
      ]);
      
      if (!group || !inviter || !recipient) {
        throw new Error('Required data not found for notification');
      }
      
      // Create group notification
      const notification = await GroupNotification.create({
        type: 'group_invitation',
        title: '🎉 Trip Invitation',
        message: `${inviter.name} invited you to join their trip to ${group.destination}`,
        group: groupId,
        sender: inviterId,
        recipient: userId,
        invitation: invitationId,
        metadata: {
          groupName: group.destination,
          inviterName: inviter.name,
          customMessage: message || null,
          tripDates: {
            start: group.startDate,
            end: group.endDate
          },
          groupSize: {
            current: group.currentMembers?.length || 0,
            max: group.maxMembers
          }
        },
        actionRequired: true,
        actionUrl: `/invitations/${invitationId}/respond`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });
      
      console.log(`✅ Group notification created: ${notification._id}`);
      
      // Send email notification
      const emailResult = await groupEmailService.sendGroupInvitationEmail(
        recipient.email,
        {
          inviterName: inviter.name,
          groupName: group.destination,
          destination: group.destination,
          startDate: group.startDate,
          endDate: group.endDate,
          invitationId: invitationId.toString(),
          customMessage: message,
          maxMembers: group.maxMembers,
          currentMembers: group.currentMembers?.length || 0,
          groupId: groupId
        }
      );
      
      if (emailResult.success) {
        console.log(`📧 Email sent to ${recipient.email}`);
      } else {
        console.warn(`⚠️ Failed to send email to ${recipient.email}: ${emailResult.error}`);
      }
      
      return notification;
      
    } catch (error) {
      console.error('❌ Error creating group invitation notification:', error);
      throw error;
    }
  }
  
  async createInvitationResponseNotification(responseData) {
    try {
      const { groupId, userId, status, invitationId } = responseData;
      
      console.log(`📝 Creating invitation response notification:`, { groupId, userId, status });
      
      const [group, user, inviter] = await Promise.all([
        Group.findById(groupId).select('destination createdBy').populate('createdBy', 'name email'),
        User.findById(userId).select('name email'),
        User.findById(responseData.inviterId || group.createdBy._id).select('name email')
      ]);
      
      if (!group || !user) {
        throw new Error('Required data not found for response notification');
      }
      
      // Create notification for inviter
      const notification = await GroupNotification.create({
        type: 'invitation_response',
        title: status === 'accepted' ? '✅ Invitation Accepted' : '❌ Invitation Declined',
        message: `${user.name} ${status} your invitation to join ${group.destination}`,
        group: groupId,
        sender: userId,
        recipient: inviter._id,
        invitation: invitationId,
        metadata: {
          groupName: group.destination,
          userName: user.name,
          status: status,
          respondedAt: new Date()
        },
        actionRequired: false,
        actionUrl: `/groups/${groupId}`
      });
      
      console.log(`✅ Response notification created for ${inviter.name}`);
      
      // Send email to inviter
      const emailResult = await groupEmailService.sendInvitationResponseEmail(
        inviter.email,
        {
          inviteeName: user.name,
          groupName: group.destination,
          destination: group.destination,
          status: status,
          groupId: groupId
        }
      );
      
      if (emailResult.success) {
        console.log(`📧 Response email sent to ${inviter.email}`);
      }
      
      return notification;
      
    } catch (error) {
      console.error('❌ Error creating response notification:', error);
      throw error;
    }
  }
  
  async getUserGroupNotifications(userId, options = {}) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        unreadOnly = false, 
        type = null,
        groupId = null 
      } = options;
      
      const skip = (page - 1) * limit;
      
      const query = { recipient: userId };
      
      if (unreadOnly) {
        query.isRead = false;
      }
      
      if (type) {
        query.type = type;
      }
      
      if (groupId) {
        query.group = groupId;
      }
      
      const [notifications, total] = await Promise.all([
        GroupNotification.find(query)
          .populate('group', 'destination')
          .populate('sender', 'name profilePicture')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        GroupNotification.countDocuments(query)
      ]);
      
      // Format notifications
      const formattedNotifications = notifications.map(notification => ({
        ...notification,
        timeAgo: this.getTimeAgo(notification.createdAt)
      }));
      
      return {
        success: true,
        data: formattedNotifications,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      };
      
    } catch (error) {
      console.error('❌ Error getting group notifications:', error);
      throw error;
    }
  }
  
  async getUnreadCount(userId) {
    try {
      const count = await GroupNotification.countDocuments({
        recipient: userId,
        isRead: false
      });
      
      return { success: true, count };
    } catch (error) {
      console.error('❌ Error getting unread count:', error);
      throw error;
    }
  }
  
  async markAsRead(notificationId, userId) {
    try {
      const notification = await GroupNotification.findOneAndUpdate(
        { 
          _id: notificationId,
          recipient: userId 
        },
        { 
          isRead: true,
          readAt: new Date()
        },
        { new: true }
      );
      
      if (!notification) {
        return { success: false, message: 'Notification not found' };
      }
      
      return { success: true, data: notification };
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
  }
  
  async markAllAsRead(userId) {
    try {
      const result = await GroupNotification.updateMany(
        { recipient: userId, isRead: false },
        { 
          isRead: true,
          readAt: new Date()
        }
      );
      
      return { 
        success: true, 
        message: `Marked ${result.modifiedCount} notifications as read` 
      };
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      throw error;
    }
  }
  
  async getInvitationDetails(invitationId, userId) {
    try {
      // Find group with this invitation
      const group = await Group.findOne({
        'invitations._id': invitationId,
        'invitations.user': userId
      })
      .populate('createdBy', 'name profilePicture')
      .populate('invitations.invitedBy', 'name profilePicture')
      .populate('currentMembers.user', 'name profilePicture');
      
      if (!group) {
        return { success: false, message: 'Invitation not found' };
      }
      
      const invitation = group.invitations.id(invitationId);
      if (!invitation) {
        return { success: false, message: 'Invitation not found' };
      }
      
      // Format the response
      const formattedInvitation = {
        invitationId: invitation._id,
        groupId: group._id,
        groupName: group.destination,
        description: group.description,
        startDate: group.startDate,
        endDate: group.endDate,
        budget: group.budget,
        destination: group.destination,
        currentMembers: group.currentMembers?.length || 0,
        maxMembers: group.maxMembers,
        invitedBy: invitation.invitedBy,
        invitedAt: invitation.invitedAt,
        message: invitation.message,
        status: invitation.status,
        respondedAt: invitation.respondedAt,
        groupData: {
          destination: group.destination,
          startDate: group.startDate,
          endDate: group.endDate,
          maxMembers: group.maxMembers,
          currentMembersCount: group.currentMembers?.length || 0,
          members: group.currentMembers?.map(member => ({
            name: member.user?.name,
            profilePicture: member.user?.profilePicture,
            role: member.role
          })) || []
        }
      };
      
      return { success: true, data: formattedInvitation };
      
    } catch (error) {
      console.error('❌ Error getting invitation details:', error);
      throw error;
    }
  }
  
  getTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return 'Just now';
  }
}

module.exports = new GroupNotificationService();