import transporter from "../configs/nodemailer.js";

export const sendEmail = async (options) => {
    const mailOptions = {
        from: `RR Palace <${process.env.SENDER_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
    };

    await transporter.sendMail(mailOptions);
};
