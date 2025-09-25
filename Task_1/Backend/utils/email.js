const nodemailer = require('nodemailer');

const { SENDER_EMAIL, SENDER_EMAIL_PASSWORD } = process.env;

async function sendEmail(to, subject, text) {
    const transporter = nodemailer.createTransporter({
        service: 'gmail',
        port: 587,
        secure: false,
        auth: {
            user: SENDER_EMAIL,
            pass: SENDER_EMAIL_PASSWORD
        }
    });

    await transporter.sendMail({
        from: SENDER_EMAIL,
        to,
        subject,
        text
    });
}

module.exports = { sendEmail };