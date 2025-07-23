/*
  # Add User Display ID System

  1. New Column
    - Add `display_id` column to users table based on NIS
    - This will be used for easy user identification in chat

  2. Updates
    - Update existing users with display_id based on their nik_nis
    - Add unique constraint for display_id

  3. Functions
    - Create function to generate display_id from nik_nis
*/

-- Add display_id column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'display_id'
  ) THEN
    ALTER TABLE users ADD COLUMN display_id VARCHAR(20) UNIQUE;
  END IF;
END $$;

-- Update existing users with display_id based on nik_nis
UPDATE users 
SET display_id = nik_nis 
WHERE display_id IS NULL;

-- Make display_id NOT NULL after updating existing records
ALTER TABLE users ALTER COLUMN display_id SET NOT NULL;

-- Create function to auto-generate display_id on insert
CREATE OR REPLACE FUNCTION generate_display_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.display_id IS NULL THEN
    NEW.display_id := NEW.nik_nis;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate display_id
DROP TRIGGER IF EXISTS trigger_generate_display_id ON users;
CREATE TRIGGER trigger_generate_display_id
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION generate_display_id();

-- Add chat notification function
CREATE OR REPLACE FUNCTION notify_chat_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for receiver (private chat)
  IF NEW.receiver_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, message, is_read, created_at)
    VALUES (
      NEW.receiver_id,
      'Pesan baru dari ' || (SELECT name FROM users WHERE id = NEW.sender_id),
      false,
      NOW()
    );
  END IF;
  
  -- Insert notification for group members (group chat)
  IF NEW.group_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, message, is_read, created_at)
    SELECT 
      u.id,
      'Pesan baru di grup dari ' || (SELECT name FROM users WHERE id = NEW.sender_id),
      false,
      NOW()
    FROM users u
    WHERE u.id != NEW.sender_id; -- Don't notify sender
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for chat notifications
DROP TRIGGER IF EXISTS chat_message_notification_trigger ON chat_message;
CREATE TRIGGER chat_message_notification_trigger
  AFTER INSERT ON chat_message
  FOR EACH ROW
  EXECUTE FUNCTION notify_chat_message();