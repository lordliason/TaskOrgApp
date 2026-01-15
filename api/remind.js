// Vercel Serverless Function for sending task reminder emails
// Uses Resend API for email delivery (free tier: 100 emails/day)

module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Parse request body
        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (parseError) {
                console.error('Failed to parse request body:', parseError);
                return res.status(400).json({ error: 'Invalid JSON in request body' });
            }
        }

        if (!body) {
            return res.status(400).json({ error: 'Request body is required' });
        }

        const { recipient, taskName, taskDetails, appUrl } = body;

        if (!recipient || !taskName) {
            return res.status(400).json({ error: 'Recipient and task name are required' });
        }

        // Validate recipient - SMS via Verizon gateway + verified email only
        // Note: Resend free tier only allows sending to signup email (mario.seddik@icloud.com)
        // To enable all emails, verify a domain at resend.com/domains
        const validRecipients = {
            'mario': [
                'mario.seddik@icloud.com',  // Verified (Resend signup email)
                '8458289353@vtext.com'      // Verizon SMS
            ],
            'maria': [
                '5186185155@vtext.com'      // Verizon SMS only (email requires domain verification)
            ]
        };

        const recipientEmails = validRecipients[recipient.toLowerCase()];
        if (!recipientEmails) {
            return res.status(400).json({ error: 'Invalid recipient. Must be "mario" or "maria"' });
        }

        // Get Resend API key from environment
        const resendApiKey = process.env.RESEND_API_KEY;

        if (!resendApiKey) {
            // Return a mailto fallback if no API key is configured
            // Use all email addresses (comma-separated for mailto)
            const allEmails = recipientEmails.join(',');
            const mailtoSubject = encodeURIComponent(`Task Reminder: ${taskName}`);
            const mailtoBody = encodeURIComponent(
                `Hi ${recipient.charAt(0).toUpperCase() + recipient.slice(1)},\n\n` +
                `This is a reminder about the following task:\n\n` +
                `📋 Task: ${taskName}\n` +
                (taskDetails ? `📝 Details: ${taskDetails}\n` : '') +
                `\n` +
                (appUrl ? `🔗 View in app: ${appUrl}\n\n` : '\n') +
                `Best regards,\nTaskOrgApp`
            );
            
            return res.status(200).json({
                success: false,
                fallback: true,
                mailtoUrl: `mailto:${allEmails}?subject=${mailtoSubject}&body=${mailtoBody}`,
                message: 'Email service not configured. Use the mailto link instead.'
            });
        }

        // Prepare email content
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Task Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #1a1a1f; color: #e0e0e5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 100%; max-width: 500px; border-collapse: collapse; background: linear-gradient(145deg, #2a2a35, #1e1e26); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 32px 32px 24px 32px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 600; background: linear-gradient(135deg, #ff6b6b, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                                📋 Task Reminder
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 32px;">
                            <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #b0b0b8;">
                                Hi ${recipient.charAt(0).toUpperCase() + recipient.slice(1)},
                            </p>
                            <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #b0b0b8;">
                                This is a reminder about the following task:
                            </p>
                            
                            <!-- Task Card -->
                            <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                                <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: #ff6b6b;">
                                    ${taskName}
                                </h2>
                                ${taskDetails ? `<p style="margin: 0; font-size: 14px; color: #8a8a95; line-height: 1.5;">${taskDetails}</p>` : ''}
                            </div>
                            
                            ${appUrl ? `
                            <!-- CTA Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center">
                                        <a href="${appUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #ff6b6b, #a855f7); color: #ffffff; text-decoration: none; border-radius: 10px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 20px rgba(168, 85, 247, 0.3);">
                                            View in TaskOrgApp
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            ` : ''}
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 32px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                            <p style="margin: 0; font-size: 12px; color: #6a6a75;">
                                Sent from TaskOrgApp 💜
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `.trim();

        const emailText = 
            `Hi ${recipient.charAt(0).toUpperCase() + recipient.slice(1)},\n\n` +
            `This is a reminder about the following task:\n\n` +
            `📋 Task: ${taskName}\n` +
            (taskDetails ? `📝 Details: ${taskDetails}\n` : '') +
            `\n` +
            (appUrl ? `🔗 View in app: ${appUrl}\n\n` : '\n') +
            `Best regards,\nTaskOrgApp`;

        // Send email using Resend API
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendApiKey}`
            },
            body: JSON.stringify({
                from: 'TaskOrgApp <onboarding@resend.dev>',
                to: recipientEmails,
                subject: `📋 Task Reminder: ${taskName}`,
                html: emailHtml,
                text: emailText
            })
        });

        if (!response.ok) {
            // Read response body as text first (can only be read once)
            const responseText = await response.text();
            let errorData;
            
            // Try to parse as JSON, but we already have the text if it fails
            try {
                errorData = JSON.parse(responseText);
                console.error('Resend API error:', errorData);
                return res.status(response.status).json({
                    error: errorData.message || `Email API error: ${response.status}`
                });
            } catch (e) {
                // Response is not JSON, use the text we already read
                console.error('Resend API error (non-JSON):', responseText.substring(0, 500));
                return res.status(response.status).json({
                    error: `Email API error: ${response.status} ${response.statusText}`
                });
            }
        }

        const data = await response.json();
        
        return res.status(200).json({
            success: true,
            message: `Reminder sent to ${recipient.charAt(0).toUpperCase() + recipient.slice(1)}!`,
            emailId: data.id
        });

    } catch (error) {
        console.error('Remind API error:', error);
        return res.status(500).json({ 
            error: error.message || 'Internal server error'
        });
    }
};

// Export as default for Vercel compatibility
module.exports.default = module.exports;
