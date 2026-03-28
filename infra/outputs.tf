output "appsync_endpoint" {
  description = "AppSync GraphQL API endpoint URL"
  value       = module.appsync.graphql_url
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_client_id" {
  description = "Cognito User Pool Client ID"
  value       = module.cognito.client_id
}

output "frontend_bucket" {
  description = "S3 bucket name for frontend SPA assets"
  value       = module.s3_frontend.bucket_name
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain name"
  value       = module.cloudfront.distribution_domain
}
