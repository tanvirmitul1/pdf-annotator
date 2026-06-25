-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('DOCUMENTS', 'AI_CHAT');

-- CreateTable
CREATE TABLE "UserServiceAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "service" "ServiceType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserServiceAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserServiceAccess_userId_idx" ON "UserServiceAccess"("userId");

-- CreateIndex
CREATE INDEX "UserServiceAccess_service_idx" ON "UserServiceAccess"("service");

-- CreateIndex
CREATE UNIQUE INDEX "UserServiceAccess_userId_service_key" ON "UserServiceAccess"("userId", "service");

-- AddForeignKey
ALTER TABLE "UserServiceAccess" ADD CONSTRAINT "UserServiceAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
