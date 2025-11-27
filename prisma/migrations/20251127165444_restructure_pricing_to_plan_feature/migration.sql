/*
  Warnings:

  - You are about to drop the column `price` on the `plan_features` table. All the data in the column will be lost.
  - You are about to drop the `feature_prices` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "feature_prices" DROP CONSTRAINT "feature_prices_feature_id_fkey";

-- AlterTable
ALTER TABLE "plan_features" DROP COLUMN "price",
ALTER COLUMN "reset_period" SET DEFAULT 'LIFETIME';

-- DropTable
DROP TABLE "feature_prices";

-- CreateTable
CREATE TABLE "plan_feature_prices" (
    "id" SERIAL NOT NULL,
    "plan_feature_id" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_feature_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plan_feature_prices_plan_feature_id_currency_key" ON "plan_feature_prices"("plan_feature_id", "currency");

-- AddForeignKey
ALTER TABLE "plan_feature_prices" ADD CONSTRAINT "plan_feature_prices_plan_feature_id_fkey" FOREIGN KEY ("plan_feature_id") REFERENCES "plan_features"("id") ON DELETE CASCADE ON UPDATE CASCADE;
