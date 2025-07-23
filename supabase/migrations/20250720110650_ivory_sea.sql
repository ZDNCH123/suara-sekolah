/*
  # Initial Schema for SuaraSekolah.id

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `nik_nis` (varchar, unique)
      - `name` (varchar)
      - `role` (text with check constraint)
      - `password_hash` (varchar)
      - `kelas` (varchar, nullable)
      - `created_at` (timestamp)
    
    - `pengaduan`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key, nullable for anonymous)
      - `jenis_pengaduan` (varchar)
      - `isi_pengaduan` (text)
      - `bukti_url` (varchar, nullable)
      - `status` (text with check constraint)
      - `created_at` (timestamp)
    
    - `berita`
      - `id` (uuid, primary key)
      - `judul` (varchar)
      - `isi` (text)
      - `kategori` (text with check constraint)
      - `author_id` (uuid, foreign key)
      - `gambar_url` (varchar, nullable)
      - `created_at` (timestamp)
    
    - `chat_ai_log`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `prompt` (text)
      - `response` (text)
      - `created_at` (timestamp)
    
    - `chat_message`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, foreign key)
      - `receiver_id` (uuid, nullable)
      - `group_id` (uuid, nullable)
      - `message` (text)
      - `attachment_url` (varchar, nullable)
      - `created_at` (timestamp)
    
    - `chat_group`
      - `id` (uuid, primary key)
      - `group_name` (varchar)
      - `created_by` (uuid, foreign key)
      - `created_at` (timestamp)
    
    - `leaderboard`
      - `user_id` (uuid, primary key, foreign key)
      - `total_berita` (integer)
      - `total_pengaduan` (integer)
      - `points` (integer)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Add policies for public read access where appropriate
    - Add policies for role-based access control
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nik_nis varchar(20) UNIQUE NOT NULL,
  name varchar(100) NOT NULL,
  role text NOT NULL CHECK (role IN ('siswa', 'guru', 'osis', 'admin')),
  password_hash varchar(255) NOT NULL,
  kelas varchar(20),
  created_at timestamp DEFAULT now()
);

-- Create pengaduan table
CREATE TABLE IF NOT EXISTS pengaduan (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id),
  jenis_pengaduan varchar(50) NOT NULL,
  isi_pengaduan text NOT NULL,
  bukti_url varchar(255),
  status text DEFAULT 'diterima' CHECK (status IN ('diterima', 'diproses', 'selesai')),
  created_at timestamp DEFAULT now()
);

-- Create berita table
CREATE TABLE IF NOT EXISTS berita (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  judul varchar(150) NOT NULL,
  isi text NOT NULL,
  kategori text NOT NULL CHECK (kategori IN ('event', 'pengumuman', 'prestasi', 'meme')),
  author_id uuid REFERENCES users(id) NOT NULL,
  gambar_url varchar(255),
  created_at timestamp DEFAULT now()
);

-- Create chat_ai_log table
CREATE TABLE IF NOT EXISTS chat_ai_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) NOT NULL,
  prompt text NOT NULL,
  response text NOT NULL,
  created_at timestamp DEFAULT now()
);

-- Create chat_message table
CREATE TABLE IF NOT EXISTS chat_message (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id uuid REFERENCES users(id) NOT NULL,
  receiver_id uuid REFERENCES users(id),
  group_id uuid,
  message text NOT NULL,
  attachment_url varchar(255),
  created_at timestamp DEFAULT now()
);

-- Create chat_group table
CREATE TABLE IF NOT EXISTS chat_group (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_name varchar(100) NOT NULL,
  created_by uuid REFERENCES users(id) NOT NULL,
  created_at timestamp DEFAULT now()
);

-- Create leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
  user_id uuid PRIMARY KEY REFERENCES users(id),
  total_berita integer DEFAULT 0,
  total_pengaduan integer DEFAULT 0,
  points integer DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengaduan ENABLE ROW LEVEL SECURITY;
ALTER TABLE berita ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_ai_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_group ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Pengaduan policies
CREATE POLICY "Users can read own pengaduan or anonymous ones"
  ON pengaduan
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can create pengaduan"
  ON pengaduan
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own pengaduan"
  ON pengaduan
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Berita policies
CREATE POLICY "Anyone can read berita"
  ON berita
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "OSIS and admin can create berita"
  ON berita
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('osis', 'admin')
    )
  );

CREATE POLICY "Authors can update own berita"
  ON berita
  FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid());

-- Chat AI log policies
CREATE POLICY "Users can read own AI chat logs"
  ON chat_ai_log
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create AI chat logs"
  ON chat_ai_log
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Chat message policies
CREATE POLICY "Users can read messages they sent or received"
  ON chat_message
  FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid() 
    OR receiver_id = auth.uid() 
    OR group_id IN (
      SELECT id FROM chat_group 
      WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can send messages"
  ON chat_message
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Chat group policies
CREATE POLICY "Anyone can read chat groups"
  ON chat_group
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create chat groups"
  ON chat_group
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Leaderboard policies
CREATE POLICY "Anyone can read leaderboard"
  ON leaderboard
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert sample data
INSERT INTO users (nik_nis, name, role, password_hash, kelas) VALUES
  ('12345678', 'Andi Pratama', 'siswa', '$2b$10$dummy_hash_1', '11 IPA 1'),
  ('87654321', 'Sari Widya', 'guru', '$2b$10$dummy_hash_2', NULL),
  ('admin123', 'Admin SMA', 'admin', '$2b$10$dummy_hash_3', NULL)
ON CONFLICT (nik_nis) DO NOTHING;

-- Insert sample pengaduan
INSERT INTO pengaduan (user_id, jenis_pengaduan, isi_pengaduan, status) VALUES
  ((SELECT id FROM users WHERE nik_nis = '12345678'), 'Fasilitas', 'AC di kelas 11 IPA 1 rusak, bikin panas banget saat belajar', 'diproses'),
  (NULL, 'Bullying', 'Ada siswa yang sering nge-bully teman-temannya di kantin', 'diterima');

-- Insert sample berita
INSERT INTO berita (judul, isi, kategori, author_id) VALUES
  ('Selamat! Tim Robotika SMA Juara 1 Kompetisi Nasional', 'Tim robotika sekolah kita berhasil meraih juara 1 dalam kompetisi robotika tingkat nasional. Bangga banget sama prestasi mereka!', 'prestasi', (SELECT id FROM users WHERE nik_nis = '87654321')),
  ('Pengumuman: Libur Semesteran', 'Libur semester dimulai tanggal 25 Januari sampai 5 Februari. Jangan lupa prepare buat semester baru ya!', 'pengumuman', (SELECT id FROM users WHERE nik_nis = 'admin123'));

-- Insert sample chat groups
INSERT INTO chat_group (group_name, created_by) VALUES
  ('11 IPA 1', (SELECT id FROM users WHERE nik_nis = '87654321')),
  ('OSIS SMA', (SELECT id FROM users WHERE nik_nis = 'admin123'));

-- Initialize leaderboard for users
INSERT INTO leaderboard (user_id, total_berita, total_pengaduan, points) VALUES
  ((SELECT id FROM users WHERE nik_nis = '12345678'), 0, 1, 120),
  ((SELECT id FROM users WHERE nik_nis = '87654321'), 1, 0, 250),
  ((SELECT id FROM users WHERE nik_nis = 'admin123'), 1, 0, 500)
ON CONFLICT (user_id) DO NOTHING;