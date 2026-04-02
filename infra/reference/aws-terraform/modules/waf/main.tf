# =============================================================================
# WAF v2 — WebACL with AWS Managed Rules + rate limiting
# Environment-specific: count mode (staging) or block mode (prod)
# =============================================================================

locals {
  # When waf_mode is "count", use count override (staging - logging only)
  # When waf_mode is "none", use none override (prod - blocking)
  managed_rules = [
    {
      name     = "AWSManagedRulesCommonRuleSet"
      priority = 1
      metric   = "common-rules"
    },
    {
      name     = "AWSManagedRulesKnownBadInputsRuleSet"
      priority = 2
      metric   = "bad-inputs"
    },
    {
      name     = "AWSManagedRulesSQLiRuleSet"
      priority = 3
      metric   = "sqli-rules"
    },
  ]
}

resource "aws_wafv2_web_acl" "main" {
  name        = "${var.project_name}-${var.environment}-waf"
  description = "WAF WebACL for ${var.project_name} ${var.environment}"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  dynamic "rule" {
    for_each = local.managed_rules
    content {
      name     = rule.value.name
      priority = rule.value.priority

      override_action {
        dynamic "count" {
          for_each = var.waf_mode == "count" ? [1] : []
          content {}
        }
        dynamic "none" {
          for_each = var.waf_mode == "none" ? [1] : []
          content {}
        }
      }

      statement {
        managed_rule_group_statement {
          name        = rule.value.name
          vendor_name = "AWS"
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "${var.project_name}-${var.environment}-${rule.value.metric}"
        sampled_requests_enabled   = true
      }
    }
  }

  # Rate limiting — 2000 requests per 5-minute window per IP
  rule {
    name     = "RateLimit"
    priority = 4

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-${var.environment}-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}-${var.environment}-waf"
    sampled_requests_enabled   = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-waf"
  }
}

# Associate WAF with the target resource (AppSync API)
resource "aws_wafv2_web_acl_association" "main" {
  resource_arn = var.resource_arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}
