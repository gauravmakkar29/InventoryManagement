# =============================================================================
# Monitoring — CloudWatch Dashboard with 4 service panels
# DynamoDB, Lambda, AppSync, Cognito metrics
# =============================================================================

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-${var.environment}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      # --- DynamoDB Panel ---
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "DynamoDB - DataTable"
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "${var.project_name}-${var.environment}-DataTable"],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", "${var.project_name}-${var.environment}-DataTable"],
            ["AWS/DynamoDB", "ThrottledRequests", "TableName", "${var.project_name}-${var.environment}-DataTable"],
            ["AWS/DynamoDB", "SystemErrors", "TableName", "${var.project_name}-${var.environment}-DataTable"]
          ]
          period = 300
          region = data.aws_region.current.name
        }
      },
      # --- Lambda Panel ---
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "Lambda - Audit Processor"
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", "${var.project_name}-${var.environment}-audit-processor"],
            ["AWS/Lambda", "Errors", "FunctionName", "${var.project_name}-${var.environment}-audit-processor"],
            ["AWS/Lambda", "Duration", "FunctionName", "${var.project_name}-${var.environment}-audit-processor"],
            ["AWS/Lambda", "Throttles", "FunctionName", "${var.project_name}-${var.environment}-audit-processor"]
          ]
          period = 300
          region = data.aws_region.current.name
        }
      },
      # --- AppSync Panel ---
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title   = "AppSync - GraphQL API"
          metrics = [
            ["AWS/AppSync", "4XXError", "GraphQLAPIId", "${var.project_name}-${var.environment}-api"],
            ["AWS/AppSync", "5XXError", "GraphQLAPIId", "${var.project_name}-${var.environment}-api"],
            ["AWS/AppSync", "Latency", "GraphQLAPIId", "${var.project_name}-${var.environment}-api"]
          ]
          period = 300
          region = data.aws_region.current.name
        }
      },
      # --- Cognito Panel ---
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          title   = "Cognito - User Pool"
          metrics = [
            ["AWS/Cognito", "SignInSuccesses", "UserPool", "${var.project_name}-${var.environment}-user-pool"],
            ["AWS/Cognito", "TokenRefreshSuccesses", "UserPool", "${var.project_name}-${var.environment}-user-pool"],
            ["AWS/Cognito", "SignUpSuccesses", "UserPool", "${var.project_name}-${var.environment}-user-pool"]
          ]
          period = 300
          region = data.aws_region.current.name
        }
      }
    ]
  })
}

data "aws_region" "current" {}
