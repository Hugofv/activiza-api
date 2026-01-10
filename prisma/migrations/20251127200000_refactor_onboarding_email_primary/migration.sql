-- AlterTable: Add new columns for document type and country code
ALTER TABLE "clients" 
  ADD COLUMN IF NOT EXISTS "document_type" TEXT,
  ADD COLUMN IF NOT EXISTS "document_country_code" TEXT;

-- Update existing clients: Set document_country_code to 'BR' for existing documents (assuming Brazilian CPF/CNPJ)
-- This is a safe default for existing data
UPDATE "clients" 
SET "document_country_code" = 'BR'
WHERE "document" IS NOT NULL AND "document_country_code" IS NULL;

-- For existing documents, try to infer document type based on length
-- CPF has 11 digits, CNPJ has 14 digits
UPDATE "clients"
SET "document_type" = CASE 
  WHEN LENGTH(REGEXP_REPLACE("document", '[^0-9]', '', 'g')) = 11 THEN 'cpf'
  WHEN LENGTH(REGEXP_REPLACE("document", '[^0-9]', '', 'g')) = 14 THEN 'cnpj'
  ELSE 'other'
END
WHERE "document" IS NOT NULL AND "document_type" IS NULL;

-- Make email NOT NULL - but first we need to handle existing null emails
-- For existing clients without email, we'll set a temporary email based on ID
-- In production, you should handle this differently based on your data
UPDATE "clients"
SET "email" = 'temp_' || id::text || '@temp.ativiza.com'
WHERE "email" IS NULL OR "email" = '';

-- Now make email NOT NULL and add unique constraint
-- First remove old unique constraint on document if it exists
DROP INDEX IF EXISTS "clients_document_key";
ALTER TABLE "clients" 
  ALTER COLUMN "email" SET NOT NULL;

-- Create unique constraint on email
CREATE UNIQUE INDEX IF NOT EXISTS "clients_email_key" ON "clients"("email");

-- Make document nullable (it's already optional in the schema, but we need to ensure constraint is removed)
-- The document column can now be null

-- Create unique index for document by country (partial index to handle nulls)
-- This index only applies when both document_country_code and document are not null
CREATE UNIQUE INDEX IF NOT EXISTS "unique_document_by_country" 
ON "clients"("document_country_code", "document")
WHERE "document_country_code" IS NOT NULL AND "document" IS NOT NULL;
