-- Add indexes for Client model
CREATE INDEX IF NOT EXISTS "idx_client_email" ON "clients"("email");
CREATE INDEX IF NOT EXISTS "idx_client_account_id" ON "clients"("account_id");
CREATE INDEX IF NOT EXISTS "idx_client_deleted_at" ON "clients"("deleted_at");
CREATE INDEX IF NOT EXISTS "idx_client_account_deleted" ON "clients"("account_id", "deleted_at");
CREATE INDEX IF NOT EXISTS "idx_client_created_at" ON "clients"("created_at");

-- Add indexes for Account model
CREATE INDEX IF NOT EXISTS "idx_account_email" ON "accounts"("email");
CREATE INDEX IF NOT EXISTS "idx_account_owner_id" ON "accounts"("owner_id");
CREATE INDEX IF NOT EXISTS "idx_account_plan_id" ON "accounts"("plan_id");
CREATE INDEX IF NOT EXISTS "idx_account_status" ON "accounts"("status");
CREATE INDEX IF NOT EXISTS "idx_account_deleted_at" ON "accounts"("deleted_at");
CREATE INDEX IF NOT EXISTS "idx_account_owner_deleted" ON "accounts"("owner_id", "deleted_at");
CREATE INDEX IF NOT EXISTS "idx_account_created_at" ON "accounts"("created_at");

-- Add indexes for PlatformUser model
CREATE INDEX IF NOT EXISTS "idx_platform_user_email" ON "platform_users"("email");
CREATE INDEX IF NOT EXISTS "idx_platform_user_role" ON "platform_users"("role");
CREATE INDEX IF NOT EXISTS "idx_platform_user_is_active" ON "platform_users"("is_active");
CREATE INDEX IF NOT EXISTS "idx_platform_user_deleted_at" ON "platform_users"("deleted_at");
CREATE INDEX IF NOT EXISTS "idx_platform_user_role_deleted" ON "platform_users"("role", "deleted_at");
CREATE INDEX IF NOT EXISTS "idx_platform_user_created_at" ON "platform_users"("created_at");

-- Add indexes for Operation model
CREATE INDEX IF NOT EXISTS "idx_operation_account_id" ON "operations"("account_id");
CREATE INDEX IF NOT EXISTS "idx_operation_client_id" ON "operations"("client_id");
CREATE INDEX IF NOT EXISTS "idx_operation_status" ON "operations"("status");
CREATE INDEX IF NOT EXISTS "idx_operation_type" ON "operations"("type");
CREATE INDEX IF NOT EXISTS "idx_operation_deleted_at" ON "operations"("deleted_at");
CREATE INDEX IF NOT EXISTS "idx_operation_account_deleted" ON "operations"("account_id", "deleted_at");
CREATE INDEX IF NOT EXISTS "idx_operation_client_deleted" ON "operations"("client_id", "deleted_at");
CREATE INDEX IF NOT EXISTS "idx_operation_status_deleted" ON "operations"("status", "deleted_at");
CREATE INDEX IF NOT EXISTS "idx_operation_created_at" ON "operations"("created_at");
CREATE INDEX IF NOT EXISTS "idx_operation_due_date" ON "operations"("due_date");

-- Add indexes for Payment model
CREATE INDEX IF NOT EXISTS "idx_payment_client_id" ON "payments"("client_id");
CREATE INDEX IF NOT EXISTS "idx_payment_operation_id" ON "payments"("operation_id");
CREATE INDEX IF NOT EXISTS "idx_payment_installment_id" ON "payments"("installment_id");
CREATE INDEX IF NOT EXISTS "idx_payment_deleted_at" ON "payments"("deleted_at");
CREATE INDEX IF NOT EXISTS "idx_payment_paid_at" ON "payments"("paid_at");
CREATE INDEX IF NOT EXISTS "idx_payment_operation_deleted" ON "payments"("operation_id", "deleted_at");

