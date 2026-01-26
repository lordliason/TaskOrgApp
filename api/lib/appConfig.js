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

const VALID_ASSIGNEES_CREATE = ['mario', 'maria', 'both', 'all'];
const VALID_ASSIGNEES_UPDATE = ['mario', 'maria', 'both'];

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
 * @returns {{ mario?: string, maria?: string }} SMS recipient phone numbers
 * DEPRECATED: These are fallback values only. Phone numbers are now stored in the users table.
 * The remind.js API will first look up phone numbers from the database, and only fall back
 * to these values for backward compatibility with legacy users (mario/maria).
 */
function getSmsRecipients() {
    return {
        mario: process.env.MARIO_PHONE || '8458289353',
        maria: process.env.MARIA_PHONE || '5186185155'
    };
}

module.exports = {
    openai: {
        getApiKey: getOpenAIKey,
        defaultModel: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        validModels: VALID_MODELS
    },
    sms: {
        getRecipients: getSmsRecipients,
        getTextbeltKey: () => process.env.TEXTBELT_API_KEY
    },
    tasks: {
        validSizes: VALID_SIZES,
        sizeMinutes: SIZE_MINUTES,
        sizeLabels: SIZE_LABELS,
        validAssigneesCreate: VALID_ASSIGNEES_CREATE,
        validAssigneesUpdate: VALID_ASSIGNEES_UPDATE
    }
};
