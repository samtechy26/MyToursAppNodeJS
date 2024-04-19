const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Akan Sam <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Sendgrid
      return nodemailer.createTransport({
        aervice: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_API_USERNAME,
          pass: process.env.SENDGRID_API_KEY,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    // 1 Render HTML based on pug template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject: subject,
      },
    );

    // views\emails\welcome.pug  C:\Users\zxcv2\OneDrive\Рабочий стол\Devs\MyToursAppNodeJS\views\emails\welcome.pug

    // Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      html: html,
      text: htmlToText.convert(html),
    };

    // Create a transport and send email

    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the tour App');
  }

  async sendResetToken() {
    await this.send('passwordReset', 'Reset your password');
  }
};
