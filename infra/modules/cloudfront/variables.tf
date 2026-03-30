variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Project identifier used in resource naming"
  type        = string
}

variable "frontend_bucket_arn" {
  description = "ARN of the frontend S3 bucket"
  type        = string
}

variable "frontend_bucket_domain" {
  description = "Regional domain name of the frontend S3 bucket"
  type        = string
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for custom domain HTTPS"
  type        = string
  default     = ""
}

variable "enable_custom_domain" {
  description = "Whether to enable custom domain on CloudFront"
  type        = bool
  default     = false
}

variable "domain_name" {
  description = "Custom domain name for CloudFront aliases"
  type        = string
  default     = ""
}

variable "waf_web_acl_arn" {
  description = "WAF WebACL ARN to associate with CloudFront (empty to skip)"
  type        = string
  default     = ""
}
