-- AlterTable: Add hasReadGuide to User
ALTER TABLE "User" ADD COLUMN "hasReadGuide" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: SystemConfig for yuque guide URLs
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");
