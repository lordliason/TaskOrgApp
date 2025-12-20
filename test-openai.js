#!/usr/bin/env node

/**
 * Simple Node.js script to test OpenAI API connection
 * Run with: node test-openai.js
 */

// Read config
const fs = require('fs');
let OPENAI_API_KEY;

try {
    const configContent = fs.readFileSync('./config.js', 'utf8');
    // Try to extract the API key using regex
    const match = configContent.match(/OPENAI_API_KEY\s*=\s*['"]([^'"]+)['"]/);
    if (match && match[1]) {
        OPENAI_API_KEY = match[1];
    } else {
        console.error('❌ Could not find OPENAI_API_KEY in config.js');
        console.error('Config file content:', configContent.substring(0, 200));
        process.exit(1);
    }
} catch (e) {
    console.error('❌ Error reading config.js:', e.message);
    process.exit(1);
}

if (!OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in config.js');
    process.exit(1);
}

async function testConnection() {
    console.log('🔍 Testing OpenAI API connection...\n');
    console.log(`API Key: ${OPENAI_API_KEY.substring(0, 20)}...${OPENAI_API_KEY.substring(OPENAI_API_KEY.length - 10)}\n`);

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'user',
                        content: 'Say "Connection successful!" if you can read this.'
                    }
                ],
                max_tokens: 20
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        // Success!
        console.log('✅ Connection Successful!\n');
        console.log(`Model: ${data.model}`);
        console.log(`Response: ${data.choices[0]?.message?.content || 'No content'}\n`);
        console.log('Full Response:');
        console.log(JSON.stringify(data, null, 2));
        process.exit(0);

    } catch (error) {
        console.error('❌ Connection Failed!\n');
        console.error(`Error: ${error.message}\n`);
        console.error('Please check:');
        console.error('1. Your API key is correct');
        console.error('2. You have internet connection');
        console.error('3. Your OpenAI account has credits');
        process.exit(1);
    }
}

testConnection();

