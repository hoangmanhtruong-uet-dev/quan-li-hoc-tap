-- Migration: Replatform roles
-- users.role: 'student'|'coach'|'admin' -> 'USER'|'PLATFORM_ADMIN'
-- team_memberships.role: 'owner'|'member'|'viewer' -> 'OWNER'|'ADMIN'|'MANAGER'|'MEMBER'|'VIEWER'

ALTER TABLE users MODIFY COLUMN role ENUM('USER','PLATFORM_ADMIN') NOT NULL DEFAULT 'USER';
UPDATE users SET role = 'USER' WHERE role NOT IN ('USER','PLATFORM_ADMIN');

ALTER TABLE team_memberships MODIFY COLUMN role ENUM('OWNER','ADMIN','MANAGER','MEMBER','VIEWER') NOT NULL DEFAULT 'MEMBER';