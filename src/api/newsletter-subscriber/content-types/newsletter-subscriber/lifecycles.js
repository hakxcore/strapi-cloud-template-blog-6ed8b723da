const nodemailer = require('nodemailer');

module.exports = {
  async afterCreate(event) {
    // Log the entire event data for debugging
    strapi.log.info('Newsletter subscriber afterCreate event triggered');
    strapi.log.info('Event data:', JSON.stringify(event, null, 2));
    strapi.log.info('Event result:', JSON.stringify(event.result, null, 2));

    if (event.params?.data && event.params?.data?.publishedAt !== null) {
      strapi.log.info('Skip email: Admin publish/update triggered');
      return;
    }


    const { id, email } = event.result;


    // Log the extracted email
    strapi.log.info(`Extracted email from event: "${email}"`);
    strapi.log.info(`Email type: ${typeof email}`);

    if (!email) {
      strapi.log.error('No email found in event.result');
      return;
    }
    // if (process.env.NODE_ENV !== "production") {
    //   strapi.log.info(`Newsletter email skipped in ${process.env.NODE_ENV} mode`);
    //   return;
    // }

    // ✅ Check if email already sent
    const record = await strapi.entityService.findOne(
      'api::newsletter-subscriber.newsletter-subscriber',
      id,
      { fields: ['emailSent'] }
    );

    if (record?.emailSent) {
      strapi.log.warn(`Email already sent to ${email}, skipping`);
      return;
    }

    // Log the attempt
    strapi.log.info(`Attempting to send confirmation email to: ${email}`);

    // Validate environment variables
    if (!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASSWORD) {
      strapi.log.error('Email configuration incomplete. Please check MAIL_HOST, MAIL_USER, and MAIL_PASSWORD environment variables.');
      return;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT, 10) || 465,
      secure: true, // Use SSL for port 465
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
      // Enhanced debugging and connection options
      debug: true,
      logger: true,
      // Add connection timeout
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
      // Add pool settings for better delivery
      // pool: true,
      // maxConnections: 5,
      // maxMessages: 10,
      // Add DKIM and other headers for better deliverability
      dkim: {
        domainName: 'hakxcore.io',
        keySelector: 'default',
        privateKey: process.env.DKIM_PRIVATE_KEY || '', // Optional DKIM key
      },
    });

    // Verify connection configuration
    try {
      await transporter.verify();
      strapi.log.info('SMTP connection verified successfully');
    } catch (error) {
      strapi.log.error('SMTP connection verification failed:', error);
      return;
    }

    const unsubscribeLink = `${process.env.STRAPI_URL || "http://localhost:1337"}/api/newsletter-subscribers/unsubscribe?email=${email}`;


    // Email options with better deliverability
    const mailOptions = {
      from: `Hakxcore Blog <${process.env.MAIL_USER}>`,
      to: email,
      subject: '✅ Newsletter Subscription Confirmed - Welcome!',
      text: `Hello!

Thank you for subscribing to our newsletter!

You have successfully joined our mailing list and will now receive:
- Latest blog updates
- Tech insights and tutorials
- Exclusive content

If you have any questions, feel free to reply to this email.

Best regards,
The Hakxcore Team

---
This email was sent because you subscribed to our newsletter.
If you didn't subscribe, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; border-bottom: 2px solid #007cba; padding-bottom: 10px;">
            Welcome to Hakxcore Blog! 🎉
          </h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Thank you for subscribing to our newsletter!
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #007cba;">You will now receive:</p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Latest blog updates</li>
              <li>Tech insights and tutorials</li>
              <li>Exclusive content</li>
            </ul>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            If you have any questions, feel free to reply to this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999;">
            This email was sent because you subscribed to our newsletter.<br>
            If you did not subscribe or no longer wish to receive emails, you may
            <a href="${unsubscribeLink}" style="font-size: 12px; color: #999;">unsubscribe</a> here.
          </p>
        </div>
      `,
      // Add headers to improve deliverability
      headers: {
        'X-Mailer': 'Hakxcore Newsletter System',
        'X-Priority': '3',
        'List-Unsubscribe': '<mailto:tech@hakxcore.io?subject=Unsubscribe>',
        'Reply-To': process.env.MAIL_USER,
      },
      // Add message ID for better tracking
      messageId: `newsletter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@hakxcore.io`,
    };

    // Send the email with enhanced tracking
    try {
      strapi.log.info(`Sending email with improved headers to: ${email}`);
      const info = await transporter.sendMail(mailOptions);

      strapi.log.info(`✅ EMAIL SENT SUCCESSFULLY!`);
      strapi.log.info(`📧 Recipient: ${email}`);
      strapi.log.info(`📨 Message ID: ${info.messageId}`);
      strapi.log.info(`📬 Response: ${info.response}`);
      strapi.log.info(`🎯 Accepted: ${JSON.stringify(info.accepted)}`);
      strapi.log.info(`❌ Rejected: ${JSON.stringify(info.rejected)}`);

      await strapi.entityService.update(
        "api::newsletter-subscriber.newsletter-subscriber",
        id,
        { data: { emailSent: true } }
      );

      strapi.log.info(`emailSent flag updated for ${email}`);

      if (info.rejected && info.rejected.length > 0) {
        strapi.log.error(`Some recipients were rejected: ${JSON.stringify(info.rejected)}`);
      }

      // Log additional delivery info if available
      if (info.envelope) {
        strapi.log.info(`📮 Envelope: ${JSON.stringify(info.envelope)}`);
      }

    } catch (err) {
      strapi.log.error('❌ ERROR SENDING CONFIRMATION EMAIL:', err.message);
      strapi.log.error('Error details:', {
        code: err.code,
        command: err.command,
        response: err.response,
        responseCode: err.responseCode,
        stack: err.stack,
      });

      // Try to determine the specific issue
      if (err.code === 'ENOTFOUND') {
        strapi.log.error('DNS resolution failed - check MAIL_HOST setting');
      } else if (err.code === 'ECONNREFUSED') {
        strapi.log.error('Connection refused - check MAIL_PORT and server availability');
      } else if (err.responseCode === 535) {
        strapi.log.error('Authentication failed - check MAIL_USER and MAIL_PASSWORD');
      } else if (err.responseCode >= 500) {
        strapi.log.error('Server error - the email server is having issues');
      }
    }
  },
}; 