# =============================================================================
# OpenSearch Serverless — Collection + security policies + OSIS pipeline
# =============================================================================

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

# --- Encryption Policy ---
resource "aws_opensearchserverless_security_policy" "encryption" {
  name        = "${var.project_name}-${var.environment}-enc"
  type        = "encryption"
  description = "Encryption policy for ${var.project_name} collection"

  policy = jsonencode({
    Rules = [
      {
        Resource     = ["collection/${var.project_name}-${var.environment}"]
        ResourceType = "collection"
      }
    ]
    AWSOwnedKey = true
  })
}

# --- Network Policy ---
resource "aws_opensearchserverless_security_policy" "network" {
  name        = "${var.project_name}-${var.environment}-net"
  type        = "network"
  description = "Network policy for ${var.project_name} collection"

  policy = jsonencode([
    {
      Rules = [
        {
          Resource     = ["collection/${var.project_name}-${var.environment}"]
          ResourceType = "collection"
        }
      ]
      AllowFromPublic = true
      # TODO: Restrict to VPC endpoint in production
    }
  ])
}

# --- Collection ---
resource "aws_opensearchserverless_collection" "main" {
  name        = "${var.project_name}-${var.environment}"
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
  name        = "${var.project_name}-${var.environment}-access"
  type        = "data"
  description = "Data access policy for OSIS pipeline and AppSync"

  policy = jsonencode([
    {
      Rules = [
        {
          Resource     = ["index/${var.project_name}-${var.environment}/*"]
          Permission   = ["aoss:CreateIndex", "aoss:UpdateIndex", "aoss:DescribeIndex", "aoss:ReadDocument", "aoss:WriteDocument"]
          ResourceType = "index"
        },
        {
          Resource     = ["collection/${var.project_name}-${var.environment}"]
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

# --- OSIS Ingestion Pipeline ---
# TODO: Create the pipeline configuration YAML for DynamoDB Streams -> OpenSearch sync
# resource "aws_osis_pipeline" "dynamodb_to_opensearch" {
#   pipeline_name               = "${var.project_name}-${var.environment}-ddb-sync"
#   min_units                   = 1
#   max_units                   = 4
#   pipeline_configuration_body = file("${path.module}/pipeline.yaml")
#
#   tags = {
#     Name = "${var.project_name}-${var.environment}-osis-pipeline"
#   }
# }
