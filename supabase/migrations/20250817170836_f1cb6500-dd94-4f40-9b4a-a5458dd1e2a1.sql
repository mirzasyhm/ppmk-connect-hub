-- Create conversations table for direct messaging
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1 UUID NOT NULL,
  participant_2 UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(participant_1, participant_2)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for conversations
CREATE POLICY "Users can view their own conversations" 
ON public.conversations 
FOR SELECT 
USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can create conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can update their own conversations" 
ON public.conversations 
FOR UPDATE 
USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- Create policies for messages
CREATE POLICY "Users can view messages in their conversations" 
ON public.messages 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.conversations 
  WHERE conversations.id = messages.conversation_id 
  AND (conversations.participant_1 = auth.uid() OR conversations.participant_2 = auth.uid())
));

CREATE POLICY "Users can send messages in their conversations" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND 
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND (conversations.participant_1 = auth.uid() OR conversations.participant_2 = auth.uid())
  )
);

CREATE POLICY "Users can update their own messages" 
ON public.messages 
FOR UPDATE 
USING (auth.uid() = sender_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to update conversation's last_message_at when new message is added
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations 
  SET last_message_at = NEW.created_at,
      updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_last_message_trigger
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_last_message();

-- Insert some sample conversations and messages
INSERT INTO public.conversations (participant_1, participant_2) VALUES
('f786f6b6-1064-445d-a54a-3788b20c2036', 'b3fdfc17-99d7-48ce-b0e2-5a61478ff6fe'),
('736f2a9c-a2c4-450e-89bc-71867149600f', 'f786f6b6-1064-445d-a54a-3788b20c2036'),
('3f97f3a6-e17d-452b-8fc1-a8af862dcf5f', 'b3fdfc17-99d7-48ce-b0e2-5a61478ff6fe');

-- Insert sample messages
INSERT INTO public.messages (conversation_id, sender_id, content) 
SELECT 
  c.id,
  c.participant_1,
  'Hey! I saw your post about the MacBook. Is it still available?'
FROM public.conversations c
WHERE c.participant_1 = 'f786f6b6-1064-445d-a54a-3788b20c2036' 
  AND c.participant_2 = 'b3fdfc17-99d7-48ce-b0e2-5a61478ff6fe';

INSERT INTO public.messages (conversation_id, sender_id, content) 
SELECT 
  c.id,
  c.participant_2,
  'Yes, it''s still available! Are you interested in meeting up to check it out?'
FROM public.conversations c
WHERE c.participant_1 = 'f786f6b6-1064-445d-a54a-3788b20c2036' 
  AND c.participant_2 = 'b3fdfc17-99d7-48ce-b0e2-5a61478ff6fe';

INSERT INTO public.messages (conversation_id, sender_id, content) 
SELECT 
  c.id,
  c.participant_2,
  'Want to join our badminton group this weekend?'
FROM public.conversations c
WHERE c.participant_1 = '736f2a9c-a2c4-450e-89bc-71867149600f' 
  AND c.participant_2 = 'f786f6b6-1064-445d-a54a-3788b20c2036';