-- Server-side PIN brute-force protection. Keys are one-way hashes of client/contest/user context.
CREATE TABLE IF NOT EXISTS auth_attempts (
  id TEXT PRIMARY KEY,
  attempt_key TEXT NOT NULL,
  succeeded BOOLEAN NOT NULL DEFAULT FALSE,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_attempts_key_time ON auth_attempts(attempt_key, attempted_at DESC);
