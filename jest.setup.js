// Jest setup file for DOM testing
// This file runs before each test file

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    // Uncomment to silence console.log during tests
    // log: jest.fn(),
    // debug: jest.fn(),
    // info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};
