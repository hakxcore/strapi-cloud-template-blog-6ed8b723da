"use strict";

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
    "api::newsletter-subscriber.newsletter-subscriber",
    ({ strapi }) => ({

        // ✅ Custom create to prevent duplicate subscriptions
        async create(ctx) {
            const { email } = ctx.request.body.data;

            if (!email) return ctx.badRequest("Email is required");

            // ✅ Check if already subscribed
            const existing = await strapi.entityService.findMany(
                "api::newsletter-subscriber.newsletter-subscriber",
                { filters: { email } }
            );

            if (existing.length > 0) {
                return ctx.badRequest("already subscribed");
            }

            return await super.create(ctx);
        },

        // ✅ Unsubscribe logic
        async unsubscribe(ctx) {
            try {
                const email = ctx.request.query.email;

                if (!email) {
                    return ctx.badRequest("Email query parameter is required");
                }

                const subscribers = await strapi.entityService.findMany(
                    "api::newsletter-subscriber.newsletter-subscriber",
                    { filters: { email } }
                );

                if (!subscribers.length) {
                    return ctx.notFound("Email not found or already unsubscribed");
                }

                const subscriberId = subscribers[0].id;

                await strapi.entityService.delete(
                    "api::newsletter-subscriber.newsletter-subscriber",
                    subscriberId
                );
                
                return ctx.redirect(`${process.env.FRONTEND_URL}/en/unsubscribed-success`);


            } catch (error) {
                console.error("Unsubscribe error:", error);
                return ctx.internalServerError("Something went wrong");
            }
        }
    })
);
