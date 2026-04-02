output "trail_arn" {
  description = "CloudTrail trail ARN"
  value       = aws_cloudtrail.main.arn
}

output "trail_name" {
  description = "CloudTrail trail name"
  value       = aws_cloudtrail.main.id
}

output "log_group_name" {
  description = "CloudWatch log group name for CloudTrail events"
  value       = aws_cloudwatch_log_group.cloudtrail.name
}

output "trail_bucket_name" {
  description = "S3 bucket name storing CloudTrail logs"
  value       = aws_s3_bucket.trail.id
}
