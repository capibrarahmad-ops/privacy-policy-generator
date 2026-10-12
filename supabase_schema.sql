-- ==============================================================================
-- PrivacyFlow: Supabase Database Schema & Migration
-- Paste and execute this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/nowlzmlmnpwgtakotcpg/sql
-- ==============================================================================

-- 1. Base Table Creation (if not already existing)
CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) DEFAULT 'Privacy Policy',
  company_name VARCHAR(255),
  website_url VARCHAR(500),
  contact_email VARCHAR(255),
  country VARCHAR(100) DEFAULT 'Worldwide',
  edit_token VARCHAR(64),
  raw_content TEXT,
  markdown_content TEXT,
  description TEXT,
  form_data JSONB,
  generated_policy JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Schema Migration for Existing Databases:
-- Safely add missing columns and relax legacy NOT NULL constraints for flexible text-to-markdown workflows
ALTER TABLE policies
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS title VARCHAR(255) DEFAULT 'Privacy Policy',
  ADD COLUMN IF NOT EXISTS raw_content TEXT,
  ADD COLUMN IF NOT EXISTS markdown_content TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Relax legacy NOT NULL constraints so direct user text conversion succeeds effortlessly
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'policies' AND column_name = 'company_name' AND is_nullable = 'NO') THEN
    ALTER TABLE policies ALTER COLUMN company_name DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'policies' AND column_name = 'website_url' AND is_nullable = 'NO') THEN
    ALTER TABLE policies ALTER COLUMN website_url DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'policies' AND column_name = 'contact_email' AND is_nullable = 'NO') THEN
    ALTER TABLE policies ALTER COLUMN contact_email DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'policies' AND column_name = 'country' AND is_nullable = 'NO') THEN
    ALTER TABLE policies ALTER COLUMN country DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'policies' AND column_name = 'edit_token' AND is_nullable = 'NO') THEN
    ALTER TABLE policies ALTER COLUMN edit_token DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'policies' AND column_name = 'form_data' AND is_nullable = 'NO') THEN
    ALTER TABLE policies ALTER COLUMN form_data DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'policies' AND column_name = 'generated_policy' AND is_nullable = 'NO') THEN
    ALTER TABLE policies ALTER COLUMN generated_policy DROP NOT NULL;
  END IF;
END $$;

-- 3. Indexes for High-Performance Lookups
CREATE INDEX IF NOT EXISTS idx_policies_slug ON policies(slug);
CREATE INDEX IF NOT EXISTS idx_policies_user_id ON policies(user_id);
CREATE INDEX IF NOT EXISTS idx_policies_is_published ON policies(is_published);
CREATE INDEX IF NOT EXISTS idx_policies_created_at ON policies(created_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

-- 5. Row Level Security Policies
-- Unpublished drafts remain strictly private. Only published policies are accessible to the public.
-- Only the authenticated owner can access, edit, update, or delete their own draft/policy.

-- A. Public can ONLY view published policies on /p/[slug]
DROP POLICY IF EXISTS "Public can view published policies" ON policies;
DROP POLICY IF EXISTS "Public policies are readable by all" ON policies;
CREATE POLICY "Public can view published policies"
ON policies FOR SELECT
USING (is_published = true);

-- B. Authenticated users can view their own private drafts and policies
DROP POLICY IF EXISTS "Users can view own policies" ON policies;
CREATE POLICY "Users can view own policies"
ON policies FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- C. Authenticated users can insert their own draft policies
DROP POLICY IF EXISTS "Users can insert own policies" ON policies;
DROP POLICY IF EXISTS "Enable public insert for policies" ON policies;
CREATE POLICY "Users can insert own policies"
ON policies FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- D. Authenticated owners can update their own policies
DROP POLICY IF EXISTS "Users can update own policies" ON policies;
DROP POLICY IF EXISTS "Enable public update for policies" ON policies;
CREATE POLICY "Users can update own policies"
ON policies FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- E. Authenticated owners can delete their own policies
DROP POLICY IF EXISTS "Users can delete own policies" ON policies;
CREATE POLICY "Users can delete own policies"
ON policies FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
