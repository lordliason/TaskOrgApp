/**
 * End-to-end tests for task management functionality
 * Tests the complete user workflows from browser to database
 */

import { test, expect } from '@playwright/test';

test.describe('Task Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for the app to load
    await page.waitForSelector('[data-testid="task-matrix"]', { timeout: 10000 });
  });

  test('should load the application successfully', async ({ page }) => {
    // Check that main components are present
    await expect(page.locator('[data-testid="task-matrix"]')).toBeVisible();
    await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible();

    // Check page title
    await expect(page).toHaveTitle(/TaskOrg/);
  });

  test('should create a new task through the form', async ({ page }) => {
    // Open task form (assuming there's a way to open it)
    await page.click('[data-testid="add-task-btn"]');

    // Fill out the form
    await page.fill('[data-testid="task-name-input"]', 'E2E Test Task');
    await page.selectOption('[data-testid="task-assignee-select"]', 'mario');
    await page.fill('[data-testid="urgent-slider"]', '4');
    await page.fill('[data-testid="important-slider"]', '5');

    // Submit the form
    await page.click('[data-testid="submit-button"]');

    // Wait for task to appear in matrix
    await page.waitForSelector('[data-testid="task-item"]:has-text("E2E Test Task")');

    // Verify task appears with correct information
    const taskElement = page.locator('[data-testid="task-item"]:has-text("E2E Test Task")');
    await expect(taskElement).toContainText('mario');
    await expect(taskElement).toHaveClass(/do-quadrant/); // Should be in "Do" quadrant
  });

  test('should display tasks in correct Eisenhower matrix quadrants', async ({ page }) => {
    // Create tasks with different priorities
    const tasks = [
      { name: 'Urgent & Important', urgent: 5, important: 5, quadrant: 'do' },
      { name: 'Not Urgent & Important', urgent: 2, important: 5, quadrant: 'schedule' },
      { name: 'Urgent & Not Important', urgent: 5, important: 2, quadrant: 'delegate' },
      { name: 'Not Urgent & Not Important', urgent: 2, important: 2, quadrant: 'delete' }
    ];

    for (const task of tasks) {
      await page.click('[data-testid="add-task-btn"]');
      await page.fill('[data-testid="task-name-input"]', task.name);
      await page.fill('[data-testid="urgent-slider"]', task.urgent.toString());
      await page.fill('[data-testid="important-slider"]', task.important.toString());
      await page.click('[data-testid="submit-button"]');
      await page.waitForSelector(`[data-testid="task-item"]:has-text("${task.name}")`);
    }

    // Verify tasks are in correct quadrants
    for (const task of tasks) {
      const taskElement = page.locator(`[data-testid="task-item"]:has-text("${task.name}")`);
      await expect(taskElement).toHaveClass(new RegExp(`${task.quadrant}-quadrant`));
    }
  });

  test('should update task status when clicked', async ({ page }) => {
    // Create a task first
    await page.click('[data-testid="add-task-btn"]');
    await page.fill('[data-testid="task-name-input"]', 'Task to Complete');
    await page.click('[data-testid="submit-button"]');
    await page.waitForSelector('[data-testid="task-item"]:has-text("Task to Complete")');

    // Click the task to mark as complete
    await page.click('[data-testid="task-item"]:has-text("Task to Complete")');

    // Verify task shows as completed
    const taskElement = page.locator('[data-testid="task-item"]:has-text("Task to Complete")');
    await expect(taskElement).toHaveClass(/completed/);
  });

  test('should filter tasks by assignee', async ({ page }) => {
    // Create tasks for different assignees
    const tasks = [
      { name: 'Mario Task', assignee: 'mario' },
      { name: 'Maria Task', assignee: 'maria' },
      { name: 'Both Task', assignee: 'both' }
    ];

    for (const task of tasks) {
      await page.click('[data-testid="add-task-btn"]');
      await page.fill('[data-testid="task-name-input"]', task.name);
      await page.selectOption('[data-testid="task-assignee-select"]', task.assignee);
      await page.click('[data-testid="submit-button"]');
      await page.waitForSelector(`[data-testid="task-item"]:has-text("${task.name}")`);
    }

    // Filter by Mario
    await page.selectOption('[data-testid="assignee-filter"]', 'mario');

    // Should only show Mario's tasks
    await expect(page.locator('[data-testid="task-item"]:has-text("Mario Task")')).toBeVisible();
    await expect(page.locator('[data-testid="task-item"]:has-text("Maria Task")')).not.toBeVisible();
    await expect(page.locator('[data-testid="task-item"]:has-text("Both Task")')).not.toBeVisible();
  });

  test('should persist tasks across page reload', async ({ page }) => {
    // Create a task
    await page.click('[data-testid="add-task-btn"]');
    await page.fill('[data-testid="task-name-input"]', 'Persistent Task');
    await page.click('[data-testid="submit-button"]');
    await page.waitForSelector('[data-testid="task-item"]:has-text("Persistent Task")');

    // Reload the page
    await page.reload();
    await page.waitForSelector('[data-testid="task-matrix"]');

    // Task should still be there
    await expect(page.locator('[data-testid="task-item"]:has-text("Persistent Task")')).toBeVisible();
  });

  test('should handle task form validation', async ({ page }) => {
    // Try to submit empty form
    await page.click('[data-testid="add-task-btn"]');
    await page.click('[data-testid="submit-button"]');

    // Should show validation error
    await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="name-error"]')).toContainText('required');

    // Should not create task
    const taskCount = await page.locator('[data-testid="task-item"]').count();
    expect(taskCount).toBe(0);
  });

  test('should show task statistics', async ({ page }) => {
    // Create some tasks
    const tasks = [
      { name: 'Task 1', assignee: 'mario', completed: false },
      { name: 'Task 2', assignee: 'maria', completed: true },
      { name: 'Task 3', assignee: 'both', completed: false }
    ];

    for (const task of tasks) {
      await page.click('[data-testid="add-task-btn"]');
      await page.fill('[data-testid="task-name-input"]', task.name);
      await page.selectOption('[data-testid="task-assignee-select"]', task.assignee);
      if (task.completed) {
        // Note: This assumes there's a way to create completed tasks in the form
        // You might need to adjust based on your actual UI
      }
      await page.click('[data-testid="submit-button"]');
      await page.waitForSelector(`[data-testid="task-item"]:has-text("${task.name}")`);
    }

    // Check statistics
    await expect(page.locator('[data-testid="total-tasks"]')).toContainText('3');
    await expect(page.locator('[data-testid="completed-tasks"]')).toContainText('1');
    await expect(page.locator('[data-testid="pending-tasks"]')).toContainText('2');
  });
});