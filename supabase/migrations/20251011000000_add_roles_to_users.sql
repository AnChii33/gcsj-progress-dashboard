-- Step 1: Add the 'role' column to the existing admin_users table
ALTER TABLE admin_users
ADD COLUMN role TEXT NOT NULL DEFAULT 'admin';

-- Step 2: Ensure the default admin user has the 'admin' role explicitly set
UPDATE admin_users
SET role = 'admin'
WHERE email = 'admin@stcet.edu.in';

-- Step 3: Insert the default core team user
INSERT INTO admin_users (email, password, role)
VALUES ('coreteam@stcet.edu.in', 'CoreTeamSTCET2024!', 'core_team')
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  role = EXCLUDED.role;