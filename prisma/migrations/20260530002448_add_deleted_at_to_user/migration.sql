-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "createdBy" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "KnowledgeBaseEntry" ADD COLUMN     "convertStatus" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN     "fileName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "filePath" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "fileSize" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fileType" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "pdfPath" TEXT,
ALTER COLUMN "content" SET DEFAULT '';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3);
