# Task Matrix

A real-time shared task organizer for couples using the Eisenhower Matrix.

## Quick Setup Guide

### Step 1: Set Up Supabase Database

1. Go to your Supabase project: https://supabase.com/dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `setup.sql` into the editor
5. Click **Run** (or press Cmd/Ctrl + Enter)

You should see "Success. No rows returned" - this means the table was created!

### Step 2: Enable Realtime (Important!)

1. In Supabase, go to **Database** → **Replication**
2. Find the `tasks` table
3. Make sure the toggle is **ON** for realtime

### Step 3: Deploy to Vercel

**Option A: One-Click Deploy (Easiest)**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/TaskOrgApp)

**Option B: Manual Deploy**

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click **Add New Project**
3. Import your GitHub repo (or drag & drop the folder)
4. Click **Deploy**

Your app will be live at `https://your-project.vercel.app`

## Using the App

1. **First visit**: Enter the family password (default: `family123`)
2. **Add tasks**: Enter name, select assignee, size, and urgency/importance (on a scale of 1-5)
3. **View matrix**: Tasks appear as colored dots positioned according to their priority
4. **Real-time sync**: Changes sync instantly between devices!

### AI-Powered Task Management

The app now includes AI-powered task management features:

#### Function Calling Tools

The AI can now perform these actions for you:

- **Create Tasks**: "Create a task to organize the garage assigned to Mario"
- **Split Tasks**: "Split the 'Write report' task into research and writing parts"
- **Update Tasks**: "Mark the kitchen cleanup task as completed"
- **Query Tasks**: "Show me all urgent tasks assigned to Maria"

#### Testing Function Calling

Run the test script to verify AI function calling works:

```bash
node test-openai.js
```

This will test both basic connectivity and the new task management function calling features.

#### API Integration

To enable function calling in your chat API calls, add `enableFunctions: true` to your request:

```javascript
const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        message: "Create a task for grocery shopping",
        taskContext: "Current tasks: ...",
        enableFunctions: true  // Enable AI function calling
    })
});
```

When functions are called, the API returns:
- `function_call`: The AI's function call request
- `function_result`: The executed function result
- `original_response`: The full OpenAI response

#### Available Functions

1. **createTask**: Creates new tasks with validation
2. **splitTask**: Splits existing tasks into subtasks
3. **updateTask**: Modifies existing task properties
4. **getTasks**: Queries tasks with filters

## Customization

### Change the Password

In `index.html`, find this line and change it:
```javascript
const FAMILY_PASSWORD = 'family123';
```

## Color Legend

- 🔵 **Blue** - Mario
- 🩷 **Pink** - Maria
- 🟣 **Purple** - Mario Maria Both

## Eisenhower Matrix Quadrants

The app uses a 1-5 scale for Urgency and Importance, positioning tasks continuously on the matrix.

| Quadrant | Urgency | Importance | Action |
|----------|--------|-----------|--------|
| Do First | High (4-5) | High (4-5) | Handle immediately |
| Schedule | Low (1-2) | High (4-5) | Plan time for it |
| Delegate | High (4-5) | Low (1-2) | Consider delegating |
| Eliminate | Low (1-2) | Low (1-2) | Consider dropping |

## Troubleshooting

**Tasks not syncing?**
- Check that Realtime is enabled for the `tasks` table in Supabase
- Refresh the page and check the connection status indicator

**Can't add tasks?**
- Make sure you ran the `setup.sql` script in Supabase
- Check browser console for errors (F12 → Console)

**Forgot password?**
- Clear your browser's localStorage, or
- Change the password in `index.html` and redeploy
