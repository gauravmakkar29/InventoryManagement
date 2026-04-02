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

variable "audit_table_arn" {
  description = "ARN of the DynamoDB AuditLog table"
  type        = string
}

variable "opensearch_export_bucket_arn" {
  description = "ARN of the S3 export bucket for OSIS pipeline (scoped access)"
  type        = string
  default     = ""
}

variable "opensearch_collection_arn" {
  description = "ARN of the OpenSearch collection/domain for OSIS pipeline (scoped access)"
  type        = string
  default     = ""
}
