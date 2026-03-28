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
  source            = "./modules/iam"
  environment       = var.environment
  project_name      = var.project_name
  dynamodb_table_arn = module.dynamodb.table_arn
}

module "appsync" {
  source               = "./modules/appsync"
  environment          = var.environment
  project_name         = var.project_name
  cognito_user_pool_id = module.cognito.user_pool_id
  dynamodb_table_name  = module.dynamodb.table_name
  appsync_role_arn     = module.iam.appsync_role_arn
}

module "s3_firmware" {
  source       = "./modules/s3-firmware"
  environment  = var.environment
  project_name = var.project_name
}

module "s3_frontend" {
  source       = "./modules/s3-frontend"
  environment  = var.environment
  project_name = var.project_name
}

module "cloudfront" {
  source                  = "./modules/cloudfront"
  environment             = var.environment
  project_name            = var.project_name
  frontend_bucket_arn     = module.s3_frontend.bucket_arn
  frontend_bucket_domain  = module.s3_frontend.bucket_domain
}

module "lambda_audit" {
  source              = "./modules/lambda-audit"
  environment         = var.environment
  project_name        = var.project_name
  dynamodb_table_name = module.dynamodb.table_name
  dynamodb_stream_arn = module.dynamodb.stream_arn
  lambda_role_arn     = module.iam.lambda_role_arn
  log_retention_days  = var.lambda_log_retention_days
}

# -----------------------------------------------------------------------------
# Optional modules — uncomment when ready
# -----------------------------------------------------------------------------

# module "waf" {
#   source       = "./modules/waf"
#   environment  = var.environment
#   project_name = var.project_name
#   resource_arn = module.appsync.api_id
# }

# module "dns" {
#   source       = "./modules/dns"
#   environment  = var.environment
#   project_name = var.project_name
#   domain_name  = var.domain_name
# }

# module "opensearch" {
#   source              = "./modules/opensearch"
#   environment         = var.environment
#   project_name        = var.project_name
#   dynamodb_table_arn  = module.dynamodb.table_arn
#   dynamodb_stream_arn = module.dynamodb.stream_arn
#   osis_role_arn       = module.iam.osis_role_arn
# }

# module "monitoring" {
#   source       = "./modules/monitoring"
#   environment  = var.environment
#   project_name = var.project_name
# }

# module "alerting" {
#   source       = "./modules/alerting"
#   environment  = var.environment
#   project_name = var.project_name
#   budget_limit = var.budget_limit
# }
