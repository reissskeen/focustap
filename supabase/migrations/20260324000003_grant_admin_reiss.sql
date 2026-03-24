-- Grant admin role to reiss4rs@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'reiss4rs@gmail.com'
ON CONFLICT DO NOTHING;
