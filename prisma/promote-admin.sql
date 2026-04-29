-- Promote a user to ADMIN role
-- Replace 'your-email@example.com' with your actual email address

UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'tanvirimruet@gmail.com';

-- Verify the change
SELECT id, name, email, role, "planId" 
FROM "User" 
WHERE role = 'ADMIN';
