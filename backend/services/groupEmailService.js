// backend/services/groupEmailService.js
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Group = require('../models/Group');

class GroupEmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async sendGroupInvitationEmail(recipientEmail, invitationData) {
    try {
      const { inviterName, groupName, destination, startDate, endDate, invitationId, customMessage, maxMembers, currentMembers } = invitationData;
      
      const invitationLink = `${process.env.FRONTEND_URL}/invitations/${invitationId}/respond`;
      const tripPreviewLink = `${process.env.FRONTEND_URL}/groups/preview/${invitationData.groupId}`;
      
      const mailOptions = {
        from: `"TravelBuddy ✈️" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: recipientEmail,
        subject: `🎉 ${inviterName} invited you to join ${destination} trip!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Trip Invitation</title>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f5f7fa;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
              }
              .header p {
                margin: 10px 0 0;
                opacity: 0.9;
                font-size: 16px;
              }
              .content {
                padding: 40px 30px;
              }
              .trip-card {
                background: linear-gradient(135deg, #f6f9ff 0%, #f0f4ff 100%);
                border-radius: 10px;
                padding: 25px;
                margin: 25px 0;
                border-left: 4px solid #667eea;
              }
              .trip-card h2 {
                color: #2d3748;
                margin: 0 0 15px 0;
                font-size: 22px;
              }
              .trip-details {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-top: 20px;
              }
              .detail-item {
                display: flex;
                align-items: center;
                gap: 10px;
                color: #4a5568;
              }
              .detail-icon {
                color: #667eea;
                font-size: 18px;
              }
              .custom-message {
                background: #fff8e1;
                border-radius: 8px;
                padding: 20px;
                margin: 25px 0;
                border-left: 4px solid #ffb300;
              }
              .action-buttons {
                text-align: center;
                margin: 30px 0;
              }
              .btn {
                display: inline-block;
                padding: 14px 32px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                transition: transform 0.2s, box-shadow 0.2s;
              }
              .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 12px rgba(102, 126, 234, 0.3);
              }
              .secondary-btn {
                display: inline-block;
                padding: 12px 24px;
                border: 2px solid #667eea;
                color: #667eea;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                margin-left: 15px;
              }
              .footer {
                text-align: center;
                padding: 25px;
                background: #f8f9fa;
                color: #718096;
                font-size: 14px;
              }
              .footer-links {
                margin-top: 15px;
              }
              .footer-links a {
                color: #667eea;
                text-decoration: none;
                margin: 0 10px;
              }
              @media (max-width: 600px) {
                .container {
                  border-radius: 0;
                }
                .header {
                  padding: 30px 20px;
                }
                .content {
                  padding: 30px 20px;
                }
                .btn, .secondary-btn {
                  display: block;
                  width: 100%;
                  margin: 10px 0;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✈️ Trip Invitation</h1>
                <p>${inviterName} invited you to join their adventure!</p>
              </div>
              
              <div class="content">
                <p style="color: #4a5568; font-size: 16px; margin-bottom: 20px;">
                  Hello! You've been invited to join a trip group on TravelBuddy. Here are the details:
                </p>
                
                <div class="trip-card">
                  <h2>${destination}</h2>
                  <div class="trip-details">
                    <div class="detail-item">
                      <span class="detail-icon">📅</span>
                      <span><strong>Dates:</strong> ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-icon">👥</span>
                      <span><strong>Group Size:</strong> ${currentMembers || 1}/${maxMembers || 10} members</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-icon">🎯</span>
                      <span><strong>Trip:</strong> ${groupName}</span>
                    </div>
                  </div>
                </div>
                
                ${customMessage ? `
                <div class="custom-message">
                  <strong>💌 Personal Message from ${inviterName}:</strong>
                  <p style="margin: 10px 0 0; color: #5d4037;">"${customMessage}"</p>
                </div>
                ` : ''}
                
                <div class="action-buttons">
                  <a href="${invitationLink}" class="btn">View Invitation & Respond</a>
                  <a href="${tripPreviewLink}" class="secondary-btn">Preview Trip Details</a>
                </div>
                
                <div style="text-align: center; margin-top: 30px; color: #718096; font-size: 14px;">
                  <p>This invitation will expire in 7 days.</p>
                  <p>Need help? Contact our support team at support@travelbuddy.com</p>
                </div>
              </div>
              
              <div class="footer">
                <p>© ${new Date().getFullYear()} TravelBuddy. All rights reserved.</p>
                <div class="footer-links">
                  <a href="${process.env.FRONTEND_URL}">Visit Website</a>
                  <a href="${process.env.FRONTEND_URL}/privacy">Privacy Policy</a>
                  <a href="${process.env.FRONTEND_URL}/terms">Terms of Service</a>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Group invitation email sent to ${recipientEmail}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error sending group invitation email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendInvitationResponseEmail(inviterEmail, responseData) {
    try {
      const { inviteeName, groupName, destination, status } = responseData;
      
      const groupLink = `${process.env.FRONTEND_URL}/groups/${responseData.groupId}`;
      
      const mailOptions = {
        from: `"TravelBuddy ✈️" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: inviterEmail,
        subject: `${status === 'accepted' ? '✅' : '❌'} ${inviteeName} ${status === 'accepted' ? 'accepted' : 'declined'} your trip invitation`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }
              .header { background: ${status === 'accepted' ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)' : 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)'}; color: white; padding: 30px; text-align: center; }
              .content { padding: 30px; }
              .btn { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>${status === 'accepted' ? '✅ Invitation Accepted' : '❌ Invitation Declined'}</h1>
              </div>
              <div class="content">
                <p>Hello,</p>
                <p><strong>${inviteeName}</strong> has <strong>${status}</strong> your invitation to join:</p>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin: 0; color: #2d3748;">${destination}</h3>
                  <p style="margin: 5px 0; color: #4a5568;">${groupName}</p>
                </div>
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${groupLink}" class="btn">View Trip Group</a>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Invitation response email sent to ${inviterEmail}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error sending response email:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new GroupEmailService();