"use strict";

const { createCoreRouter } = require("@strapi/strapi").factories;

module.exports = createCoreRouter("api::newsletter-subscriber.newsletter-subscriber", {
  config: {
    find: { auth: false },
    findOne: { auth: false },
    create: { auth: false } // allow frontend to subscribe
  }
});
