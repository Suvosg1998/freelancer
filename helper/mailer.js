// mailer.js
const nodemailer = require('nodemailer');

class Mailer {
    constructor(service, user, pass) {
        this.transporter = nodemailer.createTransport({
            service: service, // e.g., 'Gmail', 'Yahoo', etc.
            auth: {
                user: user, // sender email
                pass: pass, // sender password or app password
            },
        });
    }

    async sendMail(mailObj) {
        const mailOptions = {
            from: this.transporter.options.auth.user, // sender email
            to: mailObj.to, // recipient email
            subject: mailObj.subject, // email subject
            html: mailObj.html // html body
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', info.messageId);
            return info;
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }
}

module.exports = Mailer;