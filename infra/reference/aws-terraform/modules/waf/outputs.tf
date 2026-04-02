output "web_acl_arn" {
  description = "WAF v2 WebACL ARN"
  value       = aws_wafv2_web_acl.main.arn
}