-- Add indexes for Installment model
CREATE INDEX IF NOT EXISTS "idx_installment_operation_id" ON "installments"("operation_id");
CREATE INDEX IF NOT EXISTS "idx_installment_status" ON "installments"("status");
CREATE INDEX IF NOT EXISTS "idx_installment_due_date" ON "installments"("due_date");
CREATE INDEX IF NOT EXISTS "idx_installment_deleted_at" ON "installments"("deleted_at");
CREATE INDEX IF NOT EXISTS "idx_installment_operation_status" ON "installments"("operation_id", "status");
CREATE INDEX IF NOT EXISTS "idx_installment_operation_deleted" ON "installments"("operation_id", "deleted_at");
CREATE INDEX IF NOT EXISTS "idx_installment_status_due_date" ON "installments"("status", "due_date");

-- Add indexes for LeadQualification model
CREATE INDEX IF NOT EXISTS "idx_lead_qualification_account_id" ON "lead_qualifications"("account_id");
CREATE INDEX IF NOT EXISTS "idx_lead_qualification_client_id" ON "lead_qualifications"("client_id");
CREATE INDEX IF NOT EXISTS "idx_lead_qualification_question_key" ON "lead_qualifications"("question_key");
CREATE INDEX IF NOT EXISTS "idx_lead_qualification_deleted_at" ON "lead_qualifications"("deleted_at");
CREATE INDEX IF NOT EXISTS "idx_lead_qualification_account_question" ON "lead_qualifications"("account_id", "question_key");
CREATE INDEX IF NOT EXISTS "idx_lead_qualification_client_question" ON "lead_qualifications"("client_id", "question_key");
CREATE INDEX IF NOT EXISTS "idx_lead_qualification_client_deleted" ON "lead_qualifications"("client_id", "deleted_at");

-- Add indexes for Notification model
CREATE INDEX IF NOT EXISTS "idx_notification_user_id" ON "notifications"("user_id");
CREATE INDEX IF NOT EXISTS "idx_notification_read" ON "notifications"("read");
CREATE INDEX IF NOT EXISTS "idx_notification_deleted_at" ON "notifications"("deleted_at");
CREATE INDEX IF NOT EXISTS "idx_notification_user_read" ON "notifications"("user_id", "read");
CREATE INDEX IF NOT EXISTS "idx_notification_user_deleted" ON "notifications"("user_id", "deleted_at");
CREATE INDEX IF NOT EXISTS "idx_notification_created_at" ON "notifications"("created_at");

-- Add indexes for ClientPhoto model
CREATE INDEX IF NOT EXISTS "idx_client_photo_client_id" ON "client_photos"("client_id");
CREATE INDEX IF NOT EXISTS "idx_client_photo_deleted_at" ON "client_photos"("deleted_at");

-- Add indexes for Resource model
CREATE INDEX IF NOT EXISTS "idx_resource_account_id" ON "resources"("account_id");
CREATE INDEX IF NOT EXISTS "idx_resource_type" ON "resources"("type");
CREATE INDEX IF NOT EXISTS "idx_resource_deleted_at" ON "resources"("deleted_at");
CREATE INDEX IF NOT EXISTS "idx_resource_account_deleted" ON "resources"("account_id", "deleted_at");

-- Add indexes for Alert model
CREATE INDEX IF NOT EXISTS "idx_alert_operation_id" ON "alerts"("operation_id");
CREATE INDEX IF NOT EXISTS "idx_alert_type" ON "alerts"("type");
CREATE INDEX IF NOT EXISTS "idx_alert_enabled" ON "alerts"("enabled");
CREATE INDEX IF NOT EXISTS "idx_alert_send_at" ON "alerts"("send_at");
CREATE INDEX IF NOT EXISTS "idx_alert_deleted_at" ON "alerts"("deleted_at");
CREATE INDEX IF NOT EXISTS "idx_alert_operation_deleted" ON "alerts"("operation_id", "deleted_at");

-- Add indexes for Plan model
CREATE INDEX IF NOT EXISTS "idx_plan_is_active" ON "plans"("is_active");
CREATE INDEX IF NOT EXISTS "idx_plan_is_public" ON "plans"("is_public");
CREATE INDEX IF NOT EXISTS "idx_plan_deleted_at" ON "plans"("deleted_at");
CREATE INDEX IF NOT EXISTS "idx_plan_active_public_deleted" ON "plans"("is_active", "is_public", "deleted_at");
CREATE INDEX IF NOT EXISTS "idx_plan_sort_order" ON "plans"("sort_order");
