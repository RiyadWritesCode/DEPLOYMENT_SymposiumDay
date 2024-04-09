var nodemailer = require("nodemailer");

// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  auth: {
    user: "riyadthetennisplayer@gmail.com",
    pass: process.env.BREVO_PASSWORD,
  },
});

module.exports = { transporter };
