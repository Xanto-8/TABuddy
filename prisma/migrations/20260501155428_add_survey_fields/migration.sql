-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hasFillSurvey" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "TeacherRegCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherRegCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeacherRegCode_code_key" ON "TeacherRegCode"("code");

-- CreateIndex
CREATE INDEX "TeacherRegCode_code_isActive_idx" ON "TeacherRegCode"("code", "isActive");

-- CreateIndex
CREATE INDEX "TeacherRegCode_creatorId_idx" ON "TeacherRegCode"("creatorId");

-- AddForeignKey
ALTER TABLE "TeacherRegCode" ADD CONSTRAINT "TeacherRegCode_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
