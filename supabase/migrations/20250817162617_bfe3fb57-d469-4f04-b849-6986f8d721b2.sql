-- Create broadcasts table for PPMK high council announcements
CREATE TABLE public.broadcasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Create marketplace table for buy/sell items
CREATE TABLE public.marketplace (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  category TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
  image_url TEXT,
  seller_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold', 'reserved')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  image_url TEXT,
  organizer_id UUID NOT NULL,
  category TEXT NOT NULL,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create communities table
CREATE TABLE public.communities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('student_club', 'university_group', 'age_group', 'interest_group')),
  image_url TEXT,
  admin_id UUID NOT NULL,
  member_count INTEGER DEFAULT 0,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create community posts table for posts within communities
CREATE TABLE public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for broadcasts (public read, admin write)
CREATE POLICY "Broadcasts are viewable by everyone" 
ON public.broadcasts 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can create broadcasts" 
ON public.broadcasts 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Only admins can update broadcasts" 
ON public.broadcasts 
FOR UPDATE 
USING (auth.uid() = created_by);

-- RLS Policies for marketplace
CREATE POLICY "Marketplace items are viewable by everyone" 
ON public.marketplace 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own marketplace items" 
ON public.marketplace 
FOR INSERT 
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update their own marketplace items" 
ON public.marketplace 
FOR UPDATE 
USING (auth.uid() = seller_id);

CREATE POLICY "Users can delete their own marketplace items" 
ON public.marketplace 
FOR DELETE 
USING (auth.uid() = seller_id);

-- RLS Policies for events
CREATE POLICY "Events are viewable by everyone" 
ON public.events 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create events" 
ON public.events 
FOR INSERT 
WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Users can update their own events" 
ON public.events 
FOR UPDATE 
USING (auth.uid() = organizer_id);

CREATE POLICY "Users can delete their own events" 
ON public.events 
FOR DELETE 
USING (auth.uid() = organizer_id);

-- RLS Policies for communities
CREATE POLICY "Communities are viewable by everyone" 
ON public.communities 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create communities" 
ON public.communities 
FOR INSERT 
WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Admins can update their communities" 
ON public.communities 
FOR UPDATE 
USING (auth.uid() = admin_id);

-- RLS Policies for community posts
CREATE POLICY "Community posts are viewable by everyone" 
ON public.community_posts 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create posts in communities" 
ON public.community_posts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own community posts" 
ON public.community_posts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own community posts" 
ON public.community_posts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_broadcasts_updated_at
BEFORE UPDATE ON public.broadcasts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketplace_updated_at
BEFORE UPDATE ON public.marketplace
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_communities_updated_at
BEFORE UPDATE ON public.communities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_posts_updated_at
BEFORE UPDATE ON public.community_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert mock data
-- Mock broadcasts
INSERT INTO public.broadcasts (title, content, priority, created_by) VALUES
('Welcome to PPMKFriends!', 'The PPMK High Council is excited to announce the launch of our new social platform. Connect with fellow members, share updates, and stay informed about important announcements.', 'high', gen_random_uuid()),
('Annual PPMK Conference 2024', 'Save the date! Our annual conference will be held on December 15-17, 2024. Registration opens next month. More details to follow.', 'normal', gen_random_uuid()),
('New Community Guidelines', 'Please review the updated community guidelines to ensure a positive experience for all members. Respect, inclusivity, and constructive dialogue are our core values.', 'normal', gen_random_uuid()),
('Urgent: System Maintenance', 'Scheduled maintenance will occur this Sunday from 2-4 AM. The platform may be temporarily unavailable during this time.', 'urgent', gen_random_uuid());

-- Mock marketplace items
INSERT INTO public.marketplace (title, description, price, category, condition, seller_id) VALUES
('MacBook Pro 2021', 'Excellent condition MacBook Pro with M1 chip. Barely used, comes with original box and charger. Perfect for students!', 1200.00, 'Electronics', 'like_new', gen_random_uuid()),
('Calculus Textbook', 'Stewart Calculus 8th Edition. Some highlighting but in good condition. Great for math courses.', 45.00, 'Books', 'good', gen_random_uuid()),
('Gaming Chair', 'Ergonomic gaming chair in black. Very comfortable for long study sessions. Minor wear on armrests.', 150.00, 'Furniture', 'good', gen_random_uuid()),
('iPhone 13', 'Unlocked iPhone 13 in blue. Excellent condition with screen protector and case included.', 650.00, 'Electronics', 'like_new', gen_random_uuid()),
('Dorm Mini Fridge', 'Compact refrigerator perfect for dorm rooms. Energy efficient and quiet operation.', 80.00, 'Appliances', 'good', gen_random_uuid());

-- Mock events
INSERT INTO public.events (title, description, location, event_date, organizer_id, category, max_participants) VALUES
('Programming Workshop', 'Learn the basics of web development with React and JavaScript. Beginner-friendly workshop with hands-on coding exercises.', 'Computer Lab A', '2024-12-20 14:00:00+00', gen_random_uuid(), 'Education', 30),
('Holiday Mixer', 'Join us for a festive holiday celebration! Food, music, and great company. Come meet fellow PPMK members in a relaxed setting.', 'Student Center Ballroom', '2024-12-22 18:00:00+00', gen_random_uuid(), 'Social', 100),
('Career Fair 2024', 'Connect with potential employers and learn about internship opportunities. Over 50 companies will be represented.', 'Main Auditorium', '2024-12-18 10:00:00+00', gen_random_uuid(), 'Professional', 200),
('Study Group: Finals Prep', 'Group study session for upcoming finals. Bring your materials and lets help each other succeed!', 'Library Study Room 3', '2024-12-19 19:00:00+00', gen_random_uuid(), 'Academic', 15),
('Basketball Tournament', 'Annual PPMK basketball tournament. Form your teams and compete for the championship trophy!', 'Sports Complex', '2024-12-21 16:00:00+00', gen_random_uuid(), 'Sports', 64);

-- Mock communities
INSERT INTO public.communities (name, description, type, admin_id, member_count) VALUES
('Computer Science Club', 'A community for CS students to share knowledge, work on projects, and network with peers in the field.', 'student_club', gen_random_uuid(), 156),
('MIT Students', 'Connect with fellow MIT students. Share experiences, study tips, and campus events.', 'university_group', gen_random_uuid(), 342),
('Class of 2027', 'Freshman community for the Class of 2027. Navigate college life together!', 'age_group', gen_random_uuid(), 89),
('Photography Enthusiasts', 'Share your photos, learn new techniques, and organize photo walks around campus.', 'interest_group', gen_random_uuid(), 67),
('Stanford Students', 'Official group for Stanford University students. Academic resources and social connections.', 'university_group', gen_random_uuid(), 278),
('Debate Society', 'Sharpen your argumentation skills and engage in thoughtful discussions on current topics.', 'student_club', gen_random_uuid(), 43);

-- Mock community posts
INSERT INTO public.community_posts (community_id, user_id, title, content) VALUES
((SELECT id FROM public.communities WHERE name = 'Computer Science Club' LIMIT 1), gen_random_uuid(), 'Hackathon Team Formation', 'Looking for 2-3 teammates for the upcoming hackathon. Im a backend developer with experience in Python and Node.js. DM me if interested!'),
((SELECT id FROM public.communities WHERE name = 'MIT Students' LIMIT 1), gen_random_uuid(), 'Best Study Spots on Campus', 'Whats everyones favorite place to study? Ive been trying different spots and curious about hidden gems on campus.'),
((SELECT id FROM public.communities WHERE name = 'Photography Enthusiasts' LIMIT 1), gen_random_uuid(), 'Golden Hour Shots', 'Captured some amazing sunset photos yesterday near the lake. The lighting was perfect! Anyone want to organize a group photo walk this weekend?'),
((SELECT id FROM public.communities WHERE name = 'Class of 2027' LIMIT 1), gen_random_uuid(), 'Freshman Survival Tips', 'As someone whos halfway through their first semester, here are my top tips for fellow freshmen: 1) Join study groups early, 2) Dont skip breakfast, 3) Actually read the syllabus!'),
((SELECT id FROM public.communities WHERE name = 'Debate Society' LIMIT 1), gen_random_uuid(), 'Next Topic Suggestions', 'What topics should we debate next week? Im thinking something related to AI ethics or climate policy. Drop your suggestions below!');