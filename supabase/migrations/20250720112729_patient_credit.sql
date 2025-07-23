/*
  # Fix RLS Policies for User Registration

  1. Security Updates
    - Update users table policies to allow registration
    - Update leaderboard policies to allow initialization
    - Fix authentication flow for new users

  2. Policy Changes
    - Allow authenticated users to insert their own data
    - Enable proper user profile creation
    - Fix leaderboard initialization
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can create pengaduan" ON pengaduan;
DROP POLICY IF EXISTS "Users can read own pengaduan or anonymous ones" ON pengaduan;
DROP POLICY IF EXISTS "Users can update own pengaduan" ON pengaduan;
DROP POLICY IF EXISTS "Anyone can read berita" ON berita;
DROP POLICY IF EXISTS "Authors can update own berita" ON berita;
DROP POLICY IF EXISTS "OSIS and admin can create berita" ON berita;
DROP POLICY IF EXISTS "Users can read messages they sent or received" ON chat_message;
DROP POLICY IF EXISTS "Users can send messages" ON chat_message;
DROP POLICY IF EXISTS "Anyone can read chat groups" ON chat_group;
DROP POLICY IF EXISTS "Users can create chat groups" ON chat_group;
DROP POLICY IF EXISTS "Anyone can read leaderboard" ON leaderboard;
DROP POLICY IF EXISTS "Users can create AI chat logs" ON chat_ai_log;
DROP POLICY IF EXISTS "Users can read own AI chat logs" ON chat_ai_log;

-- Users table policies
CREATE POLICY "Enable insert for authenticated users" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable select for users based on user_id" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Enable update for users based on user_id" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Pengaduan table policies
CREATE POLICY "Enable insert for authenticated users" ON pengaduan
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable select for own pengaduan or anonymous" ON pengaduan
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Enable update for own pengaduan" ON pengaduan
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Berita table policies
CREATE POLICY "Enable select for all authenticated users" ON berita
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Enable insert for OSIS and admin" ON berita
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('osis', 'admin')
    )
  );

CREATE POLICY "Enable update for authors" ON berita
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Chat message policies
CREATE POLICY "Enable select for participants" ON chat_message
  FOR SELECT TO authenticated
  USING (
    sender_id = auth.uid() OR 
    receiver_id = auth.uid() OR 
    group_id IN (
      SELECT id FROM chat_group WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Enable insert for authenticated users" ON chat_message
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Chat group policies
CREATE POLICY "Enable select for all authenticated users" ON chat_group
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON chat_group
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Leaderboard policies
CREATE POLICY "Enable select for all authenticated users" ON leaderboard
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON leaderboard
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for own leaderboard" ON leaderboard
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Chat AI log policies
CREATE POLICY "Enable insert for authenticated users" ON chat_ai_log
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Enable select for own logs" ON chat_ai_log
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());