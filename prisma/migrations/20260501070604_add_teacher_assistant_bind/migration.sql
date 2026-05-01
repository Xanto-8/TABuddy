-- AlterTable
ALTER TABLE "KnowledgeBaseEntry" ADD COLUMN     "classGroupId" TEXT,
ADD COLUMN     "scope" TEXT NOT NULL DEFAULT 'personal',
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "classGroupId" TEXT,
ADD COLUMN     "lastActiveAt" TIMESTAMP(3),
ADD COLUMN     "lastLoginCity" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "lastLoginCountry" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "lastLoginIp" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "lastLoginRegion" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "role" SET DEFAULT 'student';

-- CreateTable
CREATE TABLE "ClassGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BannedIP" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "bannedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BannedIP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherAssistantBind" (
    "id" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "validPeriod" TEXT NOT NULL DEFAULT 'permanent',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bindedAt" TIMESTAMP(3),
    "teacherId" TEXT NOT NULL,
    "assistantId" TEXT,

    CONSTRAINT "TeacherAssistantBind_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClassGroup_name_key" ON "ClassGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BannedIP_ip_key" ON "BannedIP"("ip");

-- CreateIndex
CREATE INDEX "TeacherAssistantBind_inviteCode_status_idx" ON "TeacherAssistantBind"("inviteCode", "status");

-- CreateIndex
CREATE INDEX "TeacherAssistantBind_teacherId_status_idx" ON "TeacherAssistantBind"("teacherId", "status");

-- CreateIndex
CREATE INDEX "TeacherAssistantBind_assistantId_status_idx" ON "TeacherAssistantBind"("assistantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherAssistantBind_teacherId_assistantId_key" ON "TeacherAssistantBind"("teacherId", "assistantId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_classGroupId_fkey" FOREIGN KEY ("classGroupId") REFERENCES "ClassGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeBaseEntry" ADD CONSTRAINT "KnowledgeBaseEntry_classGroupId_fkey" FOREIGN KEY ("classGroupId") REFERENCES "ClassGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAssistantBind" ADD CONSTRAINT "TeacherAssistantBind_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAssistantBind" ADD CONSTRAINT "TeacherAssistantBind_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
