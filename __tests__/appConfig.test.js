/**
 * Unit tests for appConfig module.
 * Tests: getOpenAIKey, getSmsRecipients, configuration constants
 */

// Store original env values
const originalEnv = { ...process.env };

// Create a mock implementation that can be controlled
let mockReadFileSync = jest.fn();

// Mock fs module
jest.mock('fs', () => ({
    readFileSync: (...args) => mockReadFileSync(...args)
}));

describe('appConfig', () => {
    beforeEach(() => {
        // Clear module cache to ensure fresh import with mocked env
        jest.resetModules();
        // Reset env to original
        process.env = { ...originalEnv };
        // Reset the mock function
        mockReadFileSync = jest.fn(() => {
            throw new Error('ENOENT: no such file');
        });
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe('openai configuration', () => {
        describe('getApiKey', () => {
            test('should return API key from environment variable', () => {
                process.env.OPENAI_API_KEY = 'test-api-key-from-env';
                const config = require('../api/lib/appConfig');

                const key = config.openai.getApiKey();
                expect(key).toBe('test-api-key-from-env');
            });

            test('should return key from config.js when env var is not set', () => {
                delete process.env.OPENAI_API_KEY;
                mockReadFileSync = jest.fn().mockReturnValue(`
                    const OPENAI_API_KEY = 'key-from-config-file';
                    module.exports = { OPENAI_API_KEY };
                `);

                const config = require('../api/lib/appConfig');
                const key = config.openai.getApiKey();

                expect(key).toBe('key-from-config-file');
            });

            test('should handle double-quoted key in config.js', () => {
                delete process.env.OPENAI_API_KEY;
                mockReadFileSync = jest.fn().mockReturnValue(`OPENAI_API_KEY = "double-quoted-key"`);

                const config = require('../api/lib/appConfig');
                const key = config.openai.getApiKey();

                expect(key).toBe('double-quoted-key');
            });

            test('should ignore placeholder key in config.js', () => {
                delete process.env.OPENAI_API_KEY;
                mockReadFileSync = jest.fn().mockReturnValue(`OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY_HERE'`);

                const config = require('../api/lib/appConfig');
                const key = config.openai.getApiKey();

                expect(key).toBeUndefined();
            });

            test('should return undefined when config.js does not exist', () => {
                delete process.env.OPENAI_API_KEY;
                mockReadFileSync = jest.fn(() => {
                    throw new Error('ENOENT: no such file');
                });

                const config = require('../api/lib/appConfig');
                const key = config.openai.getApiKey();

                expect(key).toBeUndefined();
            });

            test('should return undefined when config.js has no matching key', () => {
                delete process.env.OPENAI_API_KEY;
                mockReadFileSync = jest.fn().mockReturnValue(`const OTHER_KEY = 'some-value';`);

                const config = require('../api/lib/appConfig');
                const key = config.openai.getApiKey();

                expect(key).toBeUndefined();
            });

            test('should prioritize env var over config.js', () => {
                process.env.OPENAI_API_KEY = 'env-key';
                mockReadFileSync = jest.fn().mockReturnValue(`OPENAI_API_KEY = 'file-key'`);

                const config = require('../api/lib/appConfig');
                const key = config.openai.getApiKey();

                expect(key).toBe('env-key');
            });
        });

        describe('defaultModel', () => {
            test('should return model from env var when set', () => {
                process.env.OPENAI_MODEL = 'gpt-4';
                const config = require('../api/lib/appConfig');

                expect(config.openai.defaultModel).toBe('gpt-4');
            });

            test('should default to gpt-3.5-turbo when env var is not set', () => {
                delete process.env.OPENAI_MODEL;
                const config = require('../api/lib/appConfig');

                expect(config.openai.defaultModel).toBe('gpt-3.5-turbo');
            });
        });

        describe('validModels', () => {
            test('should contain expected model options', () => {
                const config = require('../api/lib/appConfig');

                expect(config.openai.validModels).toContain('gpt-3.5-turbo');
                expect(config.openai.validModels).toContain('gpt-4');
                expect(config.openai.validModels).toContain('gpt-4-turbo');
                expect(config.openai.validModels).toContain('gpt-4o');
                expect(config.openai.validModels).toContain('gpt-4o-mini');
            });

            test('should have exactly 5 valid models', () => {
                const config = require('../api/lib/appConfig');
                expect(config.openai.validModels).toHaveLength(5);
            });
        });
    });

    describe('sms configuration', () => {
        describe('getRecipients', () => {
            test('should return phone numbers from env vars when set', () => {
                process.env.MARIO_PHONE = '1234567890';
                process.env.MARIA_PHONE = '0987654321';

                const config = require('../api/lib/appConfig');
                const recipients = config.sms.getRecipients();

                expect(recipients.mario).toBe('1234567890');
                expect(recipients.maria).toBe('0987654321');
            });

            test('should return default phone numbers when env vars not set', () => {
                delete process.env.MARIO_PHONE;
                delete process.env.MARIA_PHONE;

                const config = require('../api/lib/appConfig');
                const recipients = config.sms.getRecipients();

                expect(recipients.mario).toBe('8458289353');
                expect(recipients.maria).toBe('5186185155');
            });

            test('should mix env and defaults when only one is set', () => {
                process.env.MARIO_PHONE = '1111111111';
                delete process.env.MARIA_PHONE;

                const config = require('../api/lib/appConfig');
                const recipients = config.sms.getRecipients();

                expect(recipients.mario).toBe('1111111111');
                expect(recipients.maria).toBe('5186185155');
            });
        });

        describe('getTextbeltKey', () => {
            test('should return textbelt key from env var', () => {
                process.env.TEXTBELT_API_KEY = 'textbelt-test-key';

                const config = require('../api/lib/appConfig');
                const key = config.sms.getTextbeltKey();

                expect(key).toBe('textbelt-test-key');
            });

            test('should return undefined when env var not set', () => {
                delete process.env.TEXTBELT_API_KEY;

                const config = require('../api/lib/appConfig');
                const key = config.sms.getTextbeltKey();

                expect(key).toBeUndefined();
            });
        });
    });

    describe('tasks configuration', () => {
        let config;

        beforeEach(() => {
            config = require('../api/lib/appConfig');
        });

        describe('validSizes', () => {
            test('should contain all expected sizes', () => {
                expect(config.tasks.validSizes).toEqual(['xs', 's', 'm', 'l', 'xl']);
            });

            test('should have exactly 5 sizes', () => {
                expect(config.tasks.validSizes).toHaveLength(5);
            });
        });

        describe('sizeMinutes', () => {
            test('should map sizes to correct minute values', () => {
                expect(config.tasks.sizeMinutes).toEqual({
                    xs: 8,
                    s: 20,
                    m: 45,
                    l: 90,
                    xl: 150
                });
            });

            test('should have entries for all valid sizes', () => {
                config.tasks.validSizes.forEach(size => {
                    expect(config.tasks.sizeMinutes[size]).toBeDefined();
                    expect(typeof config.tasks.sizeMinutes[size]).toBe('number');
                });
            });
        });

        describe('sizeLabels', () => {
            test('should have labels for all sizes', () => {
                expect(config.tasks.sizeLabels.xs).toBe('Extra Small (~8min)');
                expect(config.tasks.sizeLabels.s).toBe('Small (~20min)');
                expect(config.tasks.sizeLabels.m).toBe('Medium (~45min)');
                expect(config.tasks.sizeLabels.l).toBe('Large (~90min)');
                expect(config.tasks.sizeLabels.xl).toBe('Extra Large (~150min)');
            });

            test('should have entries for all valid sizes', () => {
                config.tasks.validSizes.forEach(size => {
                    expect(config.tasks.sizeLabels[size]).toBeDefined();
                    expect(typeof config.tasks.sizeLabels[size]).toBe('string');
                });
            });
        });

        describe('validAssigneesCreate', () => {
            test('should contain expected assignee options for creation', () => {
                expect(config.tasks.validAssigneesCreate).toEqual(['mario', 'maria', 'both', 'all']);
            });
        });

        describe('validAssigneesUpdate', () => {
            test('should contain expected assignee options for update', () => {
                expect(config.tasks.validAssigneesUpdate).toEqual(['mario', 'maria', 'both']);
            });

            test('should not include "all" option', () => {
                expect(config.tasks.validAssigneesUpdate).not.toContain('all');
            });
        });
    });
});
