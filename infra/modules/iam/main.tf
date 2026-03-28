# =============================================================================
# IAM — Service roles and least-privilege policies
# Roles: AppSync, Lambda (audit), OSIS pipeline
# =============================================================================

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

# --- AppSync Service Role ---

resource "aws_iam_role" "appsync" {
  name = "${var.project_name}-${var.environment}-appsync-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "appsync.amazonaws.com" }
        Action    = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-appsync-role"
  }
}

resource "aws_iam_role_policy" "appsync_dynamodb" {
  name = "${var.project_name}-${var.environment}-appsync-dynamodb"
  role = aws_iam_role.appsync.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          var.dynamodb_table_arn,
          "${var.dynamodb_table_arn}/index/*"
        ]
      }
    ]
  })
}

# --- Lambda Audit Processor Role ---

resource "aws_iam_role" "lambda_audit" {
  name = "${var.project_name}-${var.environment}-lambda-audit-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "lambda.amazonaws.com" }
        Action    = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-lambda-audit-role"
  }
}

resource "aws_iam_role_policy" "lambda_dynamodb_stream" {
  name = "${var.project_name}-${var.environment}-lambda-dynamodb-stream"
  role = aws_iam_role.lambda_audit.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:DescribeStream",
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:ListStreams"
        ]
        Resource = "${var.dynamodb_table_arn}/stream/*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ]
        Resource = var.dynamodb_table_arn
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_logs" {
  name = "${var.project_name}-${var.environment}-lambda-logs"
  role = aws_iam_role.lambda_audit.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.project_name}-${var.environment}-*:*"
      }
    ]
  })
}

# --- OSIS Pipeline Role ---

resource "aws_iam_role" "osis_pipeline" {
  name = "${var.project_name}-${var.environment}-osis-pipeline-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "osis-pipelines.amazonaws.com" }
        Action    = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-osis-pipeline-role"
  }
}

resource "aws_iam_role_policy" "osis_dynamodb" {
  name = "${var.project_name}-${var.environment}-osis-dynamodb"
  role = aws_iam_role.osis_pipeline.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:DescribeTable",
          "dynamodb:DescribeStream",
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:ListStreams",
          "dynamodb:DescribeExport",
          "dynamodb:DescribeContinuousBackups"
        ]
        Resource = [
          var.dynamodb_table_arn,
          "${var.dynamodb_table_arn}/stream/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket",
          "s3:PutObject"
        ]
        Resource = "*"
        # TODO: Scope to specific export bucket ARN
      },
      {
        Effect   = "Allow"
        Action   = "aoss:BatchGetCollection"
        Resource = "*"
        # TODO: Scope to specific OpenSearch collection ARN
      }
    ]
  })
}
