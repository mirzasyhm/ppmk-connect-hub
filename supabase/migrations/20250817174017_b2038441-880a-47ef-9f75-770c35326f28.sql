-- Make the current user (test1234@yopmail.com) a superadmin
INSERT INTO public.user_roles (user_id, role, assigned_at)
VALUES ('b0b79b43-9604-4d4b-9a1a-78f40d24000d', 'superadmin', now())
ON CONFLICT (user_id, role) DO NOTHING;