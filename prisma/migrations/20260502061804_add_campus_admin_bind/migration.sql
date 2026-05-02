-- CreateTable
CREATE TABLE "CampusAdminBind" (
    "id" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "validPeriod" TEXT NOT NULL DEFAULT 'permanent',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bindedAt" TIMESTAMP(3),
    "classAdminId" TEXT NOT NULL,
    "campusAdminId" TEXT,

    CONSTRAINT "CampusAdminBind_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CampusAdminBind_inviteCode_status_idx" ON "CampusAdminBind"("inviteCode", "status");

-- CreateIndex
CREATE INDEX "CampusAdminBind_classAdminId_status_idx" ON "CampusAdminBind"("classAdminId", "status");

-- CreateIndex
CREATE INDEX "CampusAdminBind_campusAdminId_status_idx" ON "CampusAdminBind"("campusAdminId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CampusAdminBind_classAdminId_campusAdminId_key" ON "CampusAdminBind"("classAdminId", "campusAdminId");

-- AddForeignKey
ALTER TABLE "CampusAdminBind" ADD CONSTRAINT "CampusAdminBind_classAdminId_fkey" FOREIGN KEY ("classAdminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampusAdminBind" ADD CONSTRAINT "CampusAdminBind_campusAdminId_fkey" FOREIGN KEY ("campusAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
