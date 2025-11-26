/*
  Warnings:

  - You are about to drop the column `currency` on the `features` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `features` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "features" DROP COLUMN "currency",
DROP COLUMN "price";

-- CreateTable
CREATE TABLE "feature_prices" (
    "id" SERIAL NOT NULL,
    "feature_id" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feature_prices_feature_id_currency_key" ON "feature_prices"("feature_id", "currency");

-- AddForeignKey
ALTER TABLE "feature_prices" ADD CONSTRAINT "feature_prices_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE CASCADE;
