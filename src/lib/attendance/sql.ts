export const ATTENDANCE_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS attendance_staff (
  user_id text PRIMARY KEY,
  role text NOT NULL,
  reference_face_url text,
  face_embedding text,
  shift_start_time text NOT NULL DEFAULT '09:00',
  shift_end_time text NOT NULL DEFAULT '18:00',
  checkin_grace_period_mins integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS attendance_records (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  role text NOT NULL,
  date text NOT NULL,
  check_in_timestamp timestamptz,
  selfie_image_url text,
  verification_status text NOT NULL,
  confidence_score numeric(6,4),
  time_slot text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
CREATE INDEX IF NOT EXISTS attendance_records_user_idx ON attendance_records (user_id);
CREATE INDEX IF NOT EXISTS attendance_records_date_idx ON attendance_records (date);
`;
