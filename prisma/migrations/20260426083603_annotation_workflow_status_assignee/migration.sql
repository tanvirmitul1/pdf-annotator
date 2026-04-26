-- CreateEnum
CREATE TYPE "AnnotationStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');

-- AlterTable
ALTER TABLE "Annotation" ADD COLUMN     "assigneeId" TEXT,
ADD COLUMN     "status" "AnnotationStatus" NOT NULL DEFAULT 'OPEN';

-- CreateIndex
CREATE INDEX "Annotation_assigneeId_idx" ON "Annotation"("assigneeId");

-- AddForeignKey
ALTER TABLE "Annotation" ADD CONSTRAINT "Annotation_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
