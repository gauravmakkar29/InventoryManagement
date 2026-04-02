variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Project identifier used in resource naming"
  type        = string
}

variable "budget_limit" {
  description = "Monthly budget alert threshold in USD"
  type        = number
  default     = 50
}

variable "alert_email" {
  description = "Email address for SNS alert subscriptions (empty to skip)"
  type        = string
  default     = ""
}

variable "dynamodb_table_name" {
  description = "DynamoDB DataTable name for alarm dimensions"
  type        = string
}

variable "lambda_function_name" {
  description = "Lambda audit processor function name for alarm dimensions"
  type        = string
}

variable "appsync_api_id" {
  description = "AppSync API ID for alarm dimensions"
  type        = string
}
