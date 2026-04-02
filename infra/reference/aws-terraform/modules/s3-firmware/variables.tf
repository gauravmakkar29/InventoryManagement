variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Project identifier used in resource naming"
  type        = string
}

variable "enable_object_lock" {
  description = "Enable S3 Object Lock (WORM) default retention"
  type        = bool
  default     = false
}
