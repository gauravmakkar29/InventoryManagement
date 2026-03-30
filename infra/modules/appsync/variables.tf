variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Project identifier used in resource naming"
  type        = string
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID for API authentication"
  type        = string
}

variable "dynamodb_table_name" {
  description = "DynamoDB DataTable name for data source"
  type        = string
}

variable "appsync_role_arn" {
  description = "IAM role ARN for AppSync to access DynamoDB"
  type        = string
}

variable "opensearch_endpoint" {
  description = "OpenSearch collection/domain endpoint for HTTP data source"
  type        = string
  default     = ""
}
