/**
 * Component testing helpers
 * Utilities for testing frontend components with jsdom
 */

const { JSDOM } = require('jsdom');

// DOM setup helpers
function setupComponentTest(html = '<html><body><div id="app"></div></body></html>') {
  const dom = new JSDOM(html, {
    url: 'http://localhost:3000',
    pretendToBeVisual: true,
    resources: 'usable'
  });

  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  global.HTMLElement = dom.window.HTMLElement;

  // Mock localStorage and sessionStorage
  global.localStorage = createStorageMock();
  global.sessionStorage = createStorageMock();

  // Mock console for component logging
  global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  };

  return dom;
}

function createStorageMock() {
  const storage = {};
  return {
    getItem: jest.fn(key => storage[key] || null),
    setItem: jest.fn((key, value) => { storage[key] = value; }),
    removeItem: jest.fn(key => { delete storage[key]; }),
    clear: jest.fn(() => { Object.keys(storage).forEach(key => delete storage[key]); }),
    key: jest.fn(index => Object.keys(storage)[index] || null),
    get length() { return Object.keys(storage).length; }
  };
}

// Component rendering helpers
function renderComponent(ComponentClass, props = {}) {
  // Create component instance
  const component = new ComponentClass(props);

  // Create container element
  const container = document.createElement('div');
  container.setAttribute('data-testid', 'component-container');
  document.body.appendChild(container);

  // Render component
  if (component.render) {
    component.render(container);
  }

  return { component, container };
}

function renderTemplate(template, data = {}) {
  // Simple template rendering for testing
  let html = template;

  // Replace {{variable}} with data values
  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, value);
  });

  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);

  return container;
}

// Event simulation helpers
function simulateEvent(element, eventType, eventData = {}) {
  const event = new global.window.Event(eventType, {
    bubbles: true,
    cancelable: true,
    ...eventData
  });

  // Add custom properties to event
  Object.assign(event, eventData);

  element.dispatchEvent(event);
  return event;
}

function simulateClick(element, options = {}) {
  return simulateEvent(element, 'click', options);
}

function simulateInput(element, value, options = {}) {
  element.value = value;
  return simulateEvent(element, 'input', { target: element, ...options });
}

function simulateChange(element, value, options = {}) {
  element.value = value;
  return simulateEvent(element, 'change', { target: element, ...options });
}

function simulateSubmit(form, options = {}) {
  return simulateEvent(form, 'submit', { target: form, ...options });
}

// DOM query helpers
function queryByTestId(testId) {
  return document.querySelector(`[data-testid="${testId}"]`);
}

function queryAllByTestId(testId) {
  return document.querySelectorAll(`[data-testid="${testId}"]`);
}

function queryByText(text) {
  return Array.from(document.querySelectorAll('*')).find(element =>
    element.textContent && element.textContent.trim() === text
  );
}

function queryAllByText(text) {
  return Array.from(document.querySelectorAll('*')).filter(element =>
    element.textContent && element.textContent.trim() === text
  );
}

// Component state helpers
function waitForComponentUpdate(component, conditionFn, timeout = 1000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkCondition = () => {
      if (conditionFn(component)) {
        resolve();
        return;
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error('Component update timeout'));
        return;
      }

      setTimeout(checkCondition, 10);
    };

    checkCondition();
  });
}

function waitForDOMChange(selector, timeout = 1000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const initialState = document.querySelector(selector);

    const checkChange = () => {
      const currentState = document.querySelector(selector);

      if (currentState !== initialState) {
        resolve(currentState);
        return;
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error('DOM change timeout'));
        return;
      }

      setTimeout(checkChange, 10);
    };

    checkChange();
  });
}

// Cleanup helpers
function cleanupComponentTest() {
  // Clear all DOM content
  document.body.innerHTML = '';

  // Clear mocks
  jest.clearAllMocks();

  // Reset storage
  if (global.localStorage) {
    global.localStorage.clear();
  }
  if (global.sessionStorage) {
    global.sessionStorage.clear();
  }
}

// Mock helpers for components
function mockComponentDependencies(component) {
  // Mock common dependencies
  component.api = {
    getTasks: jest.fn().mockResolvedValue({ tasks: [], count: 0 }),
    createTask: jest.fn().mockResolvedValue({ id: 'task_123' }),
    updateTask: jest.fn().mockResolvedValue({ success: true }),
    deleteTask: jest.fn().mockResolvedValue({ success: true })
  };

  component.eventBus = {
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn()
  };

  component.store = {
    getState: jest.fn(() => ({ tasks: [], user: null })),
    dispatch: jest.fn(),
    subscribe: jest.fn()
  };

  return component;
}

// Assertion helpers
function expectToBeVisible(element) {
  expect(element).toBeTruthy();
  expect(element.offsetWidth).toBeGreaterThan(0);
  expect(element.offsetHeight).toBeGreaterThan(0);
}

function expectToBeHidden(element) {
  expect(element.offsetWidth).toBe(0);
  expect(element.offsetHeight).toBe(0);
}

function expectToHaveText(element, text) {
  expect(element.textContent.trim()).toBe(text);
}

function expectToContainText(element, text) {
  expect(element.textContent).toContain(text);
}

function expectToHaveClass(element, className) {
  expect(element.classList.contains(className)).toBe(true);
}

function expectNotToHaveClass(element, className) {
  expect(element.classList.contains(className)).toBe(false);
}

module.exports = {
  // Setup
  setupComponentTest,
  createStorageMock,

  // Rendering
  renderComponent,
  renderTemplate,

  // Events
  simulateEvent,
  simulateClick,
  simulateInput,
  simulateChange,
  simulateSubmit,

  // Queries
  queryByTestId,
  queryAllByTestId,
  queryByText,
  queryAllByText,

  // Async
  waitForComponentUpdate,
  waitForDOMChange,

  // Cleanup
  cleanupComponentTest,

  // Mocks
  mockComponentDependencies,

  // Assertions
  expectToBeVisible,
  expectToBeHidden,
  expectToHaveText,
  expectToContainText,
  expectToHaveClass,
  expectNotToHaveClass
};