// Vercel Serverless Function for OpenAI Chat
// This keeps the API key secure on the server side

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get API key from environment variable
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
        return res.status(500).json({ 
            error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable in Vercel.' 
        });
    }

    try {
        const { taskContext, message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `You are a helpful assistant that answers questions about tasks. Here is the task information:\n\n${taskContext || 'No task context provided.'}\n\nAnswer questions about this task concisely and helpfully.`
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: 300,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json({ 
                error: errorData.error?.message || `OpenAI API error: ${response.status}` 
            });
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('Chat API error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}

