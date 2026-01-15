// Vercel Serverless Function for sending task reminder SMS
// Uses Textbelt API for SMS delivery

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

        // Phone numbers for SMS delivery via Textbelt
        const validRecipients = {
            'mario': '8458289353',
            'maria': '5186185155'
        };

        const recipientPhone = validRecipients[recipient.toLowerCase()];
        if (!recipientPhone) {
            return res.status(400).json({ error: 'Invalid recipient. Must be "mario" or "maria"' });
        }

        // Get Textbelt API key from environment
        const textbeltApiKey = process.env.TEXTBELT_API_KEY;

        if (!textbeltApiKey) {
            return res.status(200).json({
                success: false,
                fallback: true,
                message: 'SMS service not configured. Please set TEXTBELT_API_KEY environment variable.'
            });
        }

        // Prepare SMS message (SMS has 160 character limit per segment, but we'll keep it concise)
        let smsMessage = `📋 Task Reminder: ${taskName}`;
        if (taskDetails) {
            smsMessage += `\n${taskDetails}`;
        }
        if (appUrl) {
            smsMessage += `\n${appUrl}`;
        }
        smsMessage += `\n\n- TaskOrgApp`;

        // Send SMS using Textbelt API
        const formData = new URLSearchParams();
        formData.append('phone', recipientPhone);
        formData.append('message', smsMessage);
        formData.append('key', textbeltApiKey);

        const response = await fetch('https://textbelt.com/text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
        });

        if (!response.ok) {
            const responseText = await response.text();
            console.error('Textbelt API error:', responseText.substring(0, 500));
            
            return res.status(200).json({
                success: false,
                fallback: true,
                message: 'SMS service unavailable. Please try again later.',
                error: responseText.substring(0, 200)
            });
        }

        const data = await response.json();
        
        if (!data.success) {
            console.error('Textbelt API returned error:', data);
            return res.status(200).json({
                success: false,
                fallback: true,
                message: data.error || 'Failed to send SMS',
                quotaRemaining: data.quotaRemaining
            });
        }
        
        return res.status(200).json({
            success: true,
            message: `Reminder sent to ${recipient.charAt(0).toUpperCase() + recipient.slice(1)}!`,
            textId: data.textId,
            quotaRemaining: data.quotaRemaining
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
