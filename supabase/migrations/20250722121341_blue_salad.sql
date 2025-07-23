/*
  # Comprehensive Database Update for SuaraSekolah.id

  1. New Tables
    - `notifications` - Real-time notification system
    - `schedules` - Real-time class schedules
    - Update existing tables with new constraints

  2. Security
    - Enable RLS on all tables
    - Add proper policies for data access
    - Real-time subscriptions

  3. Real-time Features
    - Enable real-time on notifications, pengaduan, berita, schedules
    - Proper triggers for automatic notifications
*/

-- Drop existing tables if they exist to recreate with proper structure
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT timezone('utc'::text, now())
);

-- Create schedules table for real-time class schedules
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kelas varchar(20) NOT NULL,
  mata_pelajaran varchar(100) NOT NULL,
  guru varchar(100) NOT NULL,
  hari varchar(10) NOT NULL CHECK (hari IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu')),
  jam_mulai time NOT NULL,
  jam_selesai time NOT NULL,
  ruangan varchar(50),
  created_at timestamptz DEFAULT timezone('utc'::text, now())
);

-- Update pengaduan table to require bukti_url (image)
ALTER TABLE pengaduan ALTER COLUMN bukti_url SET NOT NULL;

-- Update berita table - only admin can post
-- This will be handled in RLS policies

-- Enable RLS on all tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Schedules policies
CREATE POLICY "All authenticated users can read schedules"
  ON schedules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admin can manage schedules"
  ON schedules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Update berita policies - only admin can post
DROP POLICY IF EXISTS "Enable insert for OSIS and admin" ON berita;
CREATE POLICY "Only admin can insert berita"
  ON berita
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Enable real-time on tables
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE pengaduan;
ALTER PUBLICATION supabase_realtime ADD TABLE berita;
ALTER PUBLICATION supabase_realtime ADD TABLE schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_message;

-- Create function to send notifications
CREATE OR REPLACE FUNCTION send_notification(user_id_param uuid, message_param text)
RETURNS void AS $$
BEGIN
  INSERT INTO notifications (user_id, message, is_read)
  VALUES (user_id_param, message_param, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to send notification to all users
CREATE OR REPLACE FUNCTION send_notification_to_all(message_param text)
RETURNS void AS $$
BEGIN
  INSERT INTO notifications (user_id, message, is_read)
  SELECT id, message_param, false FROM users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for pengaduan notifications
CREATE OR REPLACE FUNCTION notify_pengaduan_created()
RETURNS trigger AS $$
BEGIN
  -- Notify all admins about new pengaduan
  INSERT INTO notifications (user_id, message, is_read)
  SELECT id, 'Pengaduan baru: ' || NEW.jenis_pengaduan || ' telah diterima', false
  FROM users WHERE role = 'admin';
  
  -- Notify user about successful submission
  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, message, is_read)
    VALUES (NEW.user_id, 'Pengaduan Anda tentang ' || NEW.jenis_pengaduan || ' telah berhasil dikirim', false);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER pengaduan_notification_trigger
  AFTER INSERT ON pengaduan
  FOR EACH ROW
  EXECUTE FUNCTION notify_pengaduan_created();

-- Trigger for berita notifications
CREATE OR REPLACE FUNCTION notify_berita_created()
RETURNS trigger AS $$
BEGIN
  -- Notify all users about new berita
  INSERT INTO notifications (user_id, message, is_read)
  SELECT id, 'Berita baru: ' || NEW.judul, false
  FROM users;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER berita_notification_trigger
  AFTER INSERT ON berita
  FOR EACH ROW
  EXECUTE FUNCTION notify_berita_created();

-- Insert sample schedules
INSERT INTO schedules (kelas, mata_pelajaran, guru, hari, jam_mulai, jam_selesai, ruangan) VALUES
('XII RPL 1', 'Matematika', 'Dra. Siti Nurhaliza', 'Senin', '07:00', '08:30', 'R.101'),
('XII RPL 1', 'Bahasa Indonesia', 'Ahmad Fauzi, S.Pd', 'Senin', '08:30', '10:00', 'R.101'),
('XII RPL 1', 'Pemrograman Web', 'Budi Santoso, S.Kom', 'Senin', '10:15', '11:45', 'Lab Komputer 1'),
('XII RPL 1', 'Basis Data', 'Rina Kartika, S.T', 'Selasa', '07:00', '08:30', 'Lab Komputer 2'),
('XII RPL 1', 'Bahasa Inggris', 'Maria Gonzales, S.Pd', 'Selasa', '08:30', '10:00', 'R.102'),
('XII RPL 1', 'Fisika', 'Dr. Agus Setiawan', 'Rabu', '07:00', '08:30', 'Lab Fisika'),
('XII RPL 1', 'Kimia', 'Dra. Lestari Wulandari', 'Rabu', '08:30', '10:00', 'Lab Kimia'),
('XII RPL 1', 'Pemrograman Mobile', 'Indra Gunawan, S.Kom', 'Kamis', '07:00', '08:30', 'Lab Komputer 1'),
('XII RPL 1', 'Jaringan Komputer', 'Yoga Pratama, S.T', 'Kamis', '08:30', '10:00', 'Lab Jaringan'),
('XII RPL 1', 'PKN', 'Hendra Wijaya, S.Pd', 'Jumat', '07:00', '08:30', 'R.103');

-- Insert sample admin user
INSERT INTO users (nik_nis, name, role, password_hash, kelas) VALUES
('admin001', 'Administrator SMKN 2 Bekasi', 'admin', 'admin_password_hash', NULL)
ON CONFLICT (nik_nis) DO NOTHING;

-- Insert sample students
INSERT INTO users (nik_nis, name, role, password_hash, kelas) VALUES
('2024001', 'Ahmad Rizki Pratama', 'siswa', 'student_password_hash', 'XII RPL 1'),
('2024002', 'Siti Aisyah Putri', 'siswa', 'student_password_hash', 'XII RPL 1'),
('2024003', 'Budi Setiawan', 'siswa', 'student_password_hash', 'XII RPL 2'),
('2024004', 'Rina Maharani', 'siswa', 'student_password_hash', 'XII TKJ 1'),
('2024005', 'Dedi Kurniawan', 'siswa', 'student_password_hash', 'XII MM 1')
ON CONFLICT (nik_nis) DO NOTHING;

-- Create leaderboard entries for sample users
INSERT INTO leaderboard (user_id, total_berita, total_pengaduan, points)
SELECT id, 0, 0, 0 FROM users
ON CONFLICT (user_id) DO NOTHING;