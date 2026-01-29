/**
 * Advanced Jest configuration for TaskOrgApp
 * Provides comprehensive testing capabilities
 */

module.exports = {
  // Test environment setup
  testEnvironment: 'node',
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },

  // Test discovery
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js',
    '!**/__tests__/e2e/**'
  ],

  // Test organization by type
  projects: [
    {
      displayName: 'unit',
      testMatch: ['**/__tests__/unit/**/*.test.js'],
      testEnvironment: 'node'
    },
    {
      displayName: 'integration',
      testMatch: ['**/__tests__/integration/**/*.test.js'],
      testEnvironment: 'node'
    },
    {
      displayName: 'api',
      testMatch: ['**/__tests__/api/**/*.test.js'],
      testEnvironment: 'node'
    },
    {
      displayName: 'components',
      testMatch: ['**/__tests__/components/**/*.test.js'],
      testEnvironment: 'jsdom'
    },
    {
      displayName: 'utils',
      testMatch: ['**/__tests__/utils/**/*.test.js'],
      testEnvironment: 'node'
    }
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'api/**/*.js',
    'src/**/*.js',
    '!api/**/*.test.js',
    '!src/**/*.test.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/jest.config.js',
    '!**/jest.setup.js',
    '!**/test-helpers.js',
    '!**/mocks.js'
  ],

  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary',
    'cobertura'
  ],

  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    },
    'api/lib/tasks/': {
      branches: 75,
      functions: 85,
      lines: 85,
      statements: 85
    },
    'src/js/components/': {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@api/(.*)$': '<rootDir>/api/$1',
    '^@test/(.*)$': '<rootDir>/__tests__/$1',
    '^@mocks/(.*)$': '<rootDir>/__tests__/mocks/$1'
  },

  // Transform configuration
  transform: {
    '^.+\\.js$': 'babel-jest'
  },

  // ES modules handling
  transformIgnorePatterns: [
    'node_modules/(?!(@exodus/bytes|html-encoding-sniffer|whatwg-encoding|entities|cssstyle)/)'
  ],

  // Setup and teardown
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  setupFiles: ['<rootDir>/__tests__/setup/globalSetup.js'],

  // Test execution
  testTimeout: 10000,
  verbose: true,
  bail: false,
  maxWorkers: '50%',

  // Reporters for CI/CD
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml',
      suiteName: 'TaskOrgApp Tests'
    }],
    ['jest-html-reporter', {
      pageTitle: 'TaskOrgApp Test Report',
      outputPath: 'test-results/report.html',
      includeFailureMsg: true,
      includeConsoleLog: true
    }]
  ],

  // Global configuration
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },

  // Test result processing
  testResultsProcessor: require.resolve('./__tests__/setup/testResultsProcessor.js'),

  // Watch mode configuration
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ]
};