module.exports = {
  routes: [
    {
      method: "GET",
      path: "/newsletter-subscribers/unsubscribe-article",
      handler: "unsubscribe-article.unsubscribe",
      config: { auth: false }
    }
  ]
};
