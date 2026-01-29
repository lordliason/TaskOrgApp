/**
 * Test utilities and helpers for TaskOrgApp
 * Provides common test setup, mocks, and data fixtures
 */

const { JSDOM } = require('jsdom');

// Mock implementations
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
        order: jest.fn(() => ({
          limit: jest.fn(() => ({
            data: [],
            error: null
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          data: [],
          error: null
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            data: [],
            error: null
          }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: null,
          error: null
        }))
      }))
    }))
  })),
  auth: {
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null }))
  }
};

// Test data fixtures
const testFixtures = {
  // Valid task data
  validTask: {
    id: 'task_123',
    name: 'Test Task',
    assignee: 'mario',
    size: 'm',
    urgent: 3,
    important: 3,
    completed: false,
    icon: '📋',
    first_step: 'Start working',
    completion_criteria: 'Task is done',
    deadline: '2025-12-31',
    depends_on: null,
    parent_task_id: null,
    organization_id: 'org_123'
  },

  // Task creation payload
  taskPayload: {
    name: 'New Task',
    assignee: 'maria',
    size: 'l',
    urgent: 4,
    important: 5,
    icon: '🚀',
    first_step: 'Begin implementation',
    completion_criteria: 'Feature is deployed'
  },

  // Decomposition data
  decompositionResult: {
    parentTask: {
      id: 'parent_123',
      name: 'Plan Vacation',
      assignee: 'both',
      size: 'xl',
      urgent: 3,
      important: 4,
      deadline: '2025-08-15'
    },
    subtasks: [
      {
        id: 'sub_1',
        name: 'Research destinations',
        assignee: 'mario',
        size: 'm',
        urgent: 3,
        important: 4,
        deadline: '2025-07-01',
        depends_on: null
      },
      {
        id: 'sub_2',
        name: 'Book flights',
        assignee: 'maria',
        size: 's',
        urgent: 4,
        important: 5,
        deadline: '2025-07-15',
        depends_on: ['sub_1']
      }
    ],
    matrix_positions: [],
    integrations: [],
    message: 'Task decomposed successfully'
  },

  // User answers for refinement
  userAnswers: [
    {
      question: 'What\'s the overall deadline?',
      response: 'next month'
    },
    {
      question: 'What\'s your budget?',
      response: '$2000'
    }
  ],

  // Organization data
  organization: {
    id: 'org_123',
    name: 'Test Organization',
    members: ['mario', 'maria']
  }
};

// DOM setup helpers
function setupDOM(html = '<html><body></body></html>') {
  const dom = new JSDOM(html, {
    url: 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable'
  });

  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;

  // Mock localStorage
  global.localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  };

  // Mock sessionStorage
  global.sessionStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  };

  return dom;
}

function cleanupDOM() {
  delete global.window;
  delete global.document;
  delete global.navigator;
  delete global.localStorage;
  delete global.sessionStorage;
}

// Mock setup helpers
function mockSupabase() {
  jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => mockSupabaseClient)
  }));

  return mockSupabaseClient;
}

function mockOpenAI() {
  const mockOpenAI = {
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  };

  jest.mock('openai', () => ({
    OpenAI: jest.fn(() => mockOpenAI)
  }));

  return mockOpenAI;
}

function mockFetch(responseData = {}, status = 200) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(responseData),
      text: () => Promise.resolve(JSON.stringify(responseData))
    })
  );

  return global.fetch;
}

// Async test helpers
async function waitForNextTick() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

async function waitForCondition(conditionFn, timeout = 1000, interval = 50) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (conditionFn()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('Condition not met within timeout');
}

// Event testing helpers
function createMockEvent(type, properties = {}) {
  return {
    type,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    target: properties.target || null,
    currentTarget: properties.currentTarget || null,
    ...properties
  };
}

// Component testing helpers
function renderComponent(ComponentClass, props = {}, container = null) {
  if (!container) {
    container = document.createElement('div');
    document.body.appendChild(container);
  }

  const component = new ComponentClass(props);
  component.render(container);

  return { component, container };
}

// Database testing helpers
function createMockDatabaseResponse(data = null, error = null) {
  return {
    data,
    error,
    status: error ? 400 : 200,
    statusText: error ? 'Bad Request' : 'OK'
  };
}

// Assertion helpers
function expectToHaveBeenCalledOnce(mockFn) {
  expect(mockFn).toHaveBeenCalledTimes(1);
}

function expectToHaveBeenCalledWith(mockFn, ...args) {
  expect(mockFn).toHaveBeenCalledWith(...args);
}

function expectAsyncOperation(result) {
  return {
    toResolve: () => expect(result).resolves,
    toReject: () => expect(result).rejects,
    toResolveWith: (expected) => expect(result).resolves.toEqual(expected),
    toRejectWith: (expected) => expect(result).rejects.toThrow(expected)
  };
}

module.exports = {
  // Mocks
  mockSupabaseClient,
  mockSupabase,
  mockOpenAI,
  mockFetch,

  // Fixtures
  testFixtures,

  // DOM helpers
  setupDOM,
  cleanupDOM,

  // Async helpers
  waitForNextTick,
  waitForCondition,

  // Event helpers
  createMockEvent,

  // Component helpers
  renderComponent,

  // Database helpers
  createMockDatabaseResponse,

  // Assertion helpers
  expectToHaveBeenCalledOnce,
  expectToHaveBeenCalledWith,
  expectAsyncOperation
};