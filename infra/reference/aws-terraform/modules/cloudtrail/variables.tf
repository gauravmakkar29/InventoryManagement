variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Project identifier used in resource naming"
  type        = string
}

variable "s3_bucket_arns" {
  description = "S3 bucket ARNs to enable data events on (e.g. firmware bucket)"
  type        = list(string)
  default     = []
}

variable "log_retention_days" {
  description = "Number of days to retain CloudTrail logs in S3 and CloudWatch"
  type        = number
  default     = 90
}

variable "enable_xray" {
  description = "Flag indicating X-Ray tracing intent (actual config in AppSync/Lambda modules)"
  type        = bool
  default     = true
}
