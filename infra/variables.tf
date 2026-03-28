variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "project_name" {
  description = "Project identifier used in resource naming"
  type        = string
  default     = "ims-gen2"
}

variable "domain_name" {
  description = "Custom domain name for the application (e.g. ims.example.com)"
  type        = string
  default     = ""
}

variable "enable_waf" {
  description = "Whether to enable WAF v2 WebACL"
  type        = bool
  default     = false
}

variable "enable_pitr" {
  description = "Enable DynamoDB Point-in-Time Recovery"
  type        = bool
  default     = false
}

variable "cognito_mfa" {
  description = "MFA configuration for Cognito User Pool (OFF, OPTIONAL, ON)"
  type        = string
  default     = "OPTIONAL"
  validation {
    condition     = contains(["OFF", "OPTIONAL", "ON"], var.cognito_mfa)
    error_message = "cognito_mfa must be one of: OFF, OPTIONAL, ON."
  }
}

variable "token_expiry_minutes" {
  description = "Cognito token expiry in minutes"
  type        = number
  default     = 60
}

variable "lambda_log_retention_days" {
  description = "CloudWatch log retention period in days for Lambda functions"
  type        = number
  default     = 7
}

variable "budget_limit" {
  description = "Monthly budget alert threshold in USD"
  type        = number
  default     = 50
}
