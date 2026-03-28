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
