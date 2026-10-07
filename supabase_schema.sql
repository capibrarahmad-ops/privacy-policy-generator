-- ==============================================================================
-- Supabase Schema for Multi-Tenant Privacy Policy Generator SaaS
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

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

-- Index for fast lookup by slug on /p/[slug]
CREATE INDEX IF NOT EXISTS idx_policies_slug ON policies(slug);

-- Index for fast lookup when editing with edit_token
CREATE INDEX IF NOT EXISTS idx_policies_edit_token ON policies(edit_token);

-- Enable Row Level Security (RLS)
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

-- 1. Anyone can view public policies (for /p/[slug] and embedded iframes)
DROP POLICY IF EXISTS "Public policies are readable by all" ON policies;
CREATE POLICY "Public policies are readable by all"
ON policies FOR SELECT
USING (true);

-- 2. Anyone can create/deploy a new policy
DROP POLICY IF EXISTS "Enable public insert for policies" ON policies;
CREATE POLICY "Enable public insert for policies"
ON policies FOR INSERT
WITH CHECK (true);

-- 3. Updates allowed (authenticated by edit_token match in app logic)
DROP POLICY IF EXISTS "Enable public update for policies" ON policies;
CREATE POLICY "Enable public update for policies"
ON policies FOR UPDATE
USING (true);
