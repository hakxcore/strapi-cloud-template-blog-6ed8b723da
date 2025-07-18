const nodemailer = require('nodemailer');

module.exports = {
  async afterCreate(event) {
    const { email } = event.result;

    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT, 10),
      secure: process.env.MAIL_PORT === '465',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    // Email options
    const mailOptions = {
      from: `Your Blog <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Thank you for subscribing!',
      text: 'Welcome to our newsletter! You will now receive updates from us.',
      html: '<b>Welcome to our newsletter!</b><br>You will now receive updates from us.',
    };

    // Send the email
    try {
      await transporter.sendMail(mailOptions);
      strapi.log.info(`Confirmation email sent to ${email}`);
    } catch (err) {
      strapi.log.error('Error sending confirmation email:', err);
    }
  },
}; 