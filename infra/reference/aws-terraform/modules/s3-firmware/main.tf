# =============================================================================
# S3 Firmware Bucket — WORM storage
# Object Lock, KMS encryption, versioning, Glacier lifecycle
# =============================================================================

resource "aws_kms_key" "firmware" {
  description             = "${var.project_name}-${var.environment}-firmware-key"
  deletion_window_in_days = 7
  enable_key_rotation     = true
}

resource "aws_s3_bucket" "firmware" {
  bucket = "${var.project_name}-${var.environment}-firmware"

  # Object Lock requires versioning and must be set at bucket creation
  object_lock_enabled = true

  tags = {
    Name = "${var.project_name}-${var.environment}-firmware"
  }
}

resource "aws_s3_bucket_versioning" "firmware" {
  bucket = aws_s3_bucket.firmware.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "firmware" {
  bucket = aws_s3_bucket.firmware.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.firmware.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "firmware" {
  bucket = aws_s3_bucket.firmware.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enforce SSL-only access
resource "aws_s3_bucket_policy" "firmware_ssl" {
  bucket = aws_s3_bucket.firmware.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "EnforceSSL"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.firmware.arn,
          "${aws_s3_bucket.firmware.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# Lifecycle rule: transition old firmware versions to Glacier after 365 days
resource "aws_s3_bucket_lifecycle_configuration" "firmware" {
  bucket = aws_s3_bucket.firmware.id

  rule {
    id     = "glacier-transition"
    status = "Enabled"

    filter {}

    transition {
      days          = 365
      storage_class = "GLACIER"
    }

    noncurrent_version_transition {
      noncurrent_days = 90
      storage_class   = "GLACIER"
    }
  }
}

# Object Lock default retention (staging: governance, prod: compliance)
resource "aws_s3_bucket_object_lock_configuration" "firmware" {
  count  = var.enable_object_lock ? 1 : 0
  bucket = aws_s3_bucket.firmware.id

  rule {
    default_retention {
      mode = var.environment == "prod" ? "COMPLIANCE" : "GOVERNANCE"
      days = 365
    }
  }
}
