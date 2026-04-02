output "endpoint" {
  description = "OpenSearch collection/domain endpoint"
  value = var.opensearch_type == "serverless" ? (
    length(aws_opensearchserverless_collection.main) > 0 ? aws_opensearchserverless_collection.main[0].collection_endpoint : ""
    ) : (
    length(aws_opensearch_domain.managed) > 0 ? "https://${aws_opensearch_domain.managed[0].endpoint}" : ""
  )
}

output "collection_arn" {
  description = "OpenSearch resource ARN"
  value = var.opensearch_type == "serverless" ? (
    length(aws_opensearchserverless_collection.main) > 0 ? aws_opensearchserverless_collection.main[0].arn : ""
    ) : (
    length(aws_opensearch_domain.managed) > 0 ? aws_opensearch_domain.managed[0].arn : ""
  )
}

output "export_bucket_name" {
  description = "S3 export bucket name for DynamoDB initial load"
  value       = aws_s3_bucket.export.id
}

output "export_bucket_arn" {
  description = "S3 export bucket ARN"
  value       = aws_s3_bucket.export.arn
}

output "pipeline_arn" {
  description = "OSIS pipeline ARN"
  value       = aws_osis_pipeline.dynamodb_to_opensearch.pipeline_arn
}

output "pipeline_name" {
  description = "OSIS pipeline name for status monitoring"
  value       = aws_osis_pipeline.dynamodb_to_opensearch.pipeline_name
}

output "index_name" {
  description = "OpenSearch index name used by the pipeline"
  value       = "ims-entities"
}

output "master_secret_arn" {
  description = "Secrets Manager ARN for OpenSearch master password"
  value       = length(aws_secretsmanager_secret.opensearch_master) > 0 ? aws_secretsmanager_secret.opensearch_master[0].arn : ""
}
