# =============================================================================
# Cognito — User Pool + Client + Groups
# Password policy, MFA, custom attributes, 5 user groups
# =============================================================================

resource "aws_cognito_user_pool" "main" {
  name = "${var.project_name}-${var.environment}-user-pool"

  # Username configuration
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # Password policy (NIST 800-63B aligned)
  password_policy {
    minimum_length                   = 12
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = true
    temporary_password_validity_days = 7
  }

  # MFA configuration
  mfa_configuration = var.mfa_configuration

  software_token_mfa_configuration {
    enabled = true
  }

  # Custom attributes for IMS
  schema {
    name                = "tenant_id"
    attribute_data_type = "String"
    mutable             = true
    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    name                = "role"
    attribute_data_type = "String"
    mutable             = true
    string_attribute_constraints {
      min_length = 1
      max_length = 64
    }
  }

  schema {
    name                = "department"
    attribute_data_type = "String"
    mutable             = true
    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    name                = "customerId"
    attribute_data_type = "String"
    mutable             = true
    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  # Account recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-user-pool"
  }
}

resource "aws_cognito_user_pool_client" "main" {
  name         = "${var.project_name}-${var.environment}-client"
  user_pool_id = aws_cognito_user_pool.main.id

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]

  # Token expiry settings
  access_token_validity  = var.token_expiry_minutes
  id_token_validity      = var.token_expiry_minutes
  refresh_token_validity = 30

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }

  prevent_user_existence_errors = "ENABLED"
}

# --- User Groups ---

resource "aws_cognito_user_group" "admin" {
  name         = "Admin"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Full system administrators"
  precedence   = 1
}

resource "aws_cognito_user_group" "manager" {
  name         = "Manager"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Inventory managers with write access"
  precedence   = 2
}

resource "aws_cognito_user_group" "technician" {
  name         = "Technician"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Field technicians with limited write access"
  precedence   = 3
}

resource "aws_cognito_user_group" "viewer" {
  name         = "Viewer"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Read-only access users"
  precedence   = 4
}

resource "aws_cognito_user_group" "customer_admin" {
  name         = "CustomerAdmin"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Customer-scoped administrators (multi-tenant)"
  precedence   = 5
}
