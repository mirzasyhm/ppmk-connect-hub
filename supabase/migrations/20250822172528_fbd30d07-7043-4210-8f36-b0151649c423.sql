-- Add column to profiles to track if user must change password on first login
ALTER TABLE public.profiles 
ADD COLUMN must_change_password boolean NOT NULL DEFAULT false;

-- Add index for performance
CREATE INDEX idx_profiles_must_change_password ON public.profiles(must_change_password) WHERE must_change_password = true;

-- Create or replace function to mark users as needing password change when created via invited_credentials
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Check if this user was created from invited_credentials
  IF EXISTS (
    SELECT 1 FROM public.invited_credentials 
    WHERE email = NEW.email AND used = false
  ) THEN
    -- Mark invited credentials as used
    UPDATE public.invited_credentials 
    SET used = true, used_at = NOW() 
    WHERE email = NEW.email AND used = false;
    
    -- Insert profile with must_change_password = true for invited users
    INSERT INTO public.profiles (
      user_id, 
      email, 
      display_name, 
      must_change_password
    )
    VALUES (
      NEW.id, 
      NEW.email, 
      COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
      true  -- Force password change for invited users
    );
  ELSE
    -- Regular signup - no password change required
    INSERT INTO public.profiles (
      user_id, 
      email, 
      display_name, 
      must_change_password
    )
    VALUES (
      NEW.id, 
      NEW.email, 
      COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$;