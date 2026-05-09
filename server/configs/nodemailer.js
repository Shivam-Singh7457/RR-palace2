import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host:"smtp-relay.brevo.com",
    port:587,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
})

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error("🔴 SMTP Connection Error:", error.message);
  } else {
    console.log("🟢 SMTP Server is ready to take our messages");
  }
});

export default transporter;