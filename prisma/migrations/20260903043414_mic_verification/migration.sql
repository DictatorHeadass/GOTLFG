-- AlterTable
ALTER TABLE "User" ADD COLUMN     "micVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "micVerifiedMethod" TEXT,
ADD COLUMN     "micVerifiedSession" TEXT;
