const nodemailer = require('nodemailer');

module.exports = {
  async afterCreate(event) {
    const article = event.result;

    // Fetch all newsletter subscribers
    const subscribers = await strapi.entityService.findMany('api::newsletter-subscriber.newsletter-subscriber', {
      fields: ['email'],
    });

    // Set up Nodemailer transport
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT, 10),
      secure: process.env.MAIL_PORT === '465', 
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    // Send email to each subscriber
    for (const subscriber of subscribers) {
      const mailOptions = {
        from: `Your Blog <${process.env.MAIL_USER}>`,
        to: subscriber.email,
        subject: `New Blog Post: ${article.title}`,
        html: `
          <h2>${article.title}</h2>
          <p>A new blog post has been published!</p>
          <p><a href="https://your-frontend-domain.com/blog/${article.slug}">Read it here</a></p>
        `,
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