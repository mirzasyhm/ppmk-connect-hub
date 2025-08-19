-- Change events_reminder_timing from single string to array of strings
ALTER TABLE public.user_notification_settings 
DROP COLUMN IF EXISTS events_reminder_timing;

ALTER TABLE public.user_notification_settings 
ADD COLUMN events_reminder_timings TEXT[] DEFAULT ARRAY['1_week'];

-- Update existing rows to have the default array value
UPDATE public.user_notification_settings 
SET events_reminder_timings = ARRAY['1_week'] 
WHERE events_reminder_timings IS NULL;