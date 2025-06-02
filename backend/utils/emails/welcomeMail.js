// backend/utils/emails/welcomeMail.js
import nodemailer from 'nodemailer';
import path from 'path'; // For local logo path, though your provided path is absolute

// Read environment variables for email configuration
const smtpService = process.env.SMTP_SERVICE;         // From .env, e.g., 'gmail'
const mailHost = process.env.MAIL_HOST;             // From .env, e.g., 'smtp.gmail.com'
const mailPort = parseInt(process.env.MAIL_PORT || '587', 10); // Default to 587 if not set
const mailSecure = process.env.MAIL_SECURE === 'true'; // Expects 'true' or 'false' string in .env
const mailUser = process.env.MAIL_USER;             // From .env, e.g., sharmakhushang05@gmail.com
const mailPass = process.env.MAIL_PASS;             // From .env, e.g., your app password

// For email content
const mailFromAddress = process.env.MAIL_FROM_ADDRESS; // From .env
const companyName = process.env.COMPANY_NAME || 'StoreFleet'; // Default if not in .env

// YOUR PROVIDED LOCAL LOGO PATH
const localLogoPath = "C:\\Users\\sharm\\Downloads\\Logo.png"; // Using double backslashes for Windows path in a string

let transporter;
let emailConfigured = false;

// Check if either service-based or host-based config is sufficiently provided
// Both require mailUser and mailPass
if (mailUser && mailPass) {
    if (smtpService) { // Prioritize service-based config if SMTP_SERVICE is provided
        emailConfigured = true;
        transporter = nodemailer.createTransport({
            service: smtpService,
            auth: { user: mailUser, pass: mailPass },
        });
    } else if (mailHost) { // Fallback to host-based if SMTP_SERVICE is not but MAIL_HOST is
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
            // This indicates a problem with credentials, connection to the mail server,
            // or network configuration (like firewalls).
        } else {
            console.log('Nodemailer (Welcome Email) transporter is configured and verified.');
        }
    });
} else {
    // This warning appears if mailUser, mailPass, OR (smtpService AND mailHost) are missing/falsy
    console.warn(
        'Email (Welcome Email) sending is NOT fully configured. Please check SMTP_SERVICE/MAIL_HOST, MAIL_USER, and MAIL_PASS environment variables.'
    );
    // Create a dummy transporter that logs instead of sending if not configured
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
                        <p>${companyName} | Your Company Address | <a href="mailto:${mailUser || 'support@example.com'}">Contact Us</a></p> {/* Fallback for mailUser in link */}
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
        // The dummy transporter will log. This is just an additional explicit warning if needed.
        // console.warn("Welcome email function called, but Nodemailer transporter is not configured. Dummy send will occur.");
    }

    try {
        const info = await transporter.sendMail(mailOptions);
        // Only log success if it wasn't a dummy send
        if (emailConfigured && info && info.messageId !== 'dummy-id-email-not-configured') {
            console.log(`Welcome email sent to ${userEmail}. Message ID: ${info.messageId}`);
        }
    } catch (error) {
        // This catch will primarily be for actual send errors if 'emailConfigured' is true.
        console.error(`Error sending welcome email to ${userEmail}:`, error);
    }
};