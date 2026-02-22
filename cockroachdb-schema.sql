
USE linkray;

CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  url_hash TEXT NOT NULL,
  url TEXT NOT NULL,
  summary TEXT NOT NULL,
  risk_score INT NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  reason TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT scans_user_url_unique UNIQUE (user_id, url_hash)
);

CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_url_hash ON scans(url_hash);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);

-- User table for Google login/auth integration
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  image VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
