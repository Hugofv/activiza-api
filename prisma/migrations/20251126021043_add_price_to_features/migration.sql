-- AlterTable
ALTER TABLE "features" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'BRL',
ADD COLUMN     "price" DECIMAL(10,2);
