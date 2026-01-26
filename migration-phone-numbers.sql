-- Migration script to add phone numbers to users table
-- Run this in Supabase SQL Editor

-- Add phone column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create index for phone lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Update existing users with their phone numbers (optional - for backward compatibility)
-- These are the hardcoded values from the original config
UPDATE users SET phone = '8458289353' WHERE username = 'mario' AND phone IS NULL;
UPDATE users SET phone = '5186185155' WHERE username = 'maria' AND phone IS NULL;
