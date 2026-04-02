# =============================================================================
# IMS Gen2 — Root Outputs
# Key resource identifiers for downstream use
# =============================================================================

output "appsync_endpoint" {
  description = "AppSync GraphQL API endpoint URL"
  value       = module.appsync.graphql_url
}

output "appsync_api_id" {
  description = "AppSync GraphQL API ID"
  value       = module.appsync.api_id
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_client_id" {
  description = "Cognito User Pool Client ID"
  value       = module.cognito.client_id
}

output "dynamodb_table_name" {
  description = "DynamoDB DataTable name"
  value       = module.dynamodb.table_name
}

output "dynamodb_table_arn" {
  description = "DynamoDB DataTable ARN"
  value       = module.dynamodb.table_arn
}

output "frontend_bucket" {
  description = "S3 bucket name for frontend SPA assets"
  value       = module.s3_frontend.bucket_name
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain name"
  value       = module.cloudfront.distribution_domain
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.cloudfront.distribution_id
}

output "firmware_bucket" {
  description = "S3 bucket name for firmware storage"
  value       = module.s3_firmware.bucket_name
}

output "lambda_audit_function" {
  description = "Lambda audit processor function name"
  value       = module.lambda_audit.function_name
}

output "opensearch_endpoint" {
  description = "OpenSearch collection/domain endpoint"
  value       = module.opensearch.endpoint
}

output "waf_web_acl_arn" {
  description = "WAF WebACL ARN (empty if WAF disabled)"
  value       = var.enable_waf ? module.waf[0].web_acl_arn : ""
}

output "dns_certificate_arn" {
  description = "ACM certificate ARN (empty if custom domain disabled)"
  value       = var.enable_custom_domain ? module.dns[0].certificate_arn : ""
}
