variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Project identifier used in resource naming"
  type        = string
}

variable "dynamodb_table_arn" {
  description = "ARN of the DynamoDB DataTable"
  type        = string
}

variable "dynamodb_stream_arn" {
  description = "DynamoDB Streams ARN for OSIS pipeline source"
  type        = string
}

variable "osis_role_arn" {
  description = "IAM role ARN for the OSIS pipeline"
  type        = string
}
