output "sns_topic_arn" {
  description = "SNS topic ARN for alert notifications"
  value       = aws_sns_topic.alerts.arn
}

output "alarm_arns" {
  description = "List of CloudWatch alarm ARNs"
  value = [
    aws_cloudwatch_metric_alarm.dynamodb_throttles.arn,
    aws_cloudwatch_metric_alarm.lambda_errors.arn,
    aws_cloudwatch_metric_alarm.lambda_duration.arn,
    aws_cloudwatch_metric_alarm.appsync_5xx.arn,
    aws_cloudwatch_metric_alarm.appsync_latency.arn,
  ]
}
