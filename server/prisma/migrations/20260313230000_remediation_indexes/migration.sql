-- Add indexes to support admin log lookups and auth artifact cleanup.
CREATE INDEX "User_verificationExpiry_idx" ON "User"("verificationExpiry");
CREATE INDEX "User_resetExpiry_idx" ON "User"("resetExpiry");
CREATE INDEX "User_twoFactorEnabled_updatedAt_idx" ON "User"("twoFactorEnabled", "updatedAt");
CREATE INDEX "AuditLog_adminId_idx" ON "AuditLog"("adminId");
