# =============================================================================
# Alerting — SNS topics + CloudWatch alarms + budget alerts
# Error rate, throttling, latency thresholds
# =============================================================================

data "aws_region" "current" {}

# --- SNS Topic for alerts ---

resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-${var.environment}-alerts"

  tags = {
    Name = "${var.project_name}-${var.environment}-alerts"
  }
}

# --- CloudWatch Alarms ---

# Lambda error rate alarm
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project_name}-${var.environment}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Lambda audit processor error rate exceeded threshold"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = "${var.project_name}-${var.environment}-audit-processor"
  }
}

# DynamoDB throttling alarm
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  alarm_name          = "${var.project_name}-${var.environment}-dynamodb-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ThrottledRequests"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "DynamoDB throttled requests exceeded threshold"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    TableName = "${var.project_name}-${var.environment}-DataTable"
  }
}

# AppSync latency alarm
resource "aws_cloudwatch_metric_alarm" "appsync_latency" {
  alarm_name          = "${var.project_name}-${var.environment}-appsync-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "Latency"
  namespace           = "AWS/AppSync"
  period              = 300
  statistic           = "Average"
  threshold           = 1000
  alarm_description   = "AppSync average latency exceeded 1000ms"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    GraphQLAPIId = "${var.project_name}-${var.environment}-api"
  }
}

# AppSync 5XX error alarm
resource "aws_cloudwatch_metric_alarm" "appsync_5xx" {
  alarm_name          = "${var.project_name}-${var.environment}-appsync-5xx"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "5XXError"
  namespace           = "AWS/AppSync"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "AppSync 5XX errors detected"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    GraphQLAPIId = "${var.project_name}-${var.environment}-api"
  }
}

# --- Budget Alert ---

resource "aws_budgets_budget" "monthly" {
  name         = "${var.project_name}-${var.environment}-monthly-budget"
  budget_type  = "COST"
  limit_amount = tostring(var.budget_limit)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_sns_topic_arns  = [aws_sns_topic.alerts.arn]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_sns_topic_arns  = [aws_sns_topic.alerts.arn]
  }
}
