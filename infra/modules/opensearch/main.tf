# =============================================================================
# OpenSearch — Serverless (prod) or Managed (dev/staging)
# Collection + security policies + OSIS pipeline + export bucket
# =============================================================================

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

locals {
  is_serverless   = var.opensearch_type == "serverless"
  collection_name = "${var.project_name}-${var.environment}"
}

# =============================================================================
# OpenSearch Serverless (production)
# =============================================================================

# --- Encryption Policy ---
resource "aws_opensearchserverless_security_policy" "encryption" {
  count       = local.is_serverless ? 1 : 0
  name        = "${var.project_name}-${var.environment}-enc"
  type        = "encryption"
  description = "Encryption policy for ${var.project_name} collection"

  policy = jsonencode({
    Rules = [
      {
        Resource     = ["collection/${local.collection_name}"]
        ResourceType = "collection"
      }
    ]
    AWSOwnedKey = true
  })
}

# --- Network Policy ---
resource "aws_opensearchserverless_security_policy" "network" {
  count       = local.is_serverless ? 1 : 0
  name        = "${var.project_name}-${var.environment}-net"
  type        = "network"
  description = "Network policy for ${var.project_name} collection"

  policy = jsonencode([
    {
      Rules = [
        {
          Resource     = ["collection/${local.collection_name}"]
          ResourceType = "collection"
        }
      ]
      AllowFromPublic = true
    }
  ])
}

# --- Serverless Collection ---
resource "aws_opensearchserverless_collection" "main" {
  count       = local.is_serverless ? 1 : 0
  name        = local.collection_name
  type        = "SEARCH"
  description = "Search index for IMS Gen2 entities"

  depends_on = [
    aws_opensearchserverless_security_policy.encryption,
    aws_opensearchserverless_security_policy.network,
  ]

  tags = {
    Name = "${var.project_name}-${var.environment}-collection"
  }
}

# --- Data Access Policy ---
resource "aws_opensearchserverless_access_policy" "main" {
  count       = local.is_serverless ? 1 : 0
  name        = "${var.project_name}-${var.environment}-access"
  type        = "data"
  description = "Data access policy for OSIS pipeline and AppSync"

  policy = jsonencode([
    {
      Rules = [
        {
          Resource     = ["index/${local.collection_name}/*"]
          Permission   = ["aoss:CreateIndex", "aoss:UpdateIndex", "aoss:DescribeIndex", "aoss:ReadDocument", "aoss:WriteDocument"]
          ResourceType = "index"
        },
        {
          Resource     = ["collection/${local.collection_name}"]
          Permission   = ["aoss:CreateCollectionItems", "aoss:DescribeCollectionItems", "aoss:UpdateCollectionItems"]
          ResourceType = "collection"
        }
      ]
      Principal = [
        var.osis_role_arn,
        "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
      ]
    }
  ])
}

# =============================================================================
# OpenSearch Managed Domain (dev/staging — cost savings)
# =============================================================================

resource "aws_opensearch_domain" "managed" {
  count       = local.is_serverless ? 0 : 1
  domain_name = "${var.project_name}-${var.environment}"

  engine_version = "OpenSearch_2.11"

  cluster_config {
    instance_type  = var.environment == "staging" ? "t3.medium.search" : "t3.small.search"
    instance_count = 1
  }

  ebs_options {
    ebs_enabled = true
    volume_size = 20
    volume_type = "gp3"
  }

  encrypt_at_rest {
    enabled = true
  }

  node_to_node_encryption {
    enabled = true
  }

  domain_endpoint_options {
    enforce_https       = true
    tls_security_policy = "Policy-Min-TLS-1-2-2019-07"
  }

  advanced_security_options {
    enabled                        = true
    internal_user_database_enabled = true

    master_user_options {
      master_user_name     = "admin"
      master_user_password = "Admin123!temp"
    }
  }

  access_policies = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { AWS = var.osis_role_arn }
        Action    = "es:*"
        Resource  = "arn:aws:es:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:domain/${var.project_name}-${var.environment}/*"
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-opensearch"
  }
}

# =============================================================================
# S3 Export Bucket — Initial DynamoDB data load into OpenSearch
# =============================================================================

resource "aws_s3_bucket" "export" {
  bucket = "${var.project_name}-${var.environment}-ddb-export"

  tags = {
    Name = "${var.project_name}-${var.environment}-ddb-export"
  }
}

resource "aws_s3_bucket_versioning" "export" {
  bucket = aws_s3_bucket.export.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "export" {
  bucket = aws_s3_bucket.export.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "export" {
  bucket = aws_s3_bucket.export.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "export" {
  bucket = aws_s3_bucket.export.id

  rule {
    id     = "cleanup-exports"
    status = "Enabled"

    filter {}

    expiration {
      days = 30
    }
  }
}

# =============================================================================
# OSIS Ingestion Pipeline — DynamoDB Streams to OpenSearch
# =============================================================================

resource "aws_osis_pipeline" "dynamodb_to_opensearch" {
  pipeline_name = "${var.project_name}-${var.environment}-ddb-sync"
  min_units     = 1
  max_units     = 4

  pipeline_configuration_body = local.is_serverless ? templatefile("${path.module}/pipeline-serverless.yaml", {
    region              = data.aws_region.current.name
    role_arn            = var.osis_role_arn
    table_arn           = var.dynamodb_table_arn
    stream_arn          = var.dynamodb_stream_arn
    export_bucket       = aws_s3_bucket.export.id
    collection_endpoint = aws_opensearchserverless_collection.main[0].collection_endpoint
    index_name          = "ims-entities"
    }) : templatefile("${path.module}/pipeline-managed.yaml", {
    region          = data.aws_region.current.name
    role_arn        = var.osis_role_arn
    table_arn       = var.dynamodb_table_arn
    stream_arn      = var.dynamodb_stream_arn
    export_bucket   = aws_s3_bucket.export.id
    domain_endpoint = aws_opensearch_domain.managed[0].endpoint
    index_name      = "ims-entities"
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-osis-pipeline"
  }
}
