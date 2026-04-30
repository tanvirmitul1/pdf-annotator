-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AnnotationType" ADD VALUE 'SIGNATURE';
ALTER TYPE "AnnotationType" ADD VALUE 'REDACTION';
ALTER TYPE "AnnotationType" ADD VALUE 'CHECKMARK';
ALTER TYPE "AnnotationType" ADD VALUE 'CROSS';
ALTER TYPE "AnnotationType" ADD VALUE 'LINE';
ALTER TYPE "AnnotationType" ADD VALUE 'STAMP';

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "pageOrder" JSONB;
