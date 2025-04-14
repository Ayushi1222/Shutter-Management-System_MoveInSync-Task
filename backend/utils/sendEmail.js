const nodemailer = require('nodemailer');

/**
 * Send an email
 * @param {Object} options 
 * @param {String} options.email 
 * @param {String} options.subject 
 * @param {String} options.message 
 * @returns {Promise} 
 */
const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || undefined,
  };

  const info = await transporter.sendMail(mailOptions);
  
  console.log(`Email sent: ${info.messageId}`);
};

module.exports = sendEmail;