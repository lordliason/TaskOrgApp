// Jest setup file for TaskOrgApp
// This file runs before each test file

// Load custom matchers
require('./__tests__/setup/customMatchers');

// Load test utilities globally
const testUtils = require('./__tests__/setup/testUtils');
global.testUtils = testUtils;

// Mock console methods to reduce noise in tests
// Comment out to see console output during debugging
global.console = {
  ...console,
  // Uncomment these to silence during normal testing
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test hooks
beforeAll(() => {
  // Setup before all tests
  jest.setTimeout(10000); // 10 second timeout for async tests
});

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();

  // Reset console mocks
  console.warn.mockClear();
  console.error.mockClear();
});

afterEach(() => {
  // Cleanup after each test
  // Reset DOM if it was set up
  if (global.window) {
    delete global.window;
    delete global.document;
    delete global.navigator;
  }
});

// Global test utilities available in all test files
global.createValidTask = (overrides = {}) => ({
  id: `task_${Date.now()}`,
  name: 'Test Task',
  assignee: 'mario',
  size: 'm',
  urgent: 3,
  important: 3,
  completed: false,
  icon: '📋',
  first_step: null,
  completion_criteria: null,
  deadline: null,
  depends_on: null,
  parent_task_id: null,
  organization_id: 'org_test',
  ...overrides
});

global.createTaskPayload = (overrides = {}) => ({
  name: 'New Task',
  assignee: 'maria',
  size: 's',
  urgent: 2,
  important: 4,
  icon: '🚀',
  first_step: 'Start working',
  completion_criteria: 'Task completed',
  ...overrides
});

// Helper to create mock DOM elements
global.createMockElement = (tagName = 'div', attributes = {}) => {
  const element = {
    tagName: tagName.toUpperCase(),
    getAttribute: jest.fn((name) => attributes[name] || null),
    setAttribute: jest.fn(),
    removeAttribute: jest.fn(),
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(),
      toggle: jest.fn()
    },
    style: {},
    children: [],
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    innerHTML: '',
    textContent: '',
    ...attributes
  };
  return element;
};