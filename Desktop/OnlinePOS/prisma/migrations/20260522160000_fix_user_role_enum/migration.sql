-- Ensure PLATFORM_ADMIN exists on UserRole enum (safe if already applied)
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'PLATFORM_ADMIN';
