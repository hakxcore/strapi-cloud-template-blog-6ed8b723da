module.exports = {
  async unsubscribe(ctx) {
    const { email } = ctx.request.query;

    if (!email) {
      return ctx.badRequest("Email is required");
    }

    const subscriber = await strapi.entityService.findMany(
      "api::newsletter-subscriber.newsletter-subscriber",
      {
        filters: { email }
      }
    );

    if (!subscriber.length) {
      return ctx.notFound("Subscriber not found");
    }

    await strapi.entityService.update(
      "api::newsletter-subscriber.newsletter-subscriber",
      subscriber[0].id,
      { data: { unsubscribedArticles: true } }
    );

    return ctx.send({
      message: "You have been unsubscribed from blog article notifications."
    });
  }
};
