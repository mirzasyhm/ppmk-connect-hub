-- Create community memberships table
CREATE TABLE public.community_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'banned')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- Create community events table for community-specific events
CREATE TABLE public.community_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  image_url TEXT,
  organizer_id UUID NOT NULL,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create community messages table for community chat
CREATE TABLE public.community_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.community_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_memberships
CREATE POLICY "Community memberships are viewable by everyone"
ON public.community_memberships
FOR SELECT
USING (true);

CREATE POLICY "Users can join communities"
ON public.community_memberships
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update memberships"
ON public.community_memberships
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.community_memberships cm
    WHERE cm.community_id = community_memberships.community_id
    AND cm.user_id = auth.uid()
    AND cm.role = 'admin'
  )
);

CREATE POLICY "Users can leave communities"
ON public.community_memberships
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for community_events
CREATE POLICY "Community events are viewable by members"
ON public.community_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.community_memberships cm
    WHERE cm.community_id = community_events.community_id
    AND cm.user_id = auth.uid()
    AND cm.status = 'active'
  )
);

CREATE POLICY "Community admins can create events"
ON public.community_events
FOR INSERT
WITH CHECK (
  auth.uid() = organizer_id AND
  EXISTS (
    SELECT 1 FROM public.community_memberships cm
    WHERE cm.community_id = community_events.community_id
    AND cm.user_id = auth.uid()
    AND cm.role IN ('admin', 'moderator')
  )
);

CREATE POLICY "Event organizers can update their events"
ON public.community_events
FOR UPDATE
USING (auth.uid() = organizer_id);

-- RLS Policies for community_messages
CREATE POLICY "Community messages are viewable by members"
ON public.community_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.community_memberships cm
    WHERE cm.community_id = community_messages.community_id
    AND cm.user_id = auth.uid()
    AND cm.status = 'active'
  )
);

CREATE POLICY "Community members can send messages"
ON public.community_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.community_memberships cm
    WHERE cm.community_id = community_messages.community_id
    AND cm.user_id = auth.uid()
    AND cm.status = 'active'
  )
);

CREATE POLICY "Users can update their own messages"
ON public.community_messages
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
ON public.community_messages
FOR DELETE
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_community_events_updated_at
BEFORE UPDATE ON public.community_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_messages_updated_at
BEFORE UPDATE ON public.community_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some mock community memberships
INSERT INTO public.community_memberships (community_id, user_id, role) VALUES
((SELECT id FROM public.communities WHERE name = 'Computer Science Club' LIMIT 1), gen_random_uuid(), 'admin'),
((SELECT id FROM public.communities WHERE name = 'MIT Students' LIMIT 1), gen_random_uuid(), 'admin'),
((SELECT id FROM public.communities WHERE name = 'Photography Enthusiasts' LIMIT 1), gen_random_uuid(), 'admin');