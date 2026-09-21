export type Role = "SUPER_ADMIN" | "ADMIN" | "JUDGE";
export type ContestStatus = "DRAFT" | "OPEN" | "JUDGING" | "COMPLETED" | "ARCHIVED";
export type SubmissionStatus = "ACTIVE" | "DISQUALIFIED" | "HIDDEN" | "WINNER" | "ARCHIVED";
export type AggregationMethod = "SUM" | "AVERAGE" | "MEDIAN" | "DROP_HIGHEST_LOWEST" | "CUSTOM";

export interface SessionUser {
  id: string;
  name: string;
  role: Role;
  contestId?: string;
}

export interface Contest {
  id: string;
  name: string;
  internal_name: string;
  description: string;
  status: ContestStatus;
  active_criteria_version_id: string;
  judge_login_mode: "PICKER" | "PICKER_PIN" | "ACCOUNT";
  aggregation_method: AggregationMethod;
  tie_breaker: string;
  required_judges: number | null;
  anonymous_judging: boolean;
  judging_order: "SUBMISSION_NUMBER" | "RANDOM_PER_JUDGE" | "SAME_RANDOM";
  comment_mode: "DISABLED" | "OPTIONAL" | "REQUIRED";
  input_mode: "SLIDER" | "STEPPER" | "NUMBER" | "QUICK";
  allow_judge_editing: boolean;
  result_visibility: boolean;
  progress_animations: boolean;
  metadata_visibility: boolean;
  results_locked_at: string | null;
  top_picks_min?: number;
  top_picks_max?: number;
}

export interface JudgeTopPick {
  id: string;
  contest_id: string;
  judge_id: string;
  submission_id: string;
  rank_order: number;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface Criterion {
  id: string;
  criteria_version_id: string;
  name: string;
  description: string;
  max_score: number;
  display_order: number;
  enabled: boolean;
}

export interface SubmissionCategory {
  id: string;
  contest_id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  display_order: number;
  active: boolean;
}

export interface Submission {
  id: string;
  contest_id: string;
  submission_number: string;
  contestant_name: string;
  display_name: string;
  player_id: string;
  email: string | null;
  social_url: string | null;
  artwork_title: string;
  description: string;
  image_url: string;
  thumbnail_url: string | null;
  source_image_url: string | null;
  category_id: string | null;
  status: SubmissionStatus;
  admin_note: string;
}
