// backend/utils/emails/passwordReset.js
import nodemailer from 'nodemailer';
import path from 'path'; // For robust path handling

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
            console.error('Nodemailer (Password Reset) verification error:', error);
        } else {
            console.log('Nodemailer (Password Reset) is ready to send emails.');
        }
    });
} else {
    console.warn(
        'Email (Password Reset) sending is NOT fully configured. ' +
        'Please check email-related environment variables.'
    );
    transporter = {
        sendMail: async (options) => {
            console.warn(`Email (Password Reset) not sent to ${options.to}. Service not configured.`);
            return { messageId: 'dummy-id-email-not-configured' };
        }
    };
}

/**
 * Sends a password reset email.
 * The 'plainResetToken' parameter will be the raw token, not a full URL.
 * @param {object} user - The user object (needs user.email, user.name).
 * @param {string} plainResetToken - The plain text password reset token.
 */
export const sendPasswordResetEmail = async (user, plainResetToken) => {
    if (!user || !user.email || !user.name) {
        console.error("sendPasswordResetEmail: user object with email and name is required.");
        return;
    }
    if (!plainResetToken) {
        console.error("sendPasswordResetEmail: plainResetToken is required.");
        return;
    }

    // For testing purposes, the API endpoint would be something like: PUT /api/storefleet/user/password/reset/:token
    // The user (developer/tester) would take the plainResetToken from this email
    // and use it in the :token part of the URL in Postman.

    const mailOptions = {
        from: mailFromAddress,
        to: user.email,
        subject: `${companyName} - Password Reset Request`,
        html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Reset - ${companyName}</title>
                <style>
                    body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; color: #333; }
                    .email-container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #dddddd; border-radius: 8px; overflow: hidden; }
                    .email-header { background-color: #004AAD; padding: 20px; text-align: center; }
                    .email-header img { max-height: 60px; max-width: 180px; }
                    .email-header h1 { color: #ffffff; margin-top: 10px; font-size: 22px; }
                    .email-body { padding: 25px; line-height: 1.6; }
                    .email-body p { margin-bottom: 15px; }
                    .token-display { 
                        background-color: #e9ecef; 
                        padding: 10px; 
                        border-radius: 4px; 
                        font-family: 'Courier New', Courier, monospace; 
                        word-break: break-all; 
                        margin: 15px 0;
                    }
                    .email-footer { text-align: center; padding: 15px; font-size: 12px; color: #777777; background-color: #f4f4f4; border-top: 1px solid #dddddd;}
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="email-header">
                        <img src="cid:companylogo" alt="${companyName} Logo">
                        <h1>Password Reset</h1>
                    </div>
                    <div class="email-body">
                        <p>Hello ${user.name},</p>
                        <p>You requested a password reset for your ${companyName} account.</p>
                        <p>Your password reset token is:</p>
                        <div class="token-display">${plainResetToken}</div>
                        <p>To reset your password, please use this token in the password reset API endpoint.</p>
                        <p>For example, using Postman or a similar API client, make a PUT request to:</p>
                        <p><code>PUT /api/storefleet/user/password/reset/${plainResetToken}</code></p>
                        <p>Include your new password and confirm password in the request body.</p>
                        <p>This password reset token is valid for 10 minutes.</p>
                        <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
                        <p>Thank you,<br>The ${companyName} Team</p>
                    </div>
                    <div class="email-footer">
                        <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
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
        console.log(`Password reset email sent to ${user.email} with token. Message ID: ${info.messageId}`);
    } catch (error) {
        console.error(`Error sending password reset email to ${user.email}:`, error);
    }
};