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
