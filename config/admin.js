module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
    sessions: {
      maxRefreshTokenLifespan: 1000 * 60 * 60 * 24 * 7, // 7 days
      maxSessionLifespan: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
  secrets: {
    encryptionKey: env('STRAPI_ADMIN_ENCRYPTION_KEY'),
  },
});
