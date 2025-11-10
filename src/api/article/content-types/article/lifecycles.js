const nodemailer = require('nodemailer');

module.exports = {
  async afterCreate(event) {
    const article = event.result;

    // ✅ Fetch full article with category populated
    const fullArticle = await strapi.entityService.findOne(
      'api::article.article',
      article.id,
      { populate: { category: true } }
    );

    const articleSlug = fullArticle.slug;
    const categorySlug = fullArticle.category?.slug || "blog"; // default fallback

    // ✅ Build correct article URL
    const siteBaseUrl = process.env.FRONTEND_BASE_URL || "https://blog.hakxcore.io";
    const articleUrl = `${siteBaseUrl}/en/${categorySlug}/${articleSlug}`;

    strapi.log.info(`📎 Blog URL generated: ${articleUrl}`);

    // ✅ Fetch all newsletter subscribers
    const subscribers = await strapi.entityService.findMany(
      'api::newsletter-subscriber.newsletter-subscriber',
      { fields: ['email'] }
    );

    // ✅ Setup transporter
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT, 10),
      secure: process.env.MAIL_PORT === '465',
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASSWORD }
    });

    for (const subscriber of subscribers) {
      const mailOptions = {
        from: `Hakxcore Blog <${process.env.MAIL_USER}>`,
        to: subscriber.email,
        subject: `New on Hakxcore: ${article.title}`,
        html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h2 style="color:#333;border-bottom:2px solid #007cba;padding-bottom:10px;">
            New on Hakxcore
          </h2>
          <p style="font-size:16px;line-height:1.6;color:#333;">
            A new blog post has just been published.
          </p>
          <div style="background:#f8f9fa;padding:20px;border-radius:5px;margin:20px 0;">
            <p style="margin:0 0 10px;font-weight:bold;color:#007cba;">${article.title}</p>
            <a href="${articleUrl}" style="background:#007cba;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px;">
            Read the article</a>
          </div>
          <p style="font-size:12px;color:#999;">
            To stop receiving updates, <a href="https://blog.hakxcore.io/unsubscribe?email=${subscriber.email}">unsubscribe</a>.
          </p>
        </div>`,
      };

      try {
        await transporter.sendMail(mailOptions);
        strapi.log.info(`📢 Blog notification sent to ${subscriber.email}`);
      } catch (err) {
        strapi.log.error(`❌ Error sending to ${subscriber.email}:`, err);
      }
    }
  },
};
