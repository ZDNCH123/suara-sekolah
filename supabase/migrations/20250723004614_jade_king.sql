/*
  # Chat Notification System

  1. Functions
    - `notify_chat_message()` - Function to create notifications for chat messages
  
  2. Triggers
    - Trigger on chat_message table to automatically send notifications
  
  3. Features
    - Real-time notifications for private and group chats
    - Automatic notification creation when messages are sent
*/

-- Function to create chat notifications
CREATE OR REPLACE FUNCTION notify_chat_message()
RETURNS TRIGGER AS $$
BEGIN
  -- For private messages, notify the receiver
  IF NEW.receiver_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, message, is_read, created_at)
    VALUES (
      NEW.receiver_id,
      'Pesan baru dari ' || (SELECT name FROM users WHERE id = NEW.sender_id),
      false,
      NOW()
    );
  END IF;
  
  -- For group messages, notify all group members except sender
  IF NEW.group_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, message, is_read, created_at)
    SELECT 
      u.id,
      'Pesan baru di grup ' || (SELECT group_name FROM chat_group WHERE id = NEW.group_id),
      false,
      NOW()
    FROM users u
    WHERE u.id != NEW.sender_id
    AND u.id IN (
      -- Get all group members (for now, just the creator - can be expanded)
      SELECT created_by FROM chat_group WHERE id = NEW.group_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for chat message notifications
DROP TRIGGER IF EXISTS chat_message_notification_trigger ON chat_message;
CREATE TRIGGER chat_message_notification_trigger
  AFTER INSERT ON chat_message
  FOR EACH ROW
  EXECUTE FUNCTION notify_chat_message();