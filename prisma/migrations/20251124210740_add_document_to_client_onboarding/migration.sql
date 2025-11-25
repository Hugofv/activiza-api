-- AlterTable: Add document field (required, unique) and make name and accountId nullable for step-by-step onboarding
ALTER TABLE "clients" 
  ADD COLUMN "document" TEXT,
  ALTER COLUMN "account_id" DROP NOT NULL,
  ALTER COLUMN "name" DROP NOT NULL;

-- CreateIndex: Make document unique
CREATE UNIQUE INDEX "clients_document_key" ON "clients"("document");

-- Update existing clients: Set a temporary document if null (for existing data)
-- This is a safety measure - in production you should handle existing data separately
UPDATE "clients" 
SET "document" = 'TEMP_' || id::text 
WHERE "document" IS NULL;

-- Now make document NOT NULL
ALTER TABLE "clients" ALTER COLUMN "document" SET NOT NULL;

