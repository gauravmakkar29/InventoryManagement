output "function_name" {
  description = "Lambda audit processor function name"
  value       = aws_lambda_function.audit_processor.function_name
}

output "function_arn" {
  description = "Lambda audit processor function ARN"
  value       = aws_lambda_function.audit_processor.arn
}
