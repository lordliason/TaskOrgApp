// Vercel Serverless Function for sending task reminder SMS
// Uses Textbelt API for SMS delivery

// Import from api/lib/appConfig.js (from api/ root, go into lib/ subdirectory)
const config = require('./lib/appConfig');

// Try to import Supabase client (optional - for looking up phone numbers from database)
let createClient = null;
try {
    createClient = require('@supabase/supabase-js').createClient;
} catch (e) {
    // Supabase client not available - will fall back to config-based phone numbers
    console.log('Supabase client not available, using config-based phone numbers');
}

// Initialize Supabase client for looking up user phone numbers
function getSupabaseClient() {
    if (!createClient) {
        return null;
    }
    
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        return null;
    }
    
    return createClient(supabaseUrl, supabaseKey);
}

// Look up phone number from database by user display name or username
async function getPhoneFromDatabase(recipientName, organizationId) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        console.log('Supabase not configured, falling back to config');
        return null;
    }

    try {
        // Build query to find user by display_name or username (case-insensitive)
        let query = supabase
            .from('users')
            .select('phone, display_name, username')
            .or(`display_name.ilike.${recipientName},username.ilike.${recipientName}`);
        
        // If organization_id is provided, filter by it
        if (organizationId) {
            query = query.eq('organization_id', organizationId);
        }

        const { data: users, error } = await query.limit(1);

        if (error) {
            console.error('Error looking up user phone:', error);
            return null;
        }

        if (users && users.length > 0 && users[0].phone) {
            console.log(`Found phone for user ${recipientName} in database`);
            return users[0].phone;
        }

        return null;
    } catch (err) {
        console.error('Database lookup error:', err);
        return null;
    }
}

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

        const { recipient, taskName, taskDetails, appUrl, isCompletion, completedBy, isNewTask, organizationId } = body;

        if (!recipient || !taskName) {
            return res.status(400).json({ error: 'Recipient and task name are required' });
        }

        // First, try to look up phone number from database
        let recipientPhone = await getPhoneFromDatabase(recipient, organizationId);
        
        // If not found in database, fall back to config (for backward compatibility)
        if (!recipientPhone) {
            const validRecipients = config.sms.getRecipients();
            recipientPhone = validRecipients[recipient.toLowerCase()];
        }
        
        if (!recipientPhone) {
            return res.status(400).json({ error: `No phone number found for recipient "${recipient}". Please update your profile with a phone number.` });
        }

        const textbeltApiKey = config.sms.getTextbeltKey();

        if (!textbeltApiKey) {
            return res.status(200).json({
                success: false,
                fallback: true,
                message: 'SMS service not configured. Please set TEXTBELT_API_KEY environment variable.'
            });
        }

        // Prepare SMS message based on notification type
        let smsMessage;
        if (isNewTask) {
            smsMessage = `📌 New task assigned: ${taskName}`;
        } else if (isCompletion && completedBy) {
            const completerName = completedBy.charAt(0).toUpperCase() + completedBy.slice(1);
            smsMessage = `✅ Task completed by ${completerName}: ${taskName}`;
        } else {
            smsMessage = `📋 Task Reminder: ${taskName}`;
        }

        // Encode form data manually (URLSearchParams might not work in all Node.js versions)
        const encodeFormData = (data) => {
            return Object.keys(data)
                .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
                .join('&');
        };

        const formData = encodeFormData({
            phone: recipientPhone,
            message: smsMessage,
            key: textbeltApiKey
        });

        console.log('Sending SMS to:', recipientPhone, 'with message length:', smsMessage.length);
        
        const response = await fetch('https://textbelt.com/text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });

        let responseText;
        try {
            responseText = await response.text();
            console.log('Textbelt API response status:', response.status);
            console.log('Textbelt API response:', responseText.substring(0, 500));
        } catch (textError) {
            console.error('Failed to read response text:', textError);
            return res.status(500).json({
                success: false,
                error: 'Failed to read response from SMS service'
            });
        }

        if (!response.ok) {
            console.error('Textbelt API HTTP error:', response.status, responseText.substring(0, 500));
            
            return res.status(200).json({
                success: false,
                fallback: true,
                message: 'SMS service unavailable. Please try again later.',
                error: responseText.substring(0, 200)
            });
        }

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse Textbelt response as JSON:', parseError);
            console.error('Response text:', responseText);
            return res.status(500).json({
                success: false,
                error: 'Invalid response from SMS service',
                rawResponse: responseText.substring(0, 200)
            });
        }
        
        if (!data.success) {
            console.error('Textbelt API returned error:', data);
            return res.status(200).json({
                success: false,
                fallback: true,
                message: data.error || 'Failed to send SMS',
                quotaRemaining: data.quotaRemaining,
                errorDetails: data
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
