/**
 * Global setup for Jest tests
 * Runs once before all test suites
 */

const fs = require('fs');
const path = require('path');

// Ensure test directories exist
const testDirs = [
  'coverage',
  'test-results',
  '__tests__/mocks',
  '__tests__/fixtures',
  '__tests__/unit',
  '__tests__/integration',
  '__tests__/api',
  '__tests__/components',
  '__tests__/utils',
  '__tests__/performance',
  '__tests__/e2e'
];

testDirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Set up global test environment variables
process.env.NODE_ENV = 'test';
process.env.TASKORG_TEST = 'true';

// Mock environment variables for testing
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.OPENAI_API_KEY = 'test-openai-key';

// Global error handler for tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in test environment
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process in test environment
});