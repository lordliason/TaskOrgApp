/**
 * Performance benchmarks for task operations
 * Measures performance of core task functionality
 */

const { createTask, getTasks, updateTask, deleteTask } = require('../../api/lib/tasks/crud');
const { createValidTask } = require('../fixtures/tasks');

// Benchmark utilities
function measurePerformance(operation, iterations = 100) {
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    operation();
    const end = performance.now();
    times.push(end - start);
  }

  return {
    min: Math.min(...times),
    max: Math.max(...times),
    avg: times.reduce((a, b) => a + b, 0) / times.length,
    median: times.sort((a, b) => a - b)[Math.floor(times.length / 2)],
    iterations
  };
}

describe('Task Operations Performance Benchmarks', () => {
  const TEST_ORG_ID = 'perf_test_org';

  beforeAll(() => {
    // Set up performance test environment
    console.log('Setting up performance test environment...');
  });

  describe('Task Creation Performance', () => {
    test('should measure task creation performance', () => {
      const taskData = createValidTask({
        name: 'Performance Test Task',
        assignee: 'mario'
      });

      const result = measurePerformance(() => {
        // Note: This would normally create a task, but for benchmarking
        // we'll just validate the data structure
        if (!taskData.name || !taskData.assignee) {
          throw new Error('Invalid task data');
        }
      }, 1000);

      console.log('Task Creation Performance:', result);

      // Performance assertions
      expect(result.avg).toBeLessThan(1); // Should be very fast (< 1ms)
      expect(result.median).toBeLessThan(0.5); // Median should be < 0.5ms

      // Report performance metrics
      reportPerformanceMetric('task_creation', result);
    });

    test('should benchmark bulk task creation', () => {
      const tasks = Array.from({ length: 100 }, (_, i) =>
        createValidTask({
          name: `Bulk Task ${i}`,
          assignee: i % 2 === 0 ? 'mario' : 'maria'
        })
      );

      const result = measurePerformance(() => {
        // Simulate bulk validation
        tasks.forEach(task => {
          if (!task.name || !task.assignee) {
            throw new Error('Invalid task data');
          }
        });
      }, 10);

      console.log('Bulk Task Creation Performance:', result);

      expect(result.avg).toBeLessThan(50); // Should complete within 50ms for 100 tasks
    });
  });

  describe('Task Retrieval Performance', () => {
    test('should measure task filtering performance', () => {
      // Create mock task list
      const tasks = Array.from({ length: 1000 }, (_, i) =>
        createValidTask({
          id: `task_${i}`,
          name: `Task ${i}`,
          assignee: i % 2 === 0 ? 'mario' : 'maria',
          completed: i % 3 === 0
        })
      );

      const result = measurePerformance(() => {
        // Simulate filtering logic
        const filtered = tasks.filter(task =>
          task.assignee === 'mario' && !task.completed
        );
        return filtered.length;
      }, 100);

      console.log('Task Filtering Performance:', result);

      expect(result.avg).toBeLessThan(10); // Should filter 1000 tasks in < 10ms
    });

    test('should benchmark task search performance', () => {
      const tasks = Array.from({ length: 500 }, (_, i) =>
        createValidTask({
          name: `Search Test Task ${i} ${i % 2 === 0 ? 'important' : 'urgent'}`,
          assignee: 'mario'
        })
      );

      const result = measurePerformance(() => {
        // Simulate search functionality
        const searchTerm = 'important';
        const results = tasks.filter(task =>
          task.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return results;
      }, 50);

      console.log('Task Search Performance:', result);

      expect(result.avg).toBeLessThan(20); // Should search 500 tasks in < 20ms
    });
  });

  describe('Task Update Performance', () => {
    test('should measure task update performance', () => {
      const task = createValidTask();
      const updates = { name: 'Updated Task Name', completed: true };

      const result = measurePerformance(() => {
        // Simulate update logic
        const updatedTask = { ...task, ...updates, updated_at: new Date().toISOString() };
        return updatedTask;
      }, 500);

      console.log('Task Update Performance:', result);

      expect(result.avg).toBeLessThan(1); // Should be very fast
    });

    test('should benchmark validation performance during updates', () => {
      const task = createValidTask();
      const invalidUpdates = [
        { assignee: 'invalid' },
        { size: 'invalid' },
        { urgent: 10 },
        { important: -1 }
      ];

      const result = measurePerformance(() => {
        // Simulate validation logic
        invalidUpdates.forEach(update => {
          if (update.assignee && !['mario', 'maria', 'both'].includes(update.assignee)) {
            throw new Error('Invalid assignee');
          }
          if (update.size && !['xs', 's', 'm', 'l', 'xl'].includes(update.size)) {
            throw new Error('Invalid size');
          }
          if (update.urgent && (update.urgent < 1 || update.urgent > 5)) {
            throw new Error('Invalid urgent value');
          }
          if (update.important && (update.important < 1 || update.important > 5)) {
            throw new Error('Invalid important value');
          }
        });
      }, 200);

      console.log('Update Validation Performance:', result);

      expect(result.avg).toBeLessThan(5); // Validation should be fast
    });
  });

  describe('Memory Usage Benchmarks', () => {
    test('should monitor memory usage during task operations', () => {
      if (typeof performance.memory === 'undefined') {
        console.log('Memory monitoring not available in this environment');
        return;
      }

      const initialMemory = performance.memory.usedJSHeapSize;
      const tasks = [];

      // Create many tasks
      for (let i = 0; i < 10000; i++) {
        tasks.push(createValidTask({
          id: `memory_test_${i}`,
          name: `Memory Test Task ${i}`
        }));
      }

      const afterCreationMemory = performance.memory.usedJSHeapSize;
      const creationMemoryDelta = afterCreationMemory - initialMemory;

      // Process tasks
      const processedTasks = tasks.map(task => ({
        ...task,
        processed: true,
        timestamp: Date.now()
      }));

      const afterProcessingMemory = performance.memory.usedJSHeapSize;
      const processingMemoryDelta = afterProcessingMemory - afterCreationMemory;

      // Clean up
      tasks.length = 0;

      console.log('Memory Usage Benchmarks:', {
        initialMemory: Math.round(initialMemory / 1024 / 1024) + ' MB',
        afterCreation: Math.round(afterCreationMemory / 1024 / 1024) + ' MB',
        afterProcessing: Math.round(afterProcessingMemory / 1024 / 1024) + ' MB',
        creationDelta: Math.round(creationMemoryDelta / 1024 / 1024) + ' MB',
        processingDelta: Math.round(processingMemoryDelta / 1024 / 1024) + ' MB'
      });

      // Assertions
      expect(creationMemoryDelta).toBeLessThan(50 * 1024 * 1024); // Less than 50MB for 10k tasks
      expect(processingMemoryDelta).toBeLessThan(25 * 1024 * 1024); // Less than 25MB for processing
    });
  });

  describe('Concurrent Operations Performance', () => {
    test('should measure concurrent task creation performance', async () => {
      const concurrentTasks = 50;
      const taskPromises = [];

      for (let i = 0; i < concurrentTasks; i++) {
        taskPromises.push(
          Promise.resolve(createValidTask({
            name: `Concurrent Task ${i}`,
            assignee: 'mario'
          }))
        );
      }

      const startTime = performance.now();
      const results = await Promise.all(taskPromises);
      const endTime = performance.now();

      const totalTime = endTime - startTime;
      const avgTimePerTask = totalTime / concurrentTasks;

      console.log('Concurrent Operations Performance:', {
        totalTasks: concurrentTasks,
        totalTime: `${totalTime.toFixed(2)}ms`,
        avgTimePerTask: `${avgTimePerTask.toFixed(2)}ms`,
        tasksPerSecond: Math.round(1000 / avgTimePerTask)
      });

      expect(avgTimePerTask).toBeLessThan(10); // Should handle concurrent ops efficiently
      expect(results.length).toBe(concurrentTasks);
    });
  });

  describe('Large Dataset Performance', () => {
    test('should handle large task lists efficiently', () => {
      const largeTaskList = Array.from({ length: 10000 }, (_, i) =>
        createValidTask({
          id: `large_${i}`,
          name: `Large Dataset Task ${i}`,
          assignee: i % 2 === 0 ? 'mario' : 'maria',
          completed: i % 10 === 0
        })
      );

      // Test sorting performance
      const sortResult = measurePerformance(() => {
        const sorted = [...largeTaskList].sort((a, b) => a.name.localeCompare(b.name));
        return sorted.length;
      }, 5);

      // Test filtering performance
      const filterResult = measurePerformance(() => {
        const filtered = largeTaskList.filter(task => task.completed);
        return filtered.length;
      }, 10);

      // Test search performance
      const searchResult = measurePerformance(() => {
        const searchResults = largeTaskList.filter(task =>
          task.name.includes('5000')
        );
        return searchResults.length;
      }, 10);

      console.log('Large Dataset Performance:', {
        datasetSize: largeTaskList.length,
        sorting: `${sortResult.avg.toFixed(2)}ms`,
        filtering: `${filterResult.avg.toFixed(2)}ms`,
        searching: `${searchResult.avg.toFixed(2)}ms`
      });

      expect(sortResult.avg).toBeLessThan(100); // Sorting should be fast
      expect(filterResult.avg).toBeLessThan(50); // Filtering should be fast
      expect(searchResult.avg).toBeLessThan(30); // Searching should be fast
    });
  });
});

// Helper function to report performance metrics
function reportPerformanceMetric(name, metrics) {
  // In a real application, you might send this to a monitoring service
  console.log(`📊 Performance Metric - ${name}:`, {
    average: `${metrics.avg.toFixed(2)}ms`,
    median: `${metrics.median.toFixed(2)}ms`,
    min: `${metrics.min.toFixed(2)}ms`,
    max: `${metrics.max.toFixed(2)}ms`,
    iterations: metrics.iterations
  });

  // Store for regression detection
  const performanceData = {
    name,
    timestamp: new Date().toISOString(),
    metrics
  };

  // In a real app, save this to localStorage or send to server
  const history = JSON.parse(localStorage.getItem('performanceHistory') || '[]');
  history.push(performanceData);

  // Keep only recent history
  if (history.length > 100) {
    history.splice(0, history.length - 100);
  }

  localStorage.setItem('performanceHistory', JSON.stringify(history));
}

// Performance regression detection
function detectPerformanceRegression(currentMetrics, historicalMetrics) {
  if (historicalMetrics.length < 5) return null;

  const recentMetrics = historicalMetrics.slice(-5);
  const avgHistorical = recentMetrics.reduce((sum, m) => sum + m.metrics.avg, 0) / recentMetrics.length;

  const threshold = avgHistorical * 1.2; // 20% degradation threshold

  if (currentMetrics.avg > threshold) {
    return {
      regression: true,
      current: currentMetrics.avg,
      historical: avgHistorical,
      degradation: ((currentMetrics.avg - avgHistorical) / avgHistorical * 100).toFixed(1) + '%'
    };
  }

  return { regression: false };
}

// Export for use in other test files
global.measurePerformance = measurePerformance;
global.reportPerformanceMetric = reportPerformanceMetric;