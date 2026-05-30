-- CreateTable
CREATE TABLE "PendingClassSync" (
    "id" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "classType" TEXT NOT NULL DEFAULT '',
    "color" TEXT NOT NULL DEFAULT '',
    "assistantId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingClassSync_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PendingClassSync_teacherId_status_idx" ON "PendingClassSync"("teacherId", "status");

-- CreateIndex
CREATE INDEX "PendingClassSync_assistantId_idx" ON "PendingClassSync"("assistantId");

-- AddForeignKey
ALTER TABLE "PendingClassSync" ADD CONSTRAINT "PendingClassSync_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingClassSync" ADD CONSTRAINT "PendingClassSync_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
