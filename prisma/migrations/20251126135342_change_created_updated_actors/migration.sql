-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_created_by_fkey";

-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "addresses" DROP CONSTRAINT "addresses_created_by_fkey";

-- DropForeignKey
ALTER TABLE "addresses" DROP CONSTRAINT "addresses_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "alerts" DROP CONSTRAINT "alerts_created_by_fkey";

-- DropForeignKey
ALTER TABLE "alerts" DROP CONSTRAINT "alerts_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "client_photos" DROP CONSTRAINT "client_photos_created_by_fkey";

-- DropForeignKey
ALTER TABLE "client_photos" DROP CONSTRAINT "client_photos_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "clients" DROP CONSTRAINT "clients_created_by_fkey";

-- DropForeignKey
ALTER TABLE "clients" DROP CONSTRAINT "clients_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "features" DROP CONSTRAINT "features_created_by_fkey";

-- DropForeignKey
ALTER TABLE "features" DROP CONSTRAINT "features_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "installments" DROP CONSTRAINT "installments_created_by_fkey";

-- DropForeignKey
ALTER TABLE "installments" DROP CONSTRAINT "installments_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "lead_qualifications" DROP CONSTRAINT "lead_qualifications_created_by_fkey";

-- DropForeignKey
ALTER TABLE "lead_qualifications" DROP CONSTRAINT "lead_qualifications_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "modules" DROP CONSTRAINT "modules_created_by_fkey";

-- DropForeignKey
ALTER TABLE "modules" DROP CONSTRAINT "modules_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_created_by_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "operation_photos" DROP CONSTRAINT "operation_photos_created_by_fkey";

-- DropForeignKey
ALTER TABLE "operation_photos" DROP CONSTRAINT "operation_photos_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "operations" DROP CONSTRAINT "operations_created_by_fkey";

-- DropForeignKey
ALTER TABLE "operations" DROP CONSTRAINT "operations_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_created_by_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "plans" DROP CONSTRAINT "plans_created_by_fkey";

-- DropForeignKey
ALTER TABLE "plans" DROP CONSTRAINT "plans_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "resources" DROP CONSTRAINT "resources_created_by_fkey";

-- DropForeignKey
ALTER TABLE "resources" DROP CONSTRAINT "resources_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "settings" DROP CONSTRAINT "settings_created_by_fkey";

-- DropForeignKey
ALTER TABLE "settings" DROP CONSTRAINT "settings_updated_by_fkey";

-- AlterTable
ALTER TABLE "accounts" ALTER COLUMN "created_by" SET DATA TYPE TEXT,
ALTER COLUMN "updated_by" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "addresses" ALTER COLUMN "created_by" SET DATA TYPE TEXT,
ALTER COLUMN "updated_by" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "alerts" ALTER COLUMN "created_by" SET DATA TYPE TEXT,
ALTER COLUMN "updated_by" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "client_photos" ALTER COLUMN "created_by" SET DATA TYPE TEXT,
ALTER COLUMN "updated_by" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "clients" ALTER COLUMN "created_by" SET DATA TYPE TEXT,
ALTER COLUMN "updated_by" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "features" ALTER COLUMN "created_by" SET DATA TYPE TEXT,
ALTER COLUMN "updated_by" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "installments" ALTER COLUMN "created_by" SET DATA TYPE TEXT,
ALTER COLUMN "updated_by" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "lead_qualifications" ALTER COLUMN "created_by" SET DATA TYPE TEXT,
ALTER COLUMN "updated_by" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "modules" ALTER COLUMN "created_by" SET DATA TYPE TEXT,
ALTER COLUMN "updated_by" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "notifications" ALTER COLUMN "created_by" SET DATA TYPE TEXT,
ALTER COLUMN "updated_by" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "operation_photos" ALTER COLUMN "created_by" SET DATA TYPE TEXT,
ALTER COLUMN "updated_by" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "operations" ALTER COLUMN "created_by" SET DATA TYPE TEXT,
ALTER COLUMN "updated_by" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "created_by" SET DATA TYPE TEXT,
ALTER COLUMN "updated_by" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "plans" ALTER COLUMN "created_by" SET DATA TYPE TEXT,
ALTER COLUMN "updated_by" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "resources" ALTER COLUMN "created_by" SET DATA TYPE TEXT,
ALTER COLUMN "updated_by" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "settings" ALTER COLUMN "created_by" SET DATA TYPE TEXT,
ALTER COLUMN "updated_by" SET DATA TYPE TEXT;
