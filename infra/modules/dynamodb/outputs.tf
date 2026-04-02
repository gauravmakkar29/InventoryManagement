output "table_name" {
  description = "DynamoDB DataTable name"
  value       = aws_dynamodb_table.data_table.name
}

output "table_arn" {
  description = "DynamoDB DataTable ARN"
  value       = aws_dynamodb_table.data_table.arn
}

output "stream_arn" {
  description = "DynamoDB Streams ARN for DataTable"
  value       = aws_dynamodb_table.data_table.stream_arn
}

output "audit_table_name" {
  description = "DynamoDB AuditLog table name"
  value       = aws_dynamodb_table.audit_table.name
}

output "audit_table_arn" {
  description = "DynamoDB AuditLog table ARN"
  value       = aws_dynamodb_table.audit_table.arn
}
