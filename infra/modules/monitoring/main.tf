# =============================================================================
# Monitoring — CloudWatch Dashboard with 4 service panels
# DynamoDB, Lambda, AppSync, Cognito metrics
# =============================================================================

data "aws_region" "current" {}

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
          title  = "DynamoDB - DataTable"
          region = data.aws_region.current.name
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", var.dynamodb_table_name, { stat = "Sum" }],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", var.dynamodb_table_name, { stat = "Sum" }],
            ["AWS/DynamoDB", "ThrottledRequests", "TableName", var.dynamodb_table_name, { stat = "Sum" }],
            ["AWS/DynamoDB", "SystemErrors", "TableName", var.dynamodb_table_name, { stat = "Sum" }],
            ["AWS/DynamoDB", "SuccessfulRequestLatency", "TableName", var.dynamodb_table_name, { stat = "p50" }],
            ["AWS/DynamoDB", "SuccessfulRequestLatency", "TableName", var.dynamodb_table_name, { stat = "p99" }]
          ]
          period = 300
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
          title  = "Lambda - Audit Processor"
          region = data.aws_region.current.name
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", var.lambda_function_name, { stat = "Sum" }],
            ["AWS/Lambda", "Errors", "FunctionName", var.lambda_function_name, { stat = "Sum" }],
            ["AWS/Lambda", "Throttles", "FunctionName", var.lambda_function_name, { stat = "Sum" }],
            ["AWS/Lambda", "Duration", "FunctionName", var.lambda_function_name, { stat = "p50" }],
            ["AWS/Lambda", "Duration", "FunctionName", var.lambda_function_name, { stat = "p95" }],
            ["AWS/Lambda", "Duration", "FunctionName", var.lambda_function_name, { stat = "p99" }],
            ["AWS/Lambda", "ConcurrentExecutions", "FunctionName", var.lambda_function_name, { stat = "Maximum" }],
            ["AWS/Lambda", "IteratorAge", "FunctionName", var.lambda_function_name, { stat = "Maximum" }]
          ]
          period = 300
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
          title  = "AppSync - GraphQL API"
          region = data.aws_region.current.name
          metrics = [
            ["AWS/AppSync", "4XXError", "GraphQLAPIId", var.appsync_api_id, { stat = "Sum" }],
            ["AWS/AppSync", "5XXError", "GraphQLAPIId", var.appsync_api_id, { stat = "Sum" }],
            ["AWS/AppSync", "Latency", "GraphQLAPIId", var.appsync_api_id, { stat = "p50" }],
            ["AWS/AppSync", "Latency", "GraphQLAPIId", var.appsync_api_id, { stat = "p95" }],
            ["AWS/AppSync", "ConnectSuccess", "GraphQLAPIId", var.appsync_api_id, { stat = "Sum" }]
          ]
          period = 300
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
          title  = "Cognito - User Pool"
          region = data.aws_region.current.name
          metrics = [
            ["AWS/Cognito", "SignInSuccesses", "UserPool", "${var.project_name}-${var.environment}-user-pool", { stat = "Sum" }],
            ["AWS/Cognito", "SignInThrottles", "UserPool", "${var.project_name}-${var.environment}-user-pool", { stat = "Sum" }],
            ["AWS/Cognito", "TokenRefreshSuccesses", "UserPool", "${var.project_name}-${var.environment}-user-pool", { stat = "Sum" }]
          ]
          period = 300
        }
      }
    ]
  })
}
