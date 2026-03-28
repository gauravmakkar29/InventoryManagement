output "appsync_role_arn" {
  description = "IAM role ARN for AppSync service"
  value       = aws_iam_role.appsync.arn
}

output "lambda_role_arn" {
  description = "IAM role ARN for Lambda audit processor"
  value       = aws_iam_role.lambda_audit.arn
}

output "osis_role_arn" {
  description = "IAM role ARN for OSIS pipeline"
  value       = aws_iam_role.osis_pipeline.arn
}
