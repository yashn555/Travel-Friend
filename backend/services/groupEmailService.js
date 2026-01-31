// backend/services/groupEmailService.js
const nodemailer = require('nodemailer');

class GroupEmailService {
  constructor() {
    console.log('📧 Initializing GroupEmailService...');
    
    // Use Gmail instead of SMTP
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    
    console.log('🔧 Email Config Check:', {
      user: emailUser ? emailUser.substring(0, 3) + '***' : 'Not set',
      hasPassword: !!emailPass,
      passwordLength: emailPass ? emailPass.length : 0
    });
    
    if (!emailUser || !emailPass) {
      console.warn('⚠️ EMAIL_USER or EMAIL_PASS not set - using simulation mode');
      this.transporter = null;
      return;
    }
    
    try {
      // Use Gmail directly (not SMTP localhost)
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass.replace(/\s+/g, '')  // Remove spaces
        }
      });
      
      console.log('✅ GroupEmailService using Gmail');
      
      // Verify connection (async, non-blocking)
      setTimeout(async () => {
        try {
          await this.transporter.verify();
          console.log('✅ GroupEmailService Gmail connection verified');
        } catch (error) {
          console.warn('⚠️ GroupEmailService Gmail verification failed:', error.message);
          console.log('📧 GroupEmailService will use simulation mode');
          this.transporter = null;
        }
      }, 1000);
      
    } catch (error) {
      console.error('❌ Failed to create GroupEmailService transporter:', error.message);
      this.transporter = null;
    }
  }

  async sendGroupInvitationEmail(recipientEmail, invitationData) {
    console.log('\n📧 [GroupEmailService] Sending invitation...');
    console.log('📋 To:', recipientEmail);
    console.log('📋 From:', process.env.EMAIL_USER || 'simulation');
    
    // Simulation mode if no transporter
    if (!this.transporter) {
      console.log('📧 [SIMULATION] Group invitation email would be sent');
      console.log('📧 [SIMULATION] Recipient:', recipientEmail);
      console.log('📧 [SIMULATION] Inviter:', invitationData.inviterName);
      console.log('📧 [SIMULATION] Group:', invitationData.groupName);
      return {
        success: true,
        simulated: true,
        message: 'Email simulation mode - check console for details'
      };
    }
    
    try {
      const { 
        inviterName, 
        groupName, 
        destination, 
        startDate, 
        endDate, 
        invitationId, 
        groupId,
        customMessage, 
        maxMembers, 
        currentMembers 
      } = invitationData;
      
      // Validate required fields
      if (!invitationId || !groupId) {
        console.error('❌ Missing invitationId or groupId');
        return { success: false, error: 'Missing required invitation data' };
      }
      
      // Validate email address
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recipientEmail)) {
        console.error('❌ Invalid email format:', recipientEmail);
        return { success: false, error: 'Invalid email address' };
      }
      
      const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invitations/${invitationId}/respond`;
      const tripPreviewLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/groups/${groupId}`;
      
      console.log('🔗 Generated links:', { 
        invitationLink, 
        tripPreviewLink
      });
      
      const mailOptions = {
        from: `"Traveler Friend" <${process.env.EMAIL_USER}>`,
        to: recipientEmail,
        subject: `🎉 ${inviterName} invited you to join "${destination}" trip!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Trip Invitation</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
              .content { padding: 30px; }
              .trip-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .btn { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✈️ Trip Invitation</h1>
                <p>${inviterName} invited you to join their adventure!</p>
              </div>
              <div class="content">
                <p>Hello!</p>
                <p>You've been invited to join a trip group on Traveler Friend. Here are the details:</p>
                
                <div class="trip-info">
                  <h2>${destination}</h2>
                  <p><strong>Trip:</strong> ${groupName}</p>
                  <p><strong>Dates:</strong> ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p>
                  <p><strong>Group Size:</strong> ${currentMembers || 1}/${maxMembers || 10} members</p>
                </div>
                
                ${customMessage ? `
                <div style="background: #fff8e1; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffb300;">
                  <strong>💌 Personal Message from ${inviterName}:</strong>
                  <p style="margin: 10px 0 0; color: #5d4037;">"${customMessage}"</p>
                </div>
                ` : ''}
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${invitationLink}" class="btn">View Invitation & Respond</a>
                  <br>
                  <a href="${tripPreviewLink}" style="color: #667eea; margin-top: 10px; display: inline-block;">Preview Trip Details</a>
                </div>
                
                <div style="text-align: center; margin-top: 30px; color: #718096; font-size: 14px;">
                  <p>This invitation will expire in 7 days.</p>
                  <p>Need help? Contact our support team</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
          Trip Invitation from ${inviterName}
          
          You've been invited to join "${destination}" trip!
          
          Trip: ${groupName}
          Dates: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}
          Group: ${currentMembers || 1}/${maxMembers || 10} members
          
          ${customMessage ? `Personal message from ${inviterName}: "${customMessage}"` : ''}
          
          Click here to respond: ${invitationLink}
          Preview trip: ${tripPreviewLink}
          
          This invitation expires in 7 days.
          
          Traveler Friend Team
        `
      };

      console.log('📤 Sending group invitation via Gmail...');
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Group invitation email sent!');
      console.log('📨 Message ID:', info.messageId);
      
      return { 
        success: true, 
        messageId: info.messageId,
        accepted: info.accepted,
        emailSent: true
      };
      
    } catch (error) {
      console.error('❌ Error sending group invitation email:', error.message);
      
      return { 
        success: false, 
        error: error.message,
        emailSent: false,
        simulated: true
      };
    }
  }

  async sendInvitationResponseEmail(inviterEmail, responseData) {
    console.log('\n📧 [GroupEmailService] Sending response...');
    console.log('📋 To:', inviterEmail);
    
    // Simulation mode if no transporter
    if (!this.transporter) {
      console.log('📧 [SIMULATION] Response email would be sent to:', inviterEmail);
      console.log('📧 [SIMULATION] Status:', responseData.status);
      return {
        success: true,
        simulated: true,
        message: 'Email simulation mode'
      };
    }
    
    try {
      const { inviteeName, groupName, destination, status, groupId } = responseData;
      
      if (!inviterEmail) {
        console.error('❌ No inviter email provided');
        return { success: false, error: 'No inviter email' };
      }
      
      const groupLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/groups/${groupId}`;
      
      const mailOptions = {
        from: `"Traveler Friend" <${process.env.EMAIL_USER}>`,
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
                ${status === 'accepted' ? `
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${groupLink}" class="btn">View Trip Group</a>
                </div>
                ` : ''}
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Response email sent to ${inviterEmail}`);
      return { success: true, messageId: info.messageId, emailSent: true };
      
    } catch (error) {
      console.error('❌ Error sending response email:', error.message);
      return { success: false, error: error.message, emailSent: false };
    }
  }
  
  // Get service status
  getStatus() {
    return {
      hasTransporter: !!this.transporter,
      mode: this.transporter ? 'GMAIL' : 'SIMULATION',
      emailUser: process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 3) + '***' : 'Not set'
    };
  }
}

module.exports = new GroupEmailService();