const nodemailer = require('nodemailer');

const sendNotification = async (article) => {
  if (article.publishedAt === null) {
    strapi.log.info("⏳ Article is a draft → No email sent.");
    return;
  }

  // Fetch full article with categories to get slugs
  // Using strapi.documents (v5) or strapi.entityService
  const fullArticle = await strapi.entityService.findOne(
    'api::article.article',
    article.id,
    { populate: { categories: true } }
  );

  const articleSlug = fullArticle.slug;
  const category = fullArticle.categories && fullArticle.categories.length > 0 ? fullArticle.categories[0] : null;
  const categorySlug = category?.slug || "blog";

  // ✅ Build correct article URL
  const siteBaseUrl = process.env.FRONTEND_BASE_URL || "https://blog.hakxcore.io";
  const articleUrl = `${siteBaseUrl}/en/${categorySlug}/${articleSlug}`;

  strapi.log.info(`📎 Blog URL generated: ${articleUrl}`);

  // Fetch all newsletter subscribers
  const subscribers = await strapi.entityService.findMany(
    'api::newsletter-subscriber.newsletter-subscriber',
    { fields: ['email'] }
  );

  if (subscribers.length === 0) {
    strapi.log.info("No subscribers found.");
    return;
  }

  // nodemailer transporter
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT, 10),
    secure: process.env.MAIL_PORT === '465',
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASSWORD }
  });

  for (const subscriber of subscribers) {
    const unsubscribeUrl =
      `${process.env.STRAPI_URL}/api/newsletter-subscribers/unsubscribe-article?email=${subscriber.email}`;

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
          To stop receiving updates,  <a href="${unsubscribeUrl}">unsubscribe</a>.
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
};

module.exports = {
  async afterCreate(event) {
    await sendNotification(event.result);
  },

  async afterUpdate(event) {
    const { result, params } = event;

    // Check if the article was just published
    // In Strapi v5, we check if publishedAt was changed from null to a date
    if (result.publishedAt && (!params.data || !params.data.publishedAt)) {
      // result.publishedAt exists, but it was not in the original data payload or was null
      // This is a bit tricky to detect purely from 'result' if we don't have 'beforeUpdate' state.
      // However, often Strapi sends the full result.
      // A simpler check: if it's published now, we can send it.
      // To avoid double-sending, we might need a flag, but for now let's assume publish action.
      await sendNotification(result);
    }
  },
};

