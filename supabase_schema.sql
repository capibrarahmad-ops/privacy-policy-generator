-- ==============================================================================
-- PrivacyFlow: Supabase Database Schema & Migration
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/nowlzmlmnpwgtakotcpg/sql
-- ==============================================================================

-- 1. Base Table Creation (if not already existing)
CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  website_url VARCHAR(500) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  country VARCHAR(100) NOT NULL,
  edit_token VARCHAR(64) NOT NULL,
  form_data JSONB NOT NULL,
  generated_policy JSONB NOT NULL,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Schema Migration: Add User Ownership, Description, and Publication Status
ALTER TABLE policies
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- 3. Indexes for High-Performance Lookups
CREATE INDEX IF NOT EXISTS idx_policies_slug ON policies(slug);
CREATE INDEX IF NOT EXISTS idx_policies_user_id ON policies(user_id);
CREATE INDEX IF NOT EXISTS idx_policies_is_published ON policies(is_published);
CREATE INDEX IF NOT EXISTS idx_policies_edit_token ON policies(edit_token);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

-- 5. Row Level Security Policies

-- A. Anyone can read published policies on /p/[slug]
DROP POLICY IF EXISTS "Public can view published policies" ON policies;
DROP POLICY IF EXISTS "Public policies are readable by all" ON policies;
CREATE POLICY "Public can view published policies"
ON policies FOR SELECT
USING (is_published = true);

-- B. Authenticated users can view their own private and draft policies
DROP POLICY IF EXISTS "Users can view own policies" ON policies;
CREATE POLICY "Users can view own policies"
ON policies FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR user_id IS NULL);

-- C. Authenticated users can create policies assigned to their user_id
DROP POLICY IF EXISTS "Users can insert own policies" ON policies;
DROP POLICY IF EXISTS "Enable public insert for policies" ON policies;
CREATE POLICY "Users can insert own policies"
ON policies FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- D. Authenticated users can update their own policies
DROP POLICY IF EXISTS "Users can update own policies" ON policies;
DROP POLICY IF EXISTS "Enable public update for policies" ON policies;
CREATE POLICY "Users can update own policies"
ON policies FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR user_id IS NULL);

-- E. Authenticated users can delete their own policies
DROP POLICY IF EXISTS "Users can delete own policies" ON policies;
CREATE POLICY "Users can delete own policies"
ON policies FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
