-- Script to create test users in Supabase
-- First create users through Supabase Auth, then run this script to set their roles

-- Test users (passwords should be set through Supabase Auth UI or API)
-- admin@test.com / password123!
-- manager@test.com / password123!
-- engineer@test.com / password123!
-- viewer@test.com / password123!

-- After creating users in Supabase Auth, get their IDs and update this script

-- Example: Update user roles (replace with actual user IDs from auth.users table)
/*
-- Admin user
INSERT INTO public.users (id, email, full_name, role, department, is_active)
VALUES (
    'YOUR_ADMIN_USER_ID', -- Replace with actual ID from auth.users
    'admin@test.com',
    'Admin User',
    'admin',
    'IT Department',
    true
) ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Manager user
INSERT INTO public.users (id, email, full_name, role, department, is_active)
VALUES (
    'YOUR_MANAGER_USER_ID', -- Replace with actual ID from auth.users
    'manager@test.com',
    'Manager User',
    'manager',
    'Quality Department',
    true
) ON CONFLICT (id) DO UPDATE SET role = 'manager';

-- Engineer user
INSERT INTO public.users (id, email, full_name, role, department, is_active)
VALUES (
    'YOUR_ENGINEER_USER_ID', -- Replace with actual ID from auth.users
    'engineer@test.com',
    'Engineer User',
    'engineer',
    'Testing Department',
    true
) ON CONFLICT (id) DO UPDATE SET role = 'engineer';

-- Viewer user
INSERT INTO public.users (id, email, full_name, role, department, is_active)
VALUES (
    'YOUR_VIEWER_USER_ID', -- Replace with actual ID from auth.users
    'viewer@test.com',
    'Viewer User',
    'viewer',
    'Operations Department',
    true
) ON CONFLICT (id) DO UPDATE SET role = 'viewer';
*/

-- To find user IDs after creating them in Supabase Auth:
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;