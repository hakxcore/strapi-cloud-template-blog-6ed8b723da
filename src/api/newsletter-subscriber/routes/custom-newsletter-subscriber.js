"use strict";

module.exports = {
  routes: [
    {
      method: "GET",
      path: "/newsletter-subscribers/unsubscribe",
      handler: "newsletter-subscriber.unsubscribe",
      config: { auth: false },
    },
  ],
};
