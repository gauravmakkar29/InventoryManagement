output "bucket_name" {
  description = "Firmware S3 bucket name"
  value       = aws_s3_bucket.firmware.id
}

output "bucket_arn" {
  description = "Firmware S3 bucket ARN"
  value       = aws_s3_bucket.firmware.arn
}
