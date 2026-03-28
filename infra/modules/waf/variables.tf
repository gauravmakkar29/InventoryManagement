variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Project identifier used in resource naming"
  type        = string
}

variable "resource_arn" {
  description = "ARN of the resource to associate with WAF WebACL"
  type        = string
}
