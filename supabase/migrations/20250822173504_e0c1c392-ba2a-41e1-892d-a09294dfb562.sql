-- Add new columns for StudyYear and ppmkBatch to profiles table
ALTER TABLE public.profiles 
ADD COLUMN study_year text,
ADD COLUMN ppmk_batch text;