-- AlterTable
ALTER TABLE "plan_features" ADD COLUMN     "operation_limit" INTEGER,
ADD COLUMN     "reset_period" TEXT NOT NULL DEFAULT 'MONTHLY';

-- CreateTable
CREATE TABLE "feature_usages" (
    "id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "plan_feature_id" INTEGER NOT NULL,
    "operation_id" BIGINT NOT NULL,
    "usage_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feature_usages_account_id_plan_feature_id_period_idx" ON "feature_usages"("account_id", "plan_feature_id", "period");

-- AddForeignKey
ALTER TABLE "feature_usages" ADD CONSTRAINT "feature_usages_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_usages" ADD CONSTRAINT "feature_usages_plan_feature_id_fkey" FOREIGN KEY ("plan_feature_id") REFERENCES "plan_features"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_usages" ADD CONSTRAINT "feature_usages_operation_id_fkey" FOREIGN KEY ("operation_id") REFERENCES "operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
