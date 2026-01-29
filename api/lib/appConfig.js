/**
 * Centralized backend configuration.
 * Environment variables override defaults. See .env.example for required vars.
 */

const fs = require('fs');
const path = require('path');

const VALID_MODELS = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini'];
const VALID_SIZES = ['xs', 's', 'm', 'l', 'xl'];
const SIZE_MINUTES = { xs: 8, s: 20, m: 45, l: 90, xl: 150 };
const SIZE_LABELS = {
    xs: 'Extra Small (~8min)',
    s: 'Small (~20min)',
    m: 'Medium (~45min)',
    l: 'Large (~90min)',
    xl: 'Extra Large (~150min)'
};

// Valid assignee values: UUIDs for individual members, or 'all' for shared tasks
// Note: Legacy values like 'mario', 'maria', 'both' are NO LONGER supported
// All tasks must use member UUIDs or 'all'

// Function to validate assignee - accepts only UUIDs or 'all'
function isValidAssignee(assignee) {
    if (!assignee) return false;
    // Accept 'all' as a special value for shared tasks
    if (assignee === 'all') return true;
    // Accept UUID format (36 chars with dashes)
    if (typeof assignee === 'string' && assignee.length === 36 && assignee.includes('-')) return true;
    return false;
}

/** @returns {string|undefined} OpenAI API key from env or config.js (local dev) */
function getOpenAIKey() {
    let key = process.env.OPENAI_API_KEY;
    if (key) return key;
    try {
        const configPath = path.join(process.cwd(), 'config.js');
        const content = fs.readFileSync(configPath, 'utf8');
        const match = content.match(/OPENAI_API_KEY\s*=\s*['"]([^'"]+)['"]/);
        if (match && match[1] && match[1] !== 'YOUR_OPENAI_API_KEY_HERE') key = match[1];
    } catch (e) {
        // ignore
    }
    return key;
}

/** 
 * Get Textbelt API key for SMS sending.
 * Phone numbers are stored in the users table and looked up dynamically.
 */
function getTextbeltKey() {
    return process.env.TEXTBELT_API_KEY;
}

module.exports = {
    openai: {
        getApiKey: getOpenAIKey,
        defaultModel: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        validModels: VALID_MODELS
    },
    sms: {
        getTextbeltKey: getTextbeltKey
    },
    tasks: {
        validSizes: VALID_SIZES,
        sizeMinutes: SIZE_MINUTES,
        sizeLabels: SIZE_LABELS,
        isValidAssignee: isValidAssignee
    }
};
