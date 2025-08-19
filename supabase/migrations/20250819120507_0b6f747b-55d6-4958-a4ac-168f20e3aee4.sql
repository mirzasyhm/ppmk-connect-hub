-- Add DELETE policy for broadcasts table
CREATE POLICY "Only admins can delete broadcasts" 
ON public.broadcasts 
FOR DELETE 
USING (auth.uid() = created_by);