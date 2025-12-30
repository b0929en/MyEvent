-- Migration to add rejection_reason and submitted_at to mycsd_requests

ALTER TABLE mycsd_requests 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NOW();
