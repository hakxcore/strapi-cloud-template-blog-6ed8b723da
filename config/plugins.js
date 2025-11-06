module.exports = ({ env }) => ({
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: env('MAIL_HOST'),
        port: env.int('MAIL_PORT', 465),
        secure: true,
        auth: {
          user: env('MAIL_USER'),
          pass: env('MAIL_PASSWORD'),
        },
      },
      settings: {
        defaultFrom: env('MAIL_USER'),
        defaultReplyTo: env('MAIL_USER'),
      },
    },
  },
});
