-- Artventure Judge Console: initial PostgreSQL / Supabase schema.
-- Keep structural changes aligned with src/lib/db/schema.ts (the PGlite demo schema).

CREATE TABLE IF NOT EXISTS contests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  internal_name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  cover_image TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','OPEN','JUDGING','COMPLETED','ARCHIVED')),
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  judging_start_at TIMESTAMPTZ,
  judging_end_at TIMESTAMPTZ,
  active_criteria_version_id TEXT,
  judge_login_mode TEXT NOT NULL DEFAULT 'PICKER_PIN' CHECK (judge_login_mode IN ('PICKER','PICKER_PIN','ACCOUNT')),
  aggregation_method TEXT NOT NULL DEFAULT 'SUM' CHECK (aggregation_method IN ('SUM','AVERAGE','MEDIAN','DROP_HIGHEST_LOWEST','CUSTOM')),
  tie_breaker TEXT NOT NULL DEFAULT 'MANUAL',
  required_judges INTEGER,
  anonymous_judging BOOLEAN NOT NULL DEFAULT TRUE,
  judging_order TEXT NOT NULL DEFAULT 'RANDOM_PER_JUDGE' CHECK (judging_order IN ('SUBMISSION_NUMBER','RANDOM_PER_JUDGE','SAME_RANDOM')),
  comment_mode TEXT NOT NULL DEFAULT 'OPTIONAL' CHECK (comment_mode IN ('DISABLED','OPTIONAL','REQUIRED')),
  input_mode TEXT NOT NULL DEFAULT 'STEPPER' CHECK (input_mode IN ('SLIDER','STEPPER','NUMBER','QUICK')),
  allow_judge_editing BOOLEAN NOT NULL DEFAULT TRUE,
  result_visibility BOOLEAN NOT NULL DEFAULT FALSE,
  progress_animations BOOLEAN NOT NULL DEFAULT TRUE,
  metadata_visibility BOOLEAN NOT NULL DEFAULT TRUE,
  results_locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN','ADMIN','JUDGE')),
  avatar_color TEXT NOT NULL DEFAULT '#27B8FF',
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','DISABLED')),
  pin_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS contest_judges (
  id TEXT PRIMARY KEY,
  contest_id TEXT NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pin_hash TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','DISABLED')),
  required BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (contest_id, user_id)
);

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  contest_id TEXT NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  submission_number TEXT NOT NULL,
  contestant_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  player_id TEXT NOT NULL,
  email TEXT,
  social_url TEXT,
  artwork_title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  source_image_url TEXT,
  category_id TEXT REFERENCES submission_categories(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','DISQUALIFIED','HIDDEN','WINNER','ARCHIVED')),
  admin_note TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (contest_id, submission_number)
);

CREATE TABLE IF NOT EXISTS criteria_sets (
  id TEXT PRIMARY KEY,
  contest_id TEXT NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS criteria_versions (
  id TEXT PRIMARY KEY,
  criteria_set_id TEXT NOT NULL REFERENCES criteria_sets(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ACTIVE','ARCHIVED')),
  total_max NUMERIC(8,2) NOT NULL DEFAULT 0,
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (criteria_set_id, version_number)
);

CREATE TABLE IF NOT EXISTS criteria (
  id TEXT PRIMARY KEY,
  criteria_version_id TEXT NOT NULL REFERENCES criteria_versions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  max_score NUMERIC(8,2) NOT NULL CHECK (max_score > 0),
  display_order INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS judging_sessions (
  id TEXT PRIMARY KEY,
  contest_id TEXT NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  judge_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS judge_submission_order (
  id TEXT PRIMARY KEY,
  contest_id TEXT NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  judge_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  flagged BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (contest_id, judge_id, submission_id),
  UNIQUE (contest_id, judge_id, position)
);

CREATE TABLE IF NOT EXISTS scores (
  id TEXT PRIMARY KEY,
  contest_id TEXT NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  judge_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  criterion_id TEXT NOT NULL REFERENCES criteria(id) ON DELETE RESTRICT,
  criteria_version_id TEXT NOT NULL REFERENCES criteria_versions(id) ON DELETE RESTRICT,
  score NUMERIC(8,2) NOT NULL CHECK (score >= 0),
  comment TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  reset_at TIMESTAMPTZ,
  reset_by TEXT REFERENCES users(id),
  reset_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS score_revisions (
  id TEXT PRIMARY KEY,
  score_id TEXT NOT NULL REFERENCES scores(id) ON DELETE CASCADE,
  previous_score NUMERIC(8,2),
  new_score NUMERIC(8,2) NOT NULL,
  changed_by TEXT NOT NULL REFERENCES users(id),
  change_reason TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  contest_id TEXT REFERENCES contests(id) ON DELETE CASCADE,
  actor_user_id TEXT REFERENCES users(id),
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  before_data JSONB,
  after_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS result_snapshots (
  id TEXT PRIMARY KEY,
  contest_id TEXT NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  result_data JSONB NOT NULL,
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (contest_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_submissions_contest_status ON submissions(contest_id, status);
CREATE INDEX IF NOT EXISTS idx_submissions_category_order ON submissions(contest_id, category_id, display_order);
CREATE INDEX IF NOT EXISTS idx_categories_contest_order ON submission_categories(contest_id, display_order);
CREATE INDEX IF NOT EXISTS idx_scores_contest_submission ON scores(contest_id, submission_id);
CREATE INDEX IF NOT EXISTS idx_scores_judge_submission ON scores(judge_id, submission_id);
CREATE INDEX IF NOT EXISTS idx_scores_criterion ON scores(criterion_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_scores_active ON scores(submission_id, judge_id, criterion_id, criteria_version_id) WHERE is_active=TRUE;
CREATE INDEX IF NOT EXISTS idx_order_judge_position ON judge_submission_order(contest_id, judge_id, position);
CREATE INDEX IF NOT EXISTS idx_audit_contest_created ON audit_logs(contest_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_revisions_score_changed ON score_revisions(score_id, changed_at DESC);
