# =============================================================================
# DynamoDB — Single-table design (DataTable)
# 4 GSIs, DynamoDB Streams, PITR, KMS encryption
# =============================================================================

resource "aws_kms_key" "dynamodb" {
  description             = "${var.project_name}-${var.environment}-dynamodb-key"
  deletion_window_in_days = 7
  enable_key_rotation     = true
}

resource "aws_dynamodb_table" "data_table" {
  name         = "${var.project_name}-${var.environment}-DataTable"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  attribute {
    name = "GSI1PK"
    type = "S"
  }

  attribute {
    name = "GSI1SK"
    type = "S"
  }

  attribute {
    name = "GSI2PK"
    type = "S"
  }

  attribute {
    name = "GSI2SK"
    type = "S"
  }

  attribute {
    name = "GSI3PK"
    type = "S"
  }

  attribute {
    name = "GSI3SK"
    type = "S"
  }

  attribute {
    name = "GSI4PK"
    type = "S"
  }

  attribute {
    name = "GSI4SK"
    type = "S"
  }

  # GSI1 — Entity-type queries (e.g., all devices by status)
  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }

  # GSI2 — Location/org hierarchy queries
  global_secondary_index {
    name            = "GSI2"
    hash_key        = "GSI2PK"
    range_key       = "GSI2SK"
    projection_type = "ALL"
  }

  # GSI3 — Temporal queries (e.g., audit trails by date)
  global_secondary_index {
    name            = "GSI3"
    hash_key        = "GSI3PK"
    range_key       = "GSI3SK"
    projection_type = "ALL"
  }

  # GSI4 — Cross-entity relationship queries
  global_secondary_index {
    name            = "GSI4"
    hash_key        = "GSI4PK"
    range_key       = "GSI4SK"
    projection_type = "ALL"
  }

  # Enable DynamoDB Streams for audit processing and OpenSearch sync
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  # Point-in-time recovery (disabled in dev, enabled in staging/prod)
  point_in_time_recovery {
    enabled = var.enable_pitr
  }

  # Server-side encryption with KMS
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.dynamodb.arn
  }

  # TTL attribute for automatic item expiration
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-DataTable"
  }
}

# =============================================================================
# DynamoDB — Dedicated Audit Log Table
# Separates audit data from operational data to prevent hot partition risk
# at scale and enable independent PITR/retention policies.
# @see Story #167
# =============================================================================

resource "aws_dynamodb_table" "audit_table" {
  name         = "${var.project_name}-${var.environment}-AuditLog"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  # GSI: Query audit logs by user (e.g., PK=USER#user-id, SK=timestamp)
  attribute {
    name = "GSI1PK"
    type = "S"
  }

  attribute {
    name = "GSI1SK"
    type = "S"
  }

  # GSI: Query audit logs by resource (e.g., PK=RESOURCE#device-001, SK=timestamp)
  attribute {
    name = "GSI2PK"
    type = "S"
  }

  attribute {
    name = "GSI2SK"
    type = "S"
  }

  # GSI1 — User-based audit queries (all actions by a specific user)
  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }

  # GSI2 — Resource-based audit queries (all actions on a specific resource)
  global_secondary_index {
    name            = "GSI2"
    hash_key        = "GSI2PK"
    range_key       = "GSI2SK"
    projection_type = "ALL"
  }

  # PITR always enabled on audit table (compliance requirement)
  point_in_time_recovery {
    enabled = true
  }

  # Server-side encryption with KMS (same key as DataTable)
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.dynamodb.arn
  }

  # TTL for automatic audit log rotation (e.g., 2 years)
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-AuditLog"
  }
}
