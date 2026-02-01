# Push Notifications Setup Guide

This guide walks you through setting up push notifications for TaskOrgApp.

## Generated VAPID Keys

These keys have been generated for your app:

```
Public Key:  BDjf_u3npnua1RXHGvcB3q3JkjHHq6iKVz8se1SkecO1sVutqJuQWlv52R0msbsthOO8GDHHv-rJQuiqhV1eZfs
Private Key: iOKuNzjmAXg-0qy8c1cOeKZ9N2izcfb00Ad7sIEuhRM
```

> **Important**: Keep the private key secret! Never commit it to version control.

---

## Step 1: Environment Variables (Done ✓)

The `.env` file has been created with the VAPID public key:

```bash
VITE_VAPID_PUBLIC_KEY=BDjf_u3npnua1RXHGvcB3q3JkjHHq6iKVz8se1SkecO1sVutqJuQWlv52R0msbsthOO8GDHHv-rJQuiqhV1eZfs
```

Make sure to also add your Supabase credentials to `.env`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Step 2: Run Database Migration

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `schema-notifications.sql`
4. Click **Run**

This creates:
- `notification_preferences` table
- `scheduled_notifications` table
- Automatic triggers for scheduling notifications

---

## Step 3: Deploy Edge Functions

### Option A: Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy the functions
supabase functions deploy send-notifications
supabase functions deploy daily-summary
```

### Option B: Manual Deployment

1. Go to Supabase Dashboard > **Edge Functions**
2. Create a new function called `send-notifications`
3. Copy the code from `supabase/functions/send-notifications/index.ts`
4. Repeat for `daily-summary`

---

## Step 4: Configure Edge Function Secrets

In Supabase Dashboard > **Edge Functions** > **Secrets**, add:

| Secret Name | Value |
|------------|-------|
| `VAPID_PUBLIC_KEY` | `BDjf_u3npnua1RXHGvcB3q3JkjHHq6iKVz8se1SkecO1sVutqJuQWlv52R0msbsthOO8GDHHv-rJQuiqhV1eZfs` |
| `VAPID_PRIVATE_KEY` | `iOKuNzjmAXg-0qy8c1cOeKZ9N2izcfb00Ad7sIEuhRM` |
| `VAPID_EMAIL` | `mailto:your-email@example.com` |

---

## Step 5: Set Up Cron Jobs

In Supabase Dashboard > **Database** > **Cron Jobs** (or use pg_cron extension):

### Send Notifications (every 5 minutes)
```sql
SELECT cron.schedule(
  'send-notifications',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/send-notifications',
    headers := '{"Authorization": "Bearer your-anon-key"}'::jsonb
  );
  $$
);
```

### Daily Summary (every hour)
```sql
SELECT cron.schedule(
  'daily-summary',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/daily-summary',
    headers := '{"Authorization": "Bearer your-anon-key"}'::jsonb
  );
  $$
);
```

---

## Step 6: Test Notifications

1. Run the app: `npm run dev`
2. Log in and go to **Settings**
3. Click **Enable Notifications** and allow the browser prompt
4. Toggle your preferred notification types
5. Click **Save Preferences**

### Test Manually
Create a high-urgency task (urgency 4-5) and assign it to yourself - you should receive an immediate notification.

---

## Troubleshooting

### Notifications not showing?
- Check browser notification permissions (click lock icon in address bar)
- Ensure VAPID keys match between `.env` and Edge Function secrets
- Check browser console for errors

### Edge function errors?
- Verify all secrets are set correctly
- Check Edge Function logs in Supabase Dashboard

### Push subscription failing?
- VAPID public key must be valid base64url format
- Service worker must be registered (check DevTools > Application > Service Workers)

---

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Task Created  │────>│  DB Trigger      │────>│ scheduled_      │
│   or Updated    │     │  (auto-schedule) │     │ notifications   │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                                          v
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User Browser  │<────│  Web Push API    │<────│ Edge Function   │
│   (PWA)         │     │  (FCM/Mozilla)   │     │ (cron job)      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

---

## Security Notes

- VAPID private key should never be exposed client-side
- Row-Level Security (RLS) ensures users only see their own preferences
- Push subscriptions are stored securely in Supabase
- Edge functions run with service role for database access
