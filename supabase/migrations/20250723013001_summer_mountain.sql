/*
  # Create leaderboard increment functions

  1. New Functions
    - `increment_pengaduan_count(user_id uuid)` - Increments total_pengaduan count for a user
    - `increment_berita_count(user_id uuid)` - Increments total_berita count for a user

  2. Purpose
    - These functions are called from the application to update leaderboard statistics
    - They safely increment counters in the leaderboard table
    - Include UPSERT logic to handle cases where leaderboard entry doesn't exist yet

  3. Security
    - Functions are accessible to authenticated users
    - They only update the leaderboard table for the specified user_id
*/

-- Function to increment pengaduan count
CREATE OR REPLACE FUNCTION public.increment_pengaduan_count(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update leaderboard entry
  INSERT INTO public.leaderboard (user_id, total_pengaduan, total_berita, points)
  VALUES (user_id, 1, 0, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    total_pengaduan = leaderboard.total_pengaduan + 1,
    points = leaderboard.points + 1;
END;
$$;

-- Function to increment berita count
CREATE OR REPLACE FUNCTION public.increment_berita_count(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update leaderboard entry
  INSERT INTO public.leaderboard (user_id, total_berita, total_pengaduan, points)
  VALUES (user_id, 1, 0, 2)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    total_berita = leaderboard.total_berita + 1,
    points = leaderboard.points + 2;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_pengaduan_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_berita_count(uuid) TO authenticated;