variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Project identifier used in resource naming"
  type        = string
}

variable "enable_pitr" {
  description = "Enable DynamoDB Point-in-Time Recovery"
  type        = bool
  default     = false
}
