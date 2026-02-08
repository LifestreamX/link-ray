-- Migration: Enforce NOT NULL on user_id and url_hash, and clean up nulls

-- Delete any rows with null user_id or url_hash (prevents unique constraint errors)
DELETE FROM public.scans WHERE user_id IS NULL OR url_hash IS NULL;

-- Alter columns to enforce NOT NULL
ALTER TABLE public.scans ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.scans ALTER COLUMN url_hash SET NOT NULL;

-- (Optional) Re-add unique constraint to ensure it's correct
ALTER TABLE public.scans DROP CONSTRAINT IF EXISTS scans_user_url_unique;
ALTER TABLE public.scans ADD CONSTRAINT scans_user_url_unique UNIQUE (user_id, url_hash);
