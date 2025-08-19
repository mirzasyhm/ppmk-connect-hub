-- Update broadcast policies to allow any admin to modify/delete
DROP POLICY IF EXISTS "Only admins can delete broadcasts" ON public.broadcasts;
DROP POLICY IF EXISTS "Only admins can update broadcasts" ON public.broadcasts;

-- Create new policies that allow any admin/superadmin to modify/delete
CREATE POLICY "Admins can delete any broadcast" 
ON public.broadcasts 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Admins can update any broadcast" 
ON public.broadcasts 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));