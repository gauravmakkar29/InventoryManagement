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

variable "waf_mode" {
  description = "WAF managed rule override action: count (logging only) or none (block mode)"
  type        = string
  default     = "count"
  validation {
    condition     = contains(["count", "none"], var.waf_mode)
    error_message = "waf_mode must be count or none."
  }
}
