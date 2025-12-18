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
