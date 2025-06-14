
import nodemailer from 'nodemailer';
import path from 'path';
import dotenv from "dotenv"; 
import { fileURLToPath } from 'url'; 
const __filename_emailUtil = fileURLToPath(import.meta.url);
const __dirname_emailUtil = path.dirname(__filename_emailUtil);

const configPath_emailUtil = path.resolve(__dirname_emailUtil, '..', '..', 'config', 'uat.env');


const loadEnvResult_emailUtil = dotenv.config({ path: configPath_emailUtil });

if (loadEnvResult_emailUtil.error) {
  console.error('[welcomeMail.js] FATAL ERROR loading .env file specifically for this module:', loadEnvResult_emailUtil.error);
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
            console.error('Nodemailer (Welcome Email) VERIFICATION ERROR:', error);
        } else {
            console.log('Nodemailer (Welcome Email) transporter is configured and verified.');
        }
    });
} else {
    console.warn(
        'Email (Welcome Email) sending is NOT fully configured. Please ensure MAIL_USER, MAIL_PASS, and either SMTP_SERVICE or MAIL_HOST are correctly set in your .env file AND that dotenv loaded them for this module.'
    );
    transporter = {
        sendMail: async (options) => {
            console.warn(`[DUMMY SEND] Welcome Email not truly sent to ${options.to}. Email service not configured.`);
            return Promise.resolve({ messageId: 'dummy-id-email-not-configured' });
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
                        <p>${companyName} | Your Company Address | <a href="mailto:${mailUser || 'support@example.com'}">Contact Us</a></p>
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
            console.log(`Welcome email sent to ${userEmail}. Message ID: ${info.messageId}`);
        }
    } catch (error) {
        console.error(`Error sending welcome email to ${userEmail}: (This error is from transporter.sendMail)`, error);
    }
};