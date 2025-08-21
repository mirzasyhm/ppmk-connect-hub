-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('message', 'like', 'community', 'event', 'broadcast', 'marketplace', 'comment', 'follow', 'event_reminder')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT, -- URL to navigate to when notification is clicked
  related_id UUID, -- ID of the related post, event, broadcast, etc.
  related_type TEXT, -- Type of the related entity (post, event, broadcast, etc.)
  sender_id UUID, -- ID of the user who triggered this notification (if applicable)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updating timestamps
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- Function to create notifications for new posts
CREATE OR REPLACE FUNCTION notify_post_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for followers when user creates a post
  -- For now, we'll create a simple notification
  INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type, sender_id, action_url)
  SELECT 
    NEW.user_id,
    'community',
    'New Post',
    'You created a new post',
    NEW.id,
    'post',
    NEW.user_id,
    '/feed'
  WHERE NEW.user_id IS NOT NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notifications for new broadcasts
CREATE OR REPLACE FUNCTION notify_broadcast_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for all users when a broadcast is created
  INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type, sender_id, action_url)
  SELECT 
    p.user_id,
    'broadcast',
    NEW.title,
    CASE 
      WHEN NEW.priority = 'urgent' THEN '🚨 ' || LEFT(NEW.content, 100) || '...'
      ELSE LEFT(NEW.content, 100) || '...'
    END,
    NEW.id,
    'broadcast',
    NEW.created_by,
    '/broadcast'
  FROM profiles p
  JOIN user_notification_settings uns ON p.user_id = uns.user_id
  WHERE (
    (NEW.priority = 'urgent' AND uns.broadcast_urgent = true) OR
    (NEW.priority != 'urgent' AND uns.broadcast_normal = true)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notifications for new events
CREATE OR REPLACE FUNCTION notify_event_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for all users when an event is created
  INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type, sender_id, action_url)
  SELECT 
    p.user_id,
    'event',
    'New Event: ' || NEW.title,
    'Event on ' || TO_CHAR(NEW.event_date::date, 'Mon DD, YYYY') || ' at ' || NEW.location,
    NEW.id,
    'event',
    NEW.organizer_id,
    '/events'
  FROM profiles p
  JOIN user_notification_settings uns ON p.user_id = uns.user_id
  WHERE uns.events_new = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notifications for new community posts
CREATE OR REPLACE FUNCTION notify_community_post_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for community members when a new post is created
  INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type, sender_id, action_url)
  SELECT 
    cm.user_id,
    'community',
    'New Community Post',
    'New post in ' || c.name || ' community',
    NEW.id,
    'community_post',
    NEW.user_id,
    '/communities/' || NEW.community_id
  FROM community_memberships cm
  JOIN communities c ON c.id = NEW.community_id
  JOIN user_notification_settings uns ON cm.user_id = uns.user_id
  WHERE cm.community_id = NEW.community_id 
    AND cm.user_id != NEW.user_id -- Don't notify the post author
    AND cm.status = 'approved'
    AND uns.communities_general = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notifications for new marketplace items
CREATE OR REPLACE FUNCTION notify_marketplace_item_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for users interested in marketplace items
  INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type, sender_id, action_url)
  SELECT 
    p.user_id,
    'marketplace',
    'New Item: ' || NEW.title,
    NEW.category || ' - ' || NEW.currency || ' ' || NEW.price,
    NEW.id,
    'marketplace',
    NEW.seller_id,
    '/marketplace'
  FROM profiles p
  JOIN user_notification_settings uns ON p.user_id = uns.user_id
  WHERE uns.marketplace_items = true
    AND p.user_id != NEW.seller_id; -- Don't notify the seller
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notifications for new likes
CREATE OR REPLACE FUNCTION notify_post_liked()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification when someone likes a post
  INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type, sender_id, action_url)
  SELECT 
    p.user_id,
    'like',
    'Post Liked',
    (SELECT display_name FROM profiles WHERE user_id = NEW.user_id) || ' liked your post',
    NEW.post_id,
    'post',
    NEW.user_id,
    '/feed'
  FROM posts p
  WHERE p.id = NEW.post_id
    AND p.user_id != NEW.user_id; -- Don't notify if user likes their own post
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_notify_broadcast_created
  AFTER INSERT ON public.broadcasts
  FOR EACH ROW
  EXECUTE FUNCTION notify_broadcast_created();

CREATE TRIGGER trigger_notify_event_created
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION notify_event_created();

CREATE TRIGGER trigger_notify_community_post_created
  AFTER INSERT ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION notify_community_post_created();

CREATE TRIGGER trigger_notify_marketplace_item_created
  AFTER INSERT ON public.marketplace
  FOR EACH ROW
  EXECUTE FUNCTION notify_marketplace_item_created();

CREATE TRIGGER trigger_notify_post_liked
  AFTER INSERT ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_liked();