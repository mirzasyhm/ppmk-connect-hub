-- Create currency_exchanges table for users to post currency exchange requests
CREATE TABLE public.currency_exchanges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  have_currency TEXT NOT NULL,
  have_amount NUMERIC NOT NULL,
  want_currency TEXT NOT NULL,
  want_amount NUMERIC NOT NULL,
  exchange_rate NUMERIC,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.currency_exchanges ENABLE ROW LEVEL SECURITY;

-- Create policies for currency exchanges
CREATE POLICY "Currency exchanges are viewable by everyone" 
ON public.currency_exchanges 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own currency exchange posts" 
ON public.currency_exchanges 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own currency exchange posts" 
ON public.currency_exchanges 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own currency exchange posts" 
ON public.currency_exchanges 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_currency_exchanges_updated_at
BEFORE UPDATE ON public.currency_exchanges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample currency exchange data
INSERT INTO public.currency_exchanges (user_id, have_currency, have_amount, want_currency, want_amount, exchange_rate, description, status) VALUES
('f786f6b6-1064-445d-a54a-3788b20c2036', 'KRW', 1000000, 'MYR', 3400, 0.0034, 'Looking to exchange Korean Won for Malaysian Ringgit. Preferably meet near campus.', 'active'),
('b3fdfc17-99d7-48ce-b0e2-5a61478ff6fe', 'MYR', 500, 'KRW', 147000, 294, 'Have Malaysian Ringgit, need Korean Won for trip to Seoul. Can meet this weekend.', 'active'),
('736f2a9c-a2c4-450e-89bc-71867149600f', 'KRW', 500000, 'MYR', 1700, 0.0034, 'Exchange KRW to MYR. Fair rates, quick transaction.', 'active'),
('3f97f3a6-e17d-452b-8fc1-a8af862dcf5f', 'MYR', 200, 'KRW', 58800, 294, 'Small amount exchange needed. Flexible with timing.', 'active'),
('bc2a4017-5f80-471b-9372-942b6a3bf624', 'KRW', 2000000, 'MYR', 6800, 0.0034, 'Large amount exchange for tuition payment. Serious inquiries only.', 'active');