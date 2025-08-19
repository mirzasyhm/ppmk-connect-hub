-- Create event_participants table to track who joined which events
CREATE TABLE public.event_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
  UNIQUE(event_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- Create policies for event participants
CREATE POLICY "Event participants are viewable by everyone" 
ON public.event_participants 
FOR SELECT 
USING (true);

CREATE POLICY "Users can join events" 
ON public.event_participants 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation status" 
ON public.event_participants 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can cancel their own participation" 
ON public.event_participants 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger to update event participant count
CREATE OR REPLACE FUNCTION public.update_event_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.events 
    SET current_participants = (
      SELECT COUNT(*) 
      FROM public.event_participants 
      WHERE event_id = NEW.event_id AND status = 'registered'
    )
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.events 
    SET current_participants = (
      SELECT COUNT(*) 
      FROM public.event_participants 
      WHERE event_id = OLD.event_id AND status = 'registered'
    )
    WHERE id = OLD.event_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.events 
    SET current_participants = (
      SELECT COUNT(*) 
      FROM public.event_participants 
      WHERE event_id = NEW.event_id AND status = 'registered'
    )
    WHERE id = NEW.event_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic participant count updates
CREATE TRIGGER update_event_participants_insert
  AFTER INSERT ON public.event_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_event_participant_count();

CREATE TRIGGER update_event_participants_delete
  AFTER DELETE ON public.event_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_event_participant_count();

CREATE TRIGGER update_event_participants_update
  AFTER UPDATE ON public.event_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_event_participant_count();