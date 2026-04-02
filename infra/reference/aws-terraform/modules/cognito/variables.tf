variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Project identifier used in resource naming"
  type        = string
}

variable "mfa_configuration" {
  description = "MFA configuration (OFF, OPTIONAL, ON)"
  type        = string
  default     = "OPTIONAL"
}

variable "token_expiry_minutes" {
  description = "Access/ID token expiry in minutes"
  type        = number
  default     = 60
}
