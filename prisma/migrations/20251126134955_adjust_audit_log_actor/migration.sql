/*
  Warnings:

  - You are about to drop the column `user_id` on the `audit_logs` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_user_id_fkey";

-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "user_id",
ADD COLUMN     "actor" TEXT;
