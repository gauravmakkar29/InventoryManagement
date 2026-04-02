# =============================================================================
# IMS Gen 2 — Amazon Location Service Module — Variables
# =============================================================================

variable "project_prefix" {
  description = "Prefix for all Location Service resource names"
  type        = string
  default     = "ims-gen2"
}

variable "aws_region" {
  description = "AWS region for Location Service resources"
  type        = string
  default     = "ap-southeast-2"
}

variable "map_style" {
  description = "Map style for Amazon Location Maps (e.g., VectorEsriNavigation, VectorHereExplore)"
  type        = string
  default     = "VectorEsriNavigation"
}

variable "places_data_source" {
  description = "Data provider for Place Index (Esri or Here)"
  type        = string
  default     = "Esri"

  validation {
    condition     = contains(["Esri", "Here"], var.places_data_source)
    error_message = "places_data_source must be either 'Esri' or 'Here'."
  }
}

variable "cognito_identity_pool_arn" {
  description = "ARN of the Cognito Identity Pool role to grant Location Service permissions"
  type        = string
  default     = ""
}

variable "cognito_authenticated_role_name" {
  description = "Name of the Cognito authenticated IAM role to attach Location Service policies"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default = {
    Project   = "IMS-Gen2"
    ManagedBy = "Terraform"
    Epic      = "Epic-10"
  }
}
