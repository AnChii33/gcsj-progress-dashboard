/*
  # Add Admin Users Table

  1. New Table
    - `admin_users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `password` (text) - Note: In production, this should be hashed
      - `role` (text, default 'admin')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on admin_users table
    - Add policies for public read and write access (since we're handling auth in the app)

  3. Initial Data
    - Insert default admin user with email: admin@stcet.edu.in
    - Insert default core team user with email: coreteam@stcet.edu.in
*/

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Public read access for admin_users (needed for login verification)
CREATE POLICY "Allow public read access to admin users"
  ON admin_users
  FOR SELECT
  TO public
  USING (true);

-- Public update access for admin_users (needed for password change)
CREATE POLICY "Allow public update access to admin users"
  ON admin_users
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Public insert access for admin_users
CREATE POLICY "Allow public insert access to admin users"
  ON admin_users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Insert default admin user if not exists
INSERT INTO admin_users (email, password, role)
VALUES ('admin@stcet.edu.in', 'AdminSTCET2024!', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert default core team user if not exists
INSERT INTO admin_users (email, password, role)
VALUES ('coreteam@stcet.edu.in', 'CoreTeamSTCET2024!', 'core_team')
ON CONFLICT (email) DO NOTHING;

-- Create core_team_credentials table
CREATE TABLE IF NOT EXISTS core_team_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  updated_at timestamptz DEFAULT now()
);


INSERT INTO core_team_credentials (email, password)
VALUES ('coreteam@stcet.edu.in', 'CoreTeamSTCET2024!')
ON CONFLICT (email) DO NOTHING;