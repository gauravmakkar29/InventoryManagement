variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Project identifier used in resource naming"
  type        = string
}

variable "dynamodb_table_name" {
  description = "DynamoDB DataTable name for dashboard metrics"
  type        = string
}

variable "lambda_function_name" {
  description = "Lambda audit processor function name for dashboard metrics"
  type        = string
}

variable "appsync_api_id" {
  description = "AppSync API ID for dashboard metrics"
  type        = string
}
