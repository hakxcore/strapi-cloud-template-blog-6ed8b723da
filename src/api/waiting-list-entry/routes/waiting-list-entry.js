'use strict';

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::waiting-list-entry.waiting-list-entry', {
  config: {
    create: { auth: false },
  },
});

