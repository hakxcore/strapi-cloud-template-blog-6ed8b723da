'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController(
  'api::waiting-list-entry.waiting-list-entry',
  ({ strapi }) => ({
    async create(ctx) {
      const { email } = ctx.request.body.data;
      if (!email) {
        return ctx.badRequest('Email is required');
      }

      const existing = await strapi.entityService.findMany(
        'api::waiting-list-entry.waiting-list-entry',
        { filters: { email } }
      );

      if (existing.length > 0) {
        return ctx.badRequest('This email is already on the waiting list');
      }

      return await super.create(ctx);
    },
  })
);

