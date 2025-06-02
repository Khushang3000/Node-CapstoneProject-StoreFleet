// backend/utils/emails/welcomeMail.js
import nodemailer from 'nodemailer';
import path from 'path';

// Environment variables from .env
const mailService = process.env.SMTP_SERVICE;
const mailUser = process.env.MAIL_USER; // sharmakhushang05@gmail.com
const mailPass = process.env.MAIL_PASS; // YOUR_GMAIL_APP_PASSWORD_HERE

const mailHost = process.env.MAIL_HOST;
const mailPort = parseInt(process.env.MAIL_PORT || '587', 10);
const mailSecure = process.env.MAIL_SECURE === 'true';

const mailFromAddress = process.env.MAIL_FROM_ADDRESS; // "StoreFleet Team <sharmakhushang05@gmail.com>"
const companyName = process.env.COMPANY_NAME || 'StoreFleet';

// YOUR PROVIDED LOCAL LOGO PATH
const localLogoPath = "C:\\Users\\sharm\\Downloads\\Logo.png";

let transporter;

if ((mailService && mailUser && mailPass) || (mailHost && mailUser && mailPass)) {
    const transportOptions = mailHost
        ? {
            host: mailHost,
            port: mailPort,
            secure: mailSecure,
            auth: { user: mailUser, pass: mailPass },
          }
        : {
            service: mailService,
            auth: { user: mailUser, pass: mailPass },
          };
    transporter = nodemailer.createTransport(transportOptions);

    transporter.verify((error) => {
        if (error) {
            console.error('Nodemailer (Welcome Email) verification error:', error);
        } else {
            console.log('Nodemailer (Welcome Email) is ready to send emails.');
        }
    });
} else {
    console.warn(
        'Email (Welcome Email) sending is NOT fully configured. ' +
        'Please check email-related environment variables.'
    );
    transporter = {
        sendMail: async (options) => {
            console.warn(`Email (Welcome Email) not sent to ${options.to}. Service not configured.`);
            return { messageId: 'dummy-id-email-not-configured' };
        }
    };
}

export const sendWelcomeEmail = async (user) => {
    if (!user || !user.email || !user.name) {
        console.error("sendWelcomeEmail: user object with email and name is required.");
        return;
    }

    const userName = user.name;
    const userEmail = user.email;

    const mailOptions = {
        from: mailFromAddress,
        to: userEmail,
        subject: `🎉 Welcome to ${companyName}, ${userName}!`,
        html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to ${companyName}</title>
                <style>
                    body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background-color: #f7f7f7; color: #333333; }
                    .email-container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
                    .email-header { background-color: #0056b3; padding: 25px 20px; text-align: center; }
                    .email-header img { max-height: 70px; max-width: 200px; margin-bottom: 10px; }
                    .email-header h1 { color: #ffffff; margin: 0; font-size: 26px; font-weight: bold; }
                    .email-body { padding: 30px 25px; line-height: 1.65; font-size: 16px; }
                    .email-body p { margin-bottom: 18px; }
                    .email-body strong { color: #0056b3; }
                    .email-footer { text-align: center; padding: 20px; font-size: 12px; color: #888888; background-color: #f0f0f0; border-top: 1px solid #e0e0e0;}
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="email-header">
                        <img src="cid:companylogo" alt="${companyName} Logo">
                        <h1>Welcome, ${userName}!</h1>
                    </div>
                    <div class="email-body">
                        <p>Hi ${userName},</p>
                        <p>We are absolutely thrilled to welcome you to <strong>${companyName}</strong>! Get ready to discover a seamless shopping experience.</p>
                        <p>Here are a few things you might want to do next:</p>
                        <ul>
                            <li>Explore our latest products.</li>
                            <li>Check out exclusive deals for new members.</li>
                            <li>Complete your profile to personalize your experience.</li>
                        </ul>
                        <p>If you have any questions or need a hand getting started, don't hesitate to reach out to our friendly support team. We're here to help!</p>
                        <p>Warm regards,<br>The ${companyName} Team</p>
                    </div>
                    <div class="email-footer">
                        <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
                        <p>${companyName} | Your Company Address | <a href="mailto:${mailUser}">Contact Us</a></p>
                    </div>
                </div>
            </body>
            </html>
        `,
        attachments: [{
            filename: 'Logo.png',
            path: localLogoPath,
            cid: 'companylogo'
        }]
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${userEmail}. Message ID: ${info.messageId}`);
    } catch (error) {
        console.error(`Error sending welcome email to ${userEmail}:`, error);
    }
};