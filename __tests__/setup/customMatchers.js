/**
 * Custom Jest matchers for TaskOrgApp testing
 * Extends Jest with domain-specific assertions
 */

// Custom matchers for task validation
expect.extend({
  // Check if object has valid task structure
  toBeValidTask(received) {
    const pass = received &&
      typeof received === 'object' &&
      received.name &&
      typeof received.name === 'string' &&
      received.assignee &&
      ['mario', 'maria', 'both'].includes(received.assignee) &&
      received.size &&
      ['xs', 's', 'm', 'l', 'xl'].includes(received.size) &&
      typeof received.urgent === 'number' &&
      received.urgent >= 1 && received.urgent <= 5 &&
      typeof received.important === 'number' &&
      received.important >= 1 && received.important <= 5 &&
      typeof received.completed === 'boolean';

    return {
      message: () => `Expected ${received} to be a valid task object`,
      pass
    };
  },

  // Check if task is in correct Eisenhower matrix quadrant
  toBeInMatrixQuadrant(received, quadrant) {
    if (!received || typeof received !== 'object') {
      return {
        message: () => `Expected ${received} to be a task object`,
        pass: false
      };
    }

    const { urgent, important } = received;
    let actualQuadrant;

    if (urgent >= 4 && important >= 4) actualQuadrant = 'do';
    else if (urgent >= 4 && important < 4) actualQuadrant = 'delegate';
    else if (urgent < 4 && important >= 4) actualQuadrant = 'schedule';
    else actualQuadrant = 'delete';

    const pass = actualQuadrant === quadrant;

    return {
      message: () => `Expected task to be in '${quadrant}' quadrant, but it's in '${actualQuadrant}'`,
      pass
    };
  },

  // Check if deadline is valid ISO date string
  toBeValidDeadline(received) {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const pass = typeof received === 'string' && isoDateRegex.test(received);

    return {
      message: () => `Expected ${received} to be a valid deadline (YYYY-MM-DD format)`,
      pass
    };
  },

  // Check if task has valid dependencies (no circular references)
  toHaveValidDependencies(received) {
    if (!received || !Array.isArray(received.depends_on)) {
      return {
        message: () => `Expected task to have depends_on array`,
        pass: false
      };
    }

    // Basic check - depends_on should not contain the task's own ID
    const pass = !received.depends_on.includes(received.id);

    return {
      message: () => `Task ${received.id} has circular dependency on itself`,
      pass
    };
  },

  // Check if DOM element has expected attributes
  toHaveAttributes(received, expectedAttributes) {
    if (!received || !received.getAttribute) {
      return {
        message: () => `Expected ${received} to be a DOM element`,
        pass: false
      };
    }

    let pass = true;
    const failures = [];

    Object.entries(expectedAttributes).forEach(([attr, expectedValue]) => {
      const actualValue = received.getAttribute(attr);
      if (actualValue !== expectedValue) {
        pass = false;
        failures.push(`${attr}: expected "${expectedValue}", got "${actualValue}"`);
      }
    });

    return {
      message: () => `DOM element attributes don't match:\n${failures.join('\n')}`,
      pass
    };
  },

  // Check if array contains tasks with specific assignees
  toContainAssignee(received, assignee) {
    if (!Array.isArray(received)) {
      return {
        message: () => `Expected ${received} to be an array`,
        pass: false
      };
    }

    const pass = received.some(task => task.assignee === assignee);

    return {
      message: () => `Expected array to contain task assigned to ${assignee}`,
      pass
    };
  }
});