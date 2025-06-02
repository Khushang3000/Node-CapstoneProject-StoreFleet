
import nodemailer from 'nodemailer';
import path from 'path';
import dotenv from "dotenv"; 
import { fileURLToPath } from 'url'; 
const __filename_emailUtil_pw = fileURLToPath(import.meta.url);
const __dirname_emailUtil_pw = path.dirname(__filename_emailUtil_pw);

const configPath_emailUtil_pw = path.resolve(__dirname_emailUtil_pw, '..', '..', 'config', 'uat.env');


const loadEnvResult_emailUtil_pw = dotenv.config({ path: configPath_emailUtil_pw });

if (loadEnvResult_emailUtil_pw.error) {
  console.error('[passwordReset.js] FATAL ERROR loading .env file specifically for this module:', loadEnvResult_emailUtil_pw.error);
} else {
  
}

const smtpService = process.env.SMTP_SERVICE;
const mailHost = process.env.MAIL_HOST;
const mailPort = parseInt(process.env.MAIL_PORT || '587', 10);
const mailSecure = process.env.MAIL_SECURE === 'true';
const mailUser = process.env.MAIL_USER;
const mailPass = process.env.MAIL_PASS;

const mailFromAddress = process.env.MAIL_FROM_ADDRESS;
const companyName = process.env.COMPANY_NAME || 'StoreFleet';


const localLogoPath = "C:\\Users\\sharm\\Downloads\\Logo.png";

let transporter;
let emailConfigured = false;


if (mailUser && mailPass) {
    if (smtpService) {
        emailConfigured = true;
        transporter = nodemailer.createTransport({
            service: smtpService,
            auth: { user: mailUser, pass: mailPass },
        });
    } else if (mailHost) {
        emailConfigured = true;
        transporter = nodemailer.createTransport({
            host: mailHost,
            port: mailPort,
            secure: mailSecure,
            auth: { user: mailUser, pass: mailPass },
        });
    }
}

if (emailConfigured) {
    transporter.verify((error) => {
        if (error) {
            console.error('Nodemailer (Password Reset) VERIFICATION ERROR:', error);
        } else {
            console.log('Nodemailer (Password Reset) transporter is configured and verified.');
        }
    });
} else {
    console.warn(
        'Email (Password Reset) sending is NOT fully configured. Please ensure MAIL_USER, MAIL_PASS, and either SMTP_SERVICE or MAIL_HOST are correctly set in your .env file AND that dotenv loaded them for this module.'
    );
    transporter = {
        sendMail: async (options) => {
            console.warn(`[DUMMY SEND] Password Reset Email not truly sent to ${options.to}. Email service not configured.`);
            return Promise.resolve({ messageId: 'dummy-id-email-not-configured' });
        }
    };
}


export const sendPasswordResetEmail = async (user, plainResetToken) => {
    if (!user || !user.email || !user.name) {
        console.error("sendPasswordResetEmail: user object with email and name is required.");
        return;
    }
    if (!plainResetToken) {
        console.error("sendPasswordResetEmail: plainResetToken is required.");
        return;
    }

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

    if (!emailConfigured) {
        
    }

    try {
        const info = await transporter.sendMail(mailOptions);
        if (emailConfigured && info && info.messageId !== 'dummy-id-email-not-configured') {
            console.log(`Password reset email sent to ${user.email} with token. Message ID: ${info.messageId}`);
        }
    } catch (error) {
        console.error(`Error sending password reset email to ${user.email}: (This error is from transporter.sendMail)`, error);
    }
};