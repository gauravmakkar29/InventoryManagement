# =============================================================================
# Lambda Audit Processor
# DynamoDB Stream trigger, CloudWatch log group
# =============================================================================

resource "aws_cloudwatch_log_group" "audit" {
  name              = "/aws/lambda/${var.project_name}-${var.environment}-audit-processor"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "${var.project_name}-${var.environment}-audit-log-group"
  }
}

# Audit stream processor Lambda function.
# Source code: src/lambda/audit-processor/index.mts
resource "aws_lambda_function" "audit_processor" {
  function_name = "${var.project_name}-${var.environment}-audit-processor"
  runtime       = "nodejs20.x"
  handler       = "index.handler"
  role          = var.lambda_role_arn
  timeout       = 30
  memory_size   = 256

  # TODO: Replace with actual deployment package
  filename         = "${path.module}/placeholder.zip"
  source_code_hash = filebase64sha256("${path.module}/placeholder.zip")

  environment {
    variables = {
      TABLE_NAME       = var.dynamodb_table_name
      AUDIT_TABLE_NAME = var.audit_table_name
      ENVIRONMENT      = var.environment
    }
  }

  depends_on = [aws_cloudwatch_log_group.audit]

  tags = {
    Name = "${var.project_name}-${var.environment}-audit-processor"
  }
}

# DynamoDB Stream -> Lambda event source mapping
resource "aws_lambda_event_source_mapping" "audit_stream" {
  event_source_arn       = var.dynamodb_stream_arn
  function_name          = aws_lambda_function.audit_processor.arn
  starting_position      = "TRIM_HORIZON"
  batch_size             = 25
  maximum_retry_attempts = 3

  # Process INSERT, MODIFY, and REMOVE events for full audit coverage (Story 8.1 AC1-3)
  filter_criteria {
    filter {
      pattern = jsonencode({
        eventName = ["INSERT", "MODIFY", "REMOVE"]
      })
    }
  }
}
