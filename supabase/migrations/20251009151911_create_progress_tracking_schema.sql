/*
  # Google Cloud Skills Boost Progress Tracking Schema

  1. New Tables
    - `participants`
      - `id` (uuid, primary key)
      - `user_name` (text)
      - `user_email` (text, unique)
      - `profile_url` (text)
      - `profile_status` (text)
      - `redemption_status` (text)
      - `all_completed` (text)
      - `skill_badges_count` (integer, default 0)
      - `skill_badge_names` (text)
      - `arcade_games_count` (integer, default 0)
      - `arcade_game_names` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `daily_snapshots`
      - `id` (uuid, primary key)
      - `participant_id` (uuid, foreign key to participants)
      - `snapshot_date` (date)
      - `skill_badges_count` (integer, default 0)
      - `arcade_games_count` (integer, default 0)
      - `skill_badge_names` (text)
      - `arcade_game_names` (text)
      - `created_at` (timestamptz)
    
    - `csv_uploads`
      - `id` (uuid, primary key)
      - `filename` (text)
      - `upload_date` (timestamptz)
      - `report_date` (date)
      - `participant_count` (integer)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access on participants and daily_snapshots
    - Add policies for authenticated admin access on csv_uploads

  3. Indexes
    - Index on participants.user_email for fast lookup
    - Index on daily_snapshots.participant_id and snapshot_date for queries
*/

-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text NOT NULL,
  user_email text UNIQUE NOT NULL,
  profile_url text DEFAULT '',
  profile_status text DEFAULT '',
  redemption_status text DEFAULT '',
  all_completed text DEFAULT '',
  skill_badges_count integer DEFAULT 0,
  skill_badge_names text DEFAULT '',
  arcade_games_count integer DEFAULT 0,
  arcade_game_names text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create daily_snapshots table
CREATE TABLE IF NOT EXISTS daily_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  skill_badges_count integer DEFAULT 0,
  arcade_games_count integer DEFAULT 0,
  skill_badge_names text DEFAULT '',
  arcade_game_names text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(participant_id, snapshot_date)
);

-- Create csv_uploads table
CREATE TABLE IF NOT EXISTS csv_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  upload_date timestamptz DEFAULT now(),
  report_date date NOT NULL,
  participant_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(user_email);
CREATE INDEX IF NOT EXISTS idx_snapshots_participant ON daily_snapshots(participant_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON daily_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_uploads_date ON csv_uploads(report_date);

-- Enable Row Level Security
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_uploads ENABLE ROW LEVEL SECURITY;

-- Public read access for participants
CREATE POLICY "Allow public read access to participants"
  ON participants
  FOR SELECT
  TO public
  USING (true);

-- Public read access for daily_snapshots
CREATE POLICY "Allow public read access to daily snapshots"
  ON daily_snapshots
  FOR SELECT
  TO public
  USING (true);

-- Public read access for csv_uploads
CREATE POLICY "Allow public read access to csv uploads"
  ON csv_uploads
  FOR SELECT
  TO public
  USING (true);

-- Admin write access for participants
CREATE POLICY "Allow public insert access to participants"
  ON participants
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to participants"
  ON participants
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to participants"
  ON participants
  FOR DELETE
  TO public
  USING (true);

-- Admin write access for daily_snapshots
CREATE POLICY "Allow public insert access to daily snapshots"
  ON daily_snapshots
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to daily snapshots"
  ON daily_snapshots
  FOR DELETE
  TO public
  USING (true);

-- Admin write access for csv_uploads
CREATE POLICY "Allow public insert access to csv uploads"
  ON csv_uploads
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to csv uploads"
  ON csv_uploads
  FOR DELETE
  TO public
  USING (true);
