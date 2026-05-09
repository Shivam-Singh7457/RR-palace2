import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: process.env.SMTP_PORT || 465,
    secure: (process.env.SMTP_PORT == 465), // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    pool: true, // Use pooling for better performance
    maxConnections: 5,
    maxMessages: 100,
    connectionTimeout: 20000, // 20 seconds
    greetingTimeout: 20000,
    socketTimeout: 30000,
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