# AI Planner Autofill Testing Guide

## Overview

The AI-powered daily planner autofill feature intelligently schedules tasks based on:
- Current time (only fills remaining time blocks)
- Task urgency and importance
- Location clustering (especially home tasks)
- "Both" assignee coordination (Mario & Maria together)
- Deadlines and dependencies
- Task sizes and time estimates

## Test Files

### 1. Unit Tests (`__tests__/autofill-planner.test.js`)

Comprehensive unit tests with mocked OpenAI API calls. Tests cover:

- ✅ Time block determination (morning/afternoon/evening based on current time)
- ✅ Task filtering (completed, banked tasks)
- ✅ Task properties in AI prompt (all fields included)
- ✅ "Both" assignee task scheduling
- ✅ Response parsing (JSON, markdown code blocks)
- ✅ Error handling (API errors, invalid JSON, missing structure)
- ✅ Remaining time calculations

**Run unit tests:**
```bash
npm test -- __tests__/autofill-planner.test.js
```

### 2. Integration Test (`test-autofill-planner.js`)

End-to-end test with real OpenAI API (requires API key).

**Run integration test:**
```bash
# Make sure OPENAI_API_KEY is set in environment or config.js
node test-autofill-planner.js
```

## How It Works

### API Endpoint

The function is available via `/api/chat` endpoint:

```javascript
POST /api/chat
{
  "taskContext": {
    "action": "autofillDailyPlan",
    "tasks": [...],
    "currentHour": 14,
    "currentMinutes": 30
  },
  "message": "autofill daily plan",
  "enableFunctions": true
}
```

### Direct Function Call

```javascript
const { autofillDailyPlan } = require('./api/chat');

const result = await autofillDailyPlan({
  tasks: [
    {
      id: 'task1',
      name: 'Buy groceries',
      assignee: 'both',
      size: 'm',
      urgent: 4,
      important: 3,
      location: 'store',
      deadline: null,
      depends_on: null
    }
    // ... more tasks
  ],
  currentHour: 14,  // 2 PM
  currentMinutes: 30
}, apiKey);

if (result.success) {
  console.log(result.plan.mario.morning);  // ['task1', ...]
  console.log(result.plan.maria.morning); // ['task1', ...] (for "both" tasks)
  console.log(result.reasoning);          // AI's explanation
}
```

## Test Scenarios

### Scenario 1: Morning Planning (9:00 AM)
- Should schedule tasks in morning, afternoon, and evening blocks
- High priority tasks should go in morning

### Scenario 2: Afternoon Planning (2:30 PM)
- Should only schedule in afternoon and evening blocks
- Morning block should be empty

### Scenario 3: Evening Planning (7:00 PM)
- Should only schedule in evening block
- Morning and afternoon should be empty

### Scenario 4: Too Late (10:00 PM)
- Should return error: "It's quite late! Consider planning for tomorrow instead."

### Scenario 5: No Tasks
- Should return error: "No pending tasks to schedule"

### Scenario 6: "Both" Assignee Tasks
- Tasks assigned to "both" should appear in the same time block for both Mario and Maria
- Example: If "Cook dinner together" is scheduled in evening, both `plan.mario.evening` and `plan.maria.evening` should contain the task ID

### Scenario 7: Location Clustering
- Tasks with same location (especially "home") should be grouped together
- Example: "Clean kitchen" (home) and "Cook dinner" (home) should be scheduled close together

## Expected Behavior

1. **Time Awareness**: Only fills blocks that haven't passed
2. **Priority**: Higher urgency + importance → scheduled earlier
3. **Deadlines**: Tasks with imminent deadlines get top priority
4. **Location**: Tasks at same location clustered together
5. **Both Tasks**: Scheduled at same time for Mario & Maria
6. **Size Fitting**: Respects time estimates, doesn't overfill
7. **Balance**: Tries to balance workload between Mario and Maria
8. **Dependencies**: Dependent tasks scheduled in correct order

## Troubleshooting

### API Key Not Found
```
Error: OPENAI_API_KEY not found
```
**Solution**: Set `OPENAI_API_KEY` in environment variables or `config.js`

### Invalid Response Format
```
Error: Failed to parse AI scheduling response
```
**Solution**: The AI might have returned invalid JSON. Check the console logs for the raw response.

### No Tasks Scheduled
If AI returns empty plan:
- Check if tasks have valid IDs
- Verify tasks aren't completed or banked
- Check if there's enough time remaining in the day

## Test Results

All 18 unit tests pass ✅

The function is properly exported and can be imported:
```javascript
const { autofillDailyPlan } = require('./api/chat');
// ✅ Function exported: YES
```
