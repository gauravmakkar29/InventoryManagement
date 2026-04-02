# =============================================================================
# IMS Gen2 — Root Module
# Composes all infrastructure modules with inter-module references
# =============================================================================

# -----------------------------------------------------------------------------
# Core modules (always enabled)
# -----------------------------------------------------------------------------

module "dynamodb" {
  source       = "./modules/dynamodb"
  environment  = var.environment
  project_name = var.project_name
  enable_pitr  = var.enable_pitr
}

module "cognito" {
  source               = "./modules/cognito"
  environment          = var.environment
  project_name         = var.project_name
  mfa_configuration    = var.cognito_mfa
  token_expiry_minutes = var.token_expiry_minutes
}

module "iam" {
  source                      = "./modules/iam"
  environment                 = var.environment
  project_name                = var.project_name
  dynamodb_table_arn          = module.dynamodb.table_arn
  audit_table_arn             = module.dynamodb.audit_table_arn
  opensearch_export_bucket_arn = module.opensearch.export_bucket_arn
  opensearch_collection_arn    = module.opensearch.collection_arn
}

module "appsync" {
  source               = "./modules/appsync"
  environment          = var.environment
  project_name         = var.project_name
  cognito_user_pool_id = module.cognito.user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  appsync_role_arn     = module.iam.appsync_role_arn
  opensearch_endpoint  = module.opensearch.endpoint
}

module "s3_firmware" {
  source             = "./modules/s3-firmware"
  environment        = var.environment
  project_name       = var.project_name
  enable_object_lock = var.s3_firmware_object_lock
}

module "s3_frontend" {
  source       = "./modules/s3-frontend"
  environment  = var.environment
  project_name = var.project_name
}

module "cloudfront" {
  source                 = "./modules/cloudfront"
  environment            = var.environment
  project_name           = var.project_name
  frontend_bucket_arn    = module.s3_frontend.bucket_arn
  frontend_bucket_domain = module.s3_frontend.bucket_domain
  acm_certificate_arn    = var.enable_custom_domain ? module.dns[0].certificate_arn : ""
  enable_custom_domain   = var.enable_custom_domain
  domain_name            = var.domain_name
  waf_web_acl_arn        = var.enable_waf ? module.waf[0].web_acl_arn : ""
}

module "lambda_audit" {
  source              = "./modules/lambda-audit"
  environment         = var.environment
  project_name        = var.project_name
  dynamodb_table_name = module.dynamodb.table_name
  audit_table_name    = module.dynamodb.audit_table_name
  dynamodb_stream_arn = module.dynamodb.stream_arn
  lambda_role_arn     = module.iam.lambda_role_arn
  log_retention_days  = var.lambda_log_retention_days
}

# -----------------------------------------------------------------------------
# Conditional modules
# -----------------------------------------------------------------------------

module "waf" {
  count        = var.enable_waf ? 1 : 0
  source       = "./modules/waf"
  environment  = var.environment
  project_name = var.project_name
  resource_arn = module.appsync.api_arn
  waf_mode     = var.waf_default_action
}

module "dns" {
  count        = var.enable_custom_domain ? 1 : 0
  source       = "./modules/dns"
  environment  = var.environment
  project_name = var.project_name
  domain_name  = var.domain_name
}

module "opensearch" {
  source              = "./modules/opensearch"
  environment         = var.environment
  project_name        = var.project_name
  opensearch_type     = var.opensearch_type
  dynamodb_table_arn  = module.dynamodb.table_arn
  dynamodb_stream_arn = module.dynamodb.stream_arn
  osis_role_arn       = module.iam.osis_role_arn
}

module "monitoring" {
  source               = "./modules/monitoring"
  environment          = var.environment
  project_name         = var.project_name
  dynamodb_table_name  = module.dynamodb.table_name
  lambda_function_name = module.lambda_audit.function_name
  appsync_api_id       = module.appsync.api_id
}

module "alerting" {
  source               = "./modules/alerting"
  environment          = var.environment
  project_name         = var.project_name
  budget_limit         = var.budget_limit
  alert_email          = var.alert_email
  dynamodb_table_name  = module.dynamodb.table_name
  lambda_function_name = module.lambda_audit.function_name
  appsync_api_id       = module.appsync.api_id
}
