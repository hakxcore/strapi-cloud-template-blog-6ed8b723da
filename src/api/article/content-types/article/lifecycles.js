const nodemailer = require('nodemailer');

module.exports = {
  async afterCreate(event) {
    const article = event.result;

    // Fetch all newsletter subscribers
    const subscribers = await strapi.entityService.findMany('api::newsletter-subscriber.newsletter-subscriber', {
      fields: ['email'],
    });

    // Set up Nodemailer transport
    const mailPort = parseInt(process.env.MAIL_PORT, 10);
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT, 10),
      secure: process.env.MAIL_PORT === '465', 
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    // Build canonical article URL
    const siteBaseUrl = process.env.FRONTEND_BASE_URL || 'https://blog.hakxcore.io';
    const articleUrl = `https://blog.hakxcore.io`;

    // Send email to each subscriber
    for (const subscriber of subscribers) {
      const mailOptions = {
        from: `Hakxcore Blog <${process.env.MAIL_USER}>`,
        to: subscriber.email,
        subject: `New on Hakxcore: ${article.title}`,
        text: `Hello!\n\nA new article is live on Hakxcore.\n\nTitle: ${article.title}\nLink: ${articleUrl}\n\nEnjoy the read!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; border-bottom: 2px solid #007cba; padding-bottom: 10px; margin: 0 0 16px;">
              New on Hakxcore
            </h2>

            <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 12px;">
              A new blog post has just been published.
            </p>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0 0 10px; font-weight: bold; color: #007cba;">${article.title}</p>
              <a href="${articleUrl}" style="display: inline-block; background: #007cba; color: #fff; text-decoration: none; padding: 10px 16px; border-radius: 6px;">Read the article</a>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              Enjoy the read!
            </p>
          </div>
        `,
        headers: {
          'X-Mailer': 'Hakxcore Blog Notifications',
        },
        replyTo: process.env.MAIL_USER,
        messageId: `article-${Date.now()}-${Math.random().toString(36).slice(2)}@hakxcore.io`,
      };

      try {
        await transporter.sendMail(mailOptions);
        strapi.log.info(`Blog notification sent to ${subscriber.email}`);
      } catch (err) {
        strapi.log.error('Error sending blog notification:', err);
      }
    }
  },
};
