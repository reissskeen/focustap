-- Grant teacher role to admin account so it can create courses and sessions
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'teacher'
FROM auth.users
WHERE email = 'reiss4rs@gmail.com'
ON CONFLICT DO NOTHING;
