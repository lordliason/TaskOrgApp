# Testing the Intelligent Task Decomposition Agent

## Quick Test

1. **Open your app** (locally or deployed)
2. **Open the AI Assistant chat** (the chat interface in your app)
3. **Try these commands:**

### Basic Decomposition
```
Can you help me decompose "hang wall curtains"?
```

### With More Details
```
Can you decompose "Plan family vacation to Europe" with deadline August 15th?
```

### Complex Task
```
Break down "Redesign company website" into subtasks for Mario and Maria
```

## Expected Behavior

1. **Initial Response**: The AI should create an initial breakdown with 3-6 subtasks
2. **If Questions Needed**: The AI will ask 2-4 clarifying questions like:
   - "What's your budget for this?"
   - "What's the overall deadline?"
   - "Who prefers to handle research?"
3. **After You Answer**: The AI refines the plan and may ask more questions or finalize
4. **Final Result**: You'll see:
   - Parent task created
   - All subtasks created with assignees (Mario/Maria/Both)
   - Deadlines set
   - Dependencies linked
   - Eisenhower matrix positions assigned
   - Integration suggestions (calendar/shopping)

## Troubleshooting

### If AI responds with "Found X tasks" instead of decomposing:

1. **Check the system prompt** - Make sure the API is using the updated prompt
2. **Check function availability** - Verify `decomposeTask` is in the functions list
3. **Try rephrasing** - Use words like "decompose", "break down", "split into subtasks"

### If tasks aren't being created:

1. **Check browser console** - Look for errors in the developer tools
2. **Check database** - Verify Supabase connection is working
3. **Check API logs** - If deployed on Vercel, check function logs

## Manual Testing Script

Run the standalone test:
```bash
node test-decomposition.js
```

This tests all the decomposition functions without needing the full app.

## Database Setup

Make sure you've run the updated `setup.sql` to add:
- `deadline` column
- `depends_on` column  
- `parent_task_id` column

Run in Supabase SQL Editor if you haven't already.

