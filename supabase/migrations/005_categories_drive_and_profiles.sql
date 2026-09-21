-- Flexible contest tracks, Drive source provenance, and judge portraits.
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

CREATE TABLE IF NOT EXISTS submission_categories (
  id TEXT PRIMARY KEY,
  contest_id TEXT NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#27B8FF',
  icon TEXT NOT NULL DEFAULT '🎨',
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (contest_id, slug)
);

ALTER TABLE submissions ADD COLUMN IF NOT EXISTS source_image_url TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS category_id TEXT REFERENCES submission_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_submissions_category_order ON submissions(contest_id, category_id, display_order);
CREATE INDEX IF NOT EXISTS idx_categories_contest_order ON submission_categories(contest_id, display_order);

ALTER TABLE submission_categories ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON submission_categories FROM anon, authenticated;
