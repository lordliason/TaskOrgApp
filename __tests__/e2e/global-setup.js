/**
 * Global setup for Playwright E2E tests
 * Sets up test environment before all tests run
 */

const { chromium } = require('@playwright/test');

module.exports = async (config) => {
  // Set up test database or mock data
  console.log('Setting up E2E test environment...');

  // You can set up test data, start services, etc. here
  // For example, you might want to:
  // - Seed a test database
  // - Set up mock API responses
  // - Configure test users

  // Example: Set environment variables for tests
  process.env.E2E_TEST = 'true';
  process.env.NODE_ENV = 'test';

  // Example: Pre-create test data via API
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // You could use this to set up initial test data
    // await page.goto(`${config.use.baseURL}/api/test-setup`);
    // await page.waitForLoadState();

    await browser.close();
    console.log('E2E test environment setup complete');
  } catch (error) {
    console.error('Failed to set up E2E test environment:', error);
    throw error;
  }
};