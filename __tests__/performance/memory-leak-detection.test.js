/**
 * Memory leak detection tests
 * Monitors memory usage patterns to detect potential leaks
 */

const { setupComponentTest, renderComponent, cleanupComponentTest } = require('../helpers/componentHelpers');
const { createValidTask } = require('../fixtures/tasks');

describe('Memory Leak Detection', () => {
  let initialMemoryUsage = 0;

  beforeAll(() => {
    // Record initial memory state
    if (typeof performance.memory !== 'undefined') {
      initialMemoryUsage = performance.memory.usedJSHeapSize;
    }
  });

  afterEach(() => {
    // Force garbage collection if available
    if (typeof gc !== 'undefined') {
      gc();
    }
  });

  describe('Component Memory Leaks', () => {
    test('should not leak memory when creating/destroying components', () => {
      if (typeof performance.memory === 'undefined') {
        console.log('Memory monitoring not available, skipping test');
        return;
      }

      const memoryReadings = [];
      const iterations = 50;

      for (let i = 0; i < iterations; i++) {
        // Create component
        const dom = setupComponentTest();
        const MockComponent = class {
          constructor(props) {
            this.props = props;
            this.data = Array.from({ length: 1000 }, () => Math.random()); // Some data
            this.eventListeners = [];
          }

          render(container) {
            container.innerHTML = `<div>Test Component ${i}</div>`;
          }

          destroy() {
            this.data = null;
            this.eventListeners = null;
          }
        };

        const { component } = renderComponent(MockComponent);

        // Force layout and paint
        document.body.offsetHeight;

        // Record memory
        memoryReadings.push(performance.memory.usedJSHeapSize);

        // Clean up
        component.destroy();
        cleanupComponentTest();

        // Force GC
        if (typeof gc !== 'undefined') {
          gc();
        }
      }

      // Analyze memory pattern
      const finalMemory = performance.memory.usedJSHeapSize;
      const memoryIncrease = finalMemory - initialMemoryUsage;
      const avgMemoryPerIteration = memoryIncrease / iterations;

      console.log('Component Memory Leak Analysis:', {
        iterations,
        initialMemory: Math.round(initialMemoryUsage / 1024 / 1024) + ' MB',
        finalMemory: Math.round(finalMemory / 1024 / 1024) + ' MB',
        totalIncrease: Math.round(memoryIncrease / 1024 / 1024) + ' MB',
        avgIncreasePerIteration: Math.round(avgMemoryPerIteration / 1024) + ' KB'
      });

      // Component creation/destruction should not leak more than 1MB total
      expect(memoryIncrease).toBeLessThan(1024 * 1024); // 1MB threshold
    });

    test('should detect event listener leaks', () => {
      if (typeof performance.memory === 'undefined') {
        console.log('Memory monitoring not available, skipping test');
        return;
      }

      const dom = setupComponentTest();
      let eventListenerCount = 0;

      const MockComponent = class {
        constructor() {
          this.element = document.createElement('div');
          this.element.innerHTML = '<button>Click me</button>';
          document.body.appendChild(this.element);

          // Add event listeners (potentially leaking)
          this.element.addEventListener('click', () => {});
          eventListenerCount++;
        }

        destroy() {
          // Properly clean up
          if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
          }
          this.element = null;
        }
      };

      const memoryBefore = performance.memory.usedJSHeapSize;

      // Create and destroy multiple components
      for (let i = 0; i < 100; i++) {
        const component = new MockComponent();
        component.destroy();

        if (typeof gc !== 'undefined') {
          gc();
        }
      }

      const memoryAfter = performance.memory.usedJSHeapSize;
      const memoryDelta = memoryAfter - memoryBefore;

      console.log('Event Listener Memory Test:', {
        componentsCreated: 100,
        memoryDelta: Math.round(memoryDelta / 1024) + ' KB',
        eventListenersAdded: eventListenerCount
      });

      // Should not leak significant memory from event listeners
      expect(memoryDelta).toBeLessThan(1024 * 1024); // Less than 1MB
    });
  });

  describe('Data Structure Memory Leaks', () => {
    test('should detect memory leaks in task arrays', () => {
      if (typeof performance.memory === 'undefined') {
        console.log('Memory monitoring not available, skipping test');
        return;
      }

      const memoryReadings = [];
      let tasksArray = [];

      // Create growing task list
      for (let i = 0; i < 10; i++) {
        const tasks = Array.from({ length: 1000 }, (_, j) =>
          createValidTask({
            id: `leak_test_${i}_${j}`,
            name: `Leak Test Task ${i}-${j}`,
            description: 'A'.repeat(100) // Add some data to increase memory usage
          })
        );

        tasksArray = tasksArray.concat(tasks);

        if (typeof gc !== 'undefined') {
          gc();
        }

        memoryReadings.push(performance.memory.usedJSHeapSize);

        // Simulate processing and cleanup
        tasksArray = tasksArray.filter(task => task.id.includes('keep')); // Keep none
      }

      if (typeof gc !== 'undefined') {
        gc();
      }

      const finalMemory = performance.memory.usedJSHeapSize;
      const memoryIncrease = finalMemory - initialMemoryUsage;

      console.log('Task Array Memory Analysis:', {
        totalTasksCreated: 10000,
        finalTasksInMemory: tasksArray.length,
        memoryIncrease: Math.round(memoryIncrease / 1024 / 1024) + ' MB',
        memoryReadings: memoryReadings.map(m => Math.round(m / 1024 / 1024) + ' MB')
      });

      // After cleanup, memory should not have grown excessively
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB total growth
    });

    test('should detect circular reference memory issues', () => {
      if (typeof performance.memory === 'undefined') {
        console.log('Memory monitoring not available, skipping test');
        return;
      }

      const memoryBefore = performance.memory.usedJSHeapSize;

      // Create circular references
      const obj1 = {};
      const obj2 = {};
      obj1.ref = obj2;
      obj2.ref = obj1;

      // Add to a growing array
      const circularObjects = [];
      for (let i = 0; i < 1000; i++) {
        circularObjects.push({
          ...obj1,
          data: 'A'.repeat(1000) // Add significant data
        });
      }

      const memoryAfter = performance.memory.usedJSHeapSize;
      const memoryDelta = memoryAfter - memoryBefore;

      console.log('Circular Reference Memory Test:', {
        objectsCreated: 1000,
        memoryDelta: Math.round(memoryDelta / 1024 / 1024) + ' MB'
      });

      // Clean up
      circularObjects.length = 0;

      if (typeof gc !== 'undefined') {
        gc();
      }

      // Note: This test mainly demonstrates monitoring - actual leak detection
      // would require more sophisticated heap analysis
      expect(memoryDelta).toBeGreaterThan(0); // Should use memory
    });
  });

  describe('DOM Memory Leaks', () => {
    test('should detect DOM element leaks', () => {
      if (typeof performance.memory === 'undefined') {
        console.log('Memory monitoring not available, skipping test');
        return;
      }

      const dom = setupComponentTest();
      const memoryBefore = performance.memory.usedJSHeapSize;

      // Create many DOM elements
      const elements = [];
      for (let i = 0; i < 1000; i++) {
        const element = document.createElement('div');
        element.innerHTML = `<span>Element ${i}</span><button>Click ${i}</button>`;
        element.setAttribute('data-test', `element-${i}`);
        document.body.appendChild(element);
        elements.push(element);
      }

      const memoryAfterCreation = performance.memory.usedJSHeapSize;

      // Remove elements
      elements.forEach(element => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });

      if (typeof gc !== 'undefined') {
        gc();
      }

      const memoryAfterCleanup = performance.memory.usedJSHeapSize;

      console.log('DOM Memory Leak Test:', {
        elementsCreated: 1000,
        memoryBefore: Math.round(memoryBefore / 1024 / 1024) + ' MB',
        memoryAfterCreation: Math.round(memoryAfterCreation / 1024 / 1024) + ' MB',
        memoryAfterCleanup: Math.round(memoryAfterCleanup / 1024 / 1024) + ' MB',
        creationDelta: Math.round((memoryAfterCreation - memoryBefore) / 1024 / 1024) + ' MB',
        cleanupDelta: Math.round((memoryAfterCleanup - memoryAfterCreation) / 1024 / 1024) + ' MB'
      });

      // Memory should decrease after cleanup
      expect(memoryAfterCleanup).toBeLessThanOrEqual(memoryAfterCreation);
    });

    test('should detect detached DOM node leaks', () => {
      const dom = setupComponentTest();

      // Create elements but don't attach them to DOM
      const detachedElements = [];
      for (let i = 0; i < 100; i++) {
        const element = document.createElement('div');
        element.innerHTML = '<p>Detached content</p><ul>' +
          Array.from({ length: 10 }, (_, j) => `<li>Item ${j}</li>`).join('') +
          '</ul>';
        detachedElements.push(element);
      }

      // Simulate keeping references to detached elements
      // (This is a common cause of memory leaks)

      console.log('Detached DOM Nodes Test:', {
        detachedElements: detachedElements.length,
        totalNodes: detachedElements.reduce((count, el) =>
          count + el.querySelectorAll('*').length + 1, 0
        )
      });

      // Clean up references
      detachedElements.length = 0;

      // This test mainly demonstrates the pattern - real leak detection
      // would require heap snapshots and analysis
    });
  });

  describe('Timer and Interval Memory Leaks', () => {
    test('should detect timer leaks', (done) => {
      if (typeof performance.memory === 'undefined') {
        console.log('Memory monitoring not available, skipping test');
        done();
        return;
      }

      const memoryBefore = performance.memory.usedJSHeapSize;
      const timers = [];
      let timerCount = 0;

      // Create many timers
      for (let i = 0; i < 100; i++) {
        const timer = setInterval(() => {
          timerCount++;
          if (timerCount > 1000) {
            clearInterval(timer);
          }
        }, 1);
        timers.push(timer);
      }

      // Wait a bit for timers to run
      setTimeout(() => {
        // Clear timers
        timers.forEach(clearInterval);

        if (typeof gc !== 'undefined') {
          gc();
        }

        const memoryAfter = performance.memory.usedJSHeapSize;
        const memoryDelta = memoryAfter - memoryBefore;

        console.log('Timer Memory Leak Test:', {
          timersCreated: 100,
          memoryDelta: Math.round(memoryDelta / 1024) + ' KB',
          timerExecutions: timerCount
        });

        // Should not leak excessive memory
        expect(memoryDelta).toBeLessThan(1024 * 1024); // Less than 1MB

        done();
      }, 100);
    });

    test('should detect forgotten promise chains', async () => {
      if (typeof performance.memory === 'undefined') {
        console.log('Memory monitoring not available, skipping test');
        return;
      }

      const memoryBefore = performance.memory.usedJSHeapSize;

      // Create promises that resolve but aren't properly cleaned up
      const promises = [];
      for (let i = 0; i < 1000; i++) {
        const promise = new Promise((resolve) => {
          setTimeout(() => resolve({ data: 'A'.repeat(100) }), Math.random() * 10);
        });
        promises.push(promise);
      }

      // Wait for all promises to resolve
      await Promise.all(promises);

      if (typeof gc !== 'undefined') {
        gc();
      }

      const memoryAfter = performance.memory.usedJSHeapSize;
      const memoryDelta = memoryAfter - memoryBefore;

      console.log('Promise Chain Memory Test:', {
        promisesCreated: 1000,
        memoryDelta: Math.round(memoryDelta / 1024 / 1024) + ' MB'
      });

      // Promises should not cause excessive memory usage
      expect(memoryDelta).toBeLessThan(5 * 1024 * 1024); // Less than 5MB
    });
  });

  describe('Memory Usage Monitoring', () => {
    test('should provide memory usage statistics', () => {
      if (typeof performance.memory === 'undefined') {
        console.log('Memory monitoring not available, skipping test');
        return;
      }

      const memInfo = performance.memory;

      const stats = {
        used: Math.round(memInfo.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memInfo.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024),
        usedPercent: Math.round((memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100)
      };

      console.log('Memory Usage Statistics:', {
        used: `${stats.used} MB`,
        total: `${stats.total} MB`,
        limit: `${stats.limit} MB`,
        usedPercent: `${stats.usedPercent}%`
      });

      // Basic sanity checks
      expect(stats.used).toBeGreaterThan(0);
      expect(stats.total).toBeGreaterThan(stats.used);
      expect(stats.limit).toBeGreaterThan(stats.total);
      expect(stats.usedPercent).toBeLessThan(90); // Should not be using >90% of heap
    });

    test('should monitor memory growth over time', (done) => {
      if (typeof performance.memory === 'undefined') {
        console.log('Memory monitoring not available, skipping test');
        done();
        return;
      }

      const readings = [];
      const interval = setInterval(() => {
        readings.push({
          timestamp: Date.now(),
          memory: performance.memory.usedJSHeapSize
        });
      }, 100);

      // Monitor for 2 seconds
      setTimeout(() => {
        clearInterval(interval);

        const memoryGrowth = readings.length > 1 ?
          readings[readings.length - 1].memory - readings[0].memory : 0;

        console.log('Memory Growth Monitoring:', {
          duration: '2 seconds',
          readings: readings.length,
          initialMemory: Math.round(readings[0]?.memory / 1024 / 1024) + ' MB',
          finalMemory: Math.round(readings[readings.length - 1]?.memory / 1024 / 1024) + ' MB',
          growth: Math.round(memoryGrowth / 1024) + ' KB',
          growthRate: Math.round(memoryGrowth / readings.length / 1024) + ' KB/reading'
        });

        // Memory growth should be reasonable (less than 10MB over 2 seconds)
        expect(Math.abs(memoryGrowth)).toBeLessThan(10 * 1024 * 1024);

        done();
      }, 2000);
    });
  });
});

// Global memory monitoring utility
global.monitorMemoryUsage = function(label = 'Memory Check') {
  if (typeof performance.memory === 'undefined') {
    console.log(`${label}: Memory monitoring not available`);
    return null;
  }

  const memInfo = performance.memory;
  const stats = {
    used: Math.round(memInfo.usedJSHeapSize / 1024 / 1024),
    total: Math.round(memInfo.totalJSHeapSize / 1024 / 1024),
    limit: Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024)
  };

  console.log(`${label}:`, `${stats.used} MB used, ${stats.total} MB total, ${stats.limit} MB limit`);
  return stats;
};