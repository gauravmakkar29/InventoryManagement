variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Project identifier used in resource naming"
  type        = string
}

variable "dynamodb_table_name" {
  description = "DynamoDB DataTable name"
  type        = string
}

variable "dynamodb_stream_arn" {
  description = "DynamoDB Streams ARN for event source mapping"
  type        = string
}

variable "lambda_role_arn" {
  description = "IAM role ARN for the Lambda function"
  type        = string
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}
