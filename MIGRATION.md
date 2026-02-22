# Migration to CockroachDB - Complete! ✅

## What Was Done

### 1. Database Setup

- Created a new `linkray` database in your CockroachDB cluster
- Generated CockroachDB-compatible schema (see `cockroachdb-schema.sql`)

### 2. Code Changes

- ✅ Installed `pg` package for PostgreSQL/CockroachDB connections
- ✅ Created new database client at `lib/db.ts` (replaces `lib/supabase.ts`)
- ✅ Updated all API routes to use CockroachDB:
  - `app/api/analyze/route.ts`
  - `app/api/analyze/quick/route.ts`
  - `app/api/analyze/deep/route.ts`
  - `app/api/recent/route.ts`
- ✅ Updated frontend (`app/page.tsx`) to use new client
- ✅ Updated `.env` with CockroachDB connection string

### 3. Next Steps - ACTION REQUIRED

#### Run the Schema in CockroachDB

1. Go to your CockroachDB cluster dashboard
2. Click "SQL Shell"
3. Copy and paste the contents of `cockroachdb-schema.sql` into the SQL shell
4. Run it to create the tables and indexes

OR run this command in the SQL shell:

```sql
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
```

### 4. Test Your App

After running the schema:

1. Restart your development server
2. Test scanning a URL
3. Check if data is saved in CockroachDB

### Key Differences from Supabase

- **No Row-Level Security (RLS)**: Auth is simplified (currently using 'anonymous' user)
- **No built-in auth**: Supabase auth removed (you can add custom auth later)
- **Direct SQL queries**: Using PostgreSQL queries instead of Supabase SDK
- **No automatic pausing**: CockroachDB won't pause like Supabase free tier

### Environment Variables

Your `.env` now uses:

```
NEXT_PUBLIC_COCKROACHDB_URL=postgresql://tyler:EYj5Qz3LM_H9bEkT0E3a4A@nutrition-tracker-7256.g8z.gcp-us-east1.cockroachlabs.cloud:26257/linkray?sslmode=verify-full
```

Note: Old Supabase variables have been removed.

### Files Created/Modified

**Created:**

- `cockroachdb-schema.sql` - Database schema for CockroachDB
- `lib/db.ts` - New database client
- `MIGRATION.md` - This file

**Modified:**

- `.env` - Updated connection string
- `package.json` - Added `pg` dependency
- All API routes - Updated to use CockroachDB
- `app/page.tsx` - Updated to use new client

---

## Troubleshooting

If you see connection errors:

1. Verify your password is correct in `.env`
2. Check that the schema has been run in CockroachDB
3. Ensure the CA certificate is installed (if required)

If you need help, let me know!
