-- User approval workflow: new dealers start PENDING and need admin approval.

-- 1. Status enum.
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'APPROVED', 'BLOCKED');

-- 2. New column (default PENDING for future self-registrations).
ALTER TABLE "User" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'PENDING';

-- 3. Existing users are already trusted — approve them so nobody is locked out.
UPDATE "User" SET "status" = 'APPROVED';

-- 4. Index for filtering pending users in the admin panel.
CREATE INDEX "User_status_idx" ON "User"("status");
