-- ============================================================
-- Community Job Referral Portal - Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ── Profiles ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role             TEXT NOT NULL CHECK (role IN ('referrer', 'seeker')),
  full_name        TEXT,
  extracted_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  resume_url       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- ── Jobs ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id      UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title            TEXT NOT NULL,
  company          TEXT NOT NULL,
  skills_required  JSONB NOT NULL DEFAULT '[]'::jsonb,
  whatsapp_link    TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read jobs
CREATE POLICY "jobs_select_all" ON jobs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only the owning referrer can insert
CREATE POLICY "jobs_insert_own" ON jobs
  FOR INSERT WITH CHECK (
    referrer_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Only the owning referrer can delete
CREATE POLICY "jobs_delete_own" ON jobs
  FOR DELETE USING (
    referrer_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ── Matches ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS matches (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seeker_id  UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  job_id     UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  score      FLOAT NOT NULL DEFAULT 0,
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (seeker_id, job_id)
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Seekers can read their own matches
CREATE POLICY "matches_select_own" ON matches
  FOR SELECT USING (
    seeker_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Service-role key (backend) handles all writes — no user-level insert policy needed

-- ── Storage Bucket ───────────────────────────────────────────
-- Run after creating a private bucket named "resumes" in the Storage UI
-- Storage → New bucket → Name: resumes → Public: OFF

-- Allow authenticated users to upload to their own folder
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "resumes_upload_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'resumes'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "resumes_read_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'resumes'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
