-- AlterTable
ALTER TABLE "Annotation" ADD COLUMN     "clientId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Annotation_clientId_key" ON "Annotation"("clientId");
