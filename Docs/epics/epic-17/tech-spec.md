# Epic 17: Platform Infrastructure (Terraform) — Technical Specification

**Epic:** Epic 17 — Platform Infrastructure (Terraform)
**Brief Reference:** Section 13 (Complete), Section 2 (Tech Stack), Section 4 (Database), Section 5 (Auth), Section 7 (S3), Section 8 (Lambda)
**Status:** Draft
**Dependencies:** None (independent, can start anytime)

---

## 1. Overview

This epic provisions ALL AWS infrastructure for the IMS Gen2 HLM Platform using Terraform. It covers 30 AWS resources organized into 13 Terraform modules, with environment-specific configurations for dev, staging, and production. This is the foundational infrastructure epic that all other epics depend on.

---

## 2. All 30 AWS Resources (Section 13.1)

| # | AWS Resource | Terraform Resource Type | Module | Notes |
|---|-------------|------------------------|--------|-------|
| 1 | DynamoDB Table (DataTable) | `aws_dynamodb_table` | `dynamodb` | Single-table, 4 GSIs, Streams, PITR, KMS |
| 2 | Cognito User Pool | `aws_cognito_user_pool` | `cognito` | Password policy, MFA, custom attributes |
| 3 | Cognito User Pool Client | `aws_cognito_user_pool_client` | `cognito` | Token expiry settings |
| 4 | 5x Cognito User Groups | `aws_cognito_user_group` x5 | `cognito` | Admin, Manager, Technician, Viewer, CustomerAdmin |
| 5 | AppSync GraphQL API | `aws_appsync_graphql_api` | `appsync` | Cognito auth, schema SDL |
| 6 | AppSync DynamoDB Data Source | `aws_appsync_datasource` | `appsync` | DynamoDB table connection |
| 7 | 11x AppSync JS Resolvers | `aws_appsync_resolver` x11 | `appsync` | JS runtime resolvers |
| 8 | S3 Firmware Bucket | `aws_s3_bucket` + policies | `s3-firmware` | WORM, KMS, Glacier lifecycle |
| 9 | S3 Frontend Bucket | `aws_s3_bucket` | `s3-frontend` | Static SPA hosting |
| 10 | CloudFront Distribution | `aws_cloudfront_distribution` | `cloudfront` | TLS via ACM, S3 origin |
| 11 | Lambda (Audit Processor) | `aws_lambda_function` | `lambda-audit` | Node.js 20.x, DynamoDB stream trigger |
| 12 | DynamoDB Stream to Lambda | `aws_lambda_event_source_mapping` | `lambda-audit` | Batch 25, retry 3, TRIM_HORIZON |
| 13 | IAM Roles & Policies | `aws_iam_role` + `aws_iam_policy` | `iam` | Least-privilege per service |
| 14 | WAF v2 WebACL | `aws_wafv2_web_acl` | `waf` | AWS Managed Rules + rate limiting |
| 15 | Route53 Hosted Zone | `aws_route53_zone` | `dns` | Custom domain |
| 16 | ACM Certificate | `aws_acm_certificate` | `dns` | TLS for CloudFront + AppSync |
| 17 | CloudWatch Dashboard | `aws_cloudwatch_dashboard` | `monitoring` | 4 service panels |
| 18 | SNS Topics + Subscriptions | `aws_sns_topic` | `alerting` | Threshold-based alerts |
| 19 | CloudWatch Alarms | `aws_cloudwatch_metric_alarm` | `alerting` | Error rate, throttling, latency |
| 20 | Budget Alerts | `aws_budgets_budget` | `alerting` | Monthly cost governance |
| 21 | Terraform State Backend | `aws_s3_bucket` + `aws_dynamodb_table` | Root (bootstrap) | Remote state + locking |
| 22 | OpenSearch Serverless Collection | `aws_opensearchserverless_collection` | `opensearch` | Search index |
| 23 | OpenSearch Encryption Policy | `aws_opensearchserverless_security_policy` | `opensearch` | Type: "encryption" |
| 24 | OpenSearch Network Policy | `aws_opensearchserverless_security_policy` | `opensearch` | Type: "network" |
| 25 | OpenSearch Data Access Policy | `aws_opensearchserverless_access_policy` | `opensearch` | IAM grants |
| 26 | OSIS Pipeline | `aws_osis_pipeline` | `opensearch` | DynamoDB Streams to OpenSearch |
| 27 | S3 Export Bucket | `aws_s3_bucket` | `opensearch` | Initial DynamoDB export |
| 28 | OSIS Pipeline IAM Role | `aws_iam_role` + `aws_iam_policy` | `opensearch` | DynamoDB + S3 + OpenSearch |
| 29 | AppSync HTTP DataSource (OpenSearch) | `aws_appsync_datasource` | `appsync` | IAM-signed HTTP, service: aoss |
| 30 | 4x AppSync Search Resolvers | `aws_appsync_resolver` x4 | `appsync` | searchGlobal, searchDevices, searchVulnerabilities, getAggregations |

---

## 3. Module Structure (Section 13.2)

```
infra/
├── main.tf                    # Root module — composes all child modules
├── variables.tf               # Global input variables (environment, region, domain, etc.)
├── outputs.tf                 # Output values (API endpoint, CloudFront URL, Cognito IDs)
├── providers.tf               # AWS provider config + version constraints (hashicorp/aws ~> 5.0)
├── backend.tf                 # S3 + DynamoDB state backend config
├── environments/
│   ├── dev.tfvars             # Dev environment overrides
│   ├── staging.tfvars         # Staging environment overrides
│   └── prod.tfvars            # Production environment overrides
└── modules/
    ├── dynamodb/
    │   ├── main.tf            # Table + 4 GSIs + Streams + PITR + KMS
    │   ├── variables.tf
    │   └── outputs.tf         # table_name, table_arn, stream_arn
    ├── cognito/
    │   ├── main.tf            # User Pool + Client + 5 Groups + MFA + password policy
    │   ├── variables.tf
    │   └── outputs.tf         # user_pool_id, user_pool_client_id, user_pool_arn
    ├── appsync/
    │   ├── main.tf            # GraphQL API + Schema + DynamoDB DataSource + HTTP DataSource
    │   ├── resolvers.tf       # 11 DynamoDB resolvers + 4 OpenSearch resolvers
    │   ├── schema.graphql     # Full GraphQL SDL schema
    │   ├── resolvers/         # JS resolver source files
    │   │   ├── getEntity.js
    │   │   ├── listByGSI1.js
    │   │   ├── queryByGSI2.js
    │   │   ├── queryByGSI3.js
    │   │   ├── queryByGSI4.js
    │   │   ├── queryByPK.js
    │   │   ├── createEntity.js
    │   │   ├── updateStatus.js
    │   │   ├── approveFirmware.js
    │   │   ├── advanceFirmwareStage.js
    │   │   ├── updateVulnerabilityStatus.js
    │   │   ├── searchGlobal.js
    │   │   ├── searchDevices.js
    │   │   ├── searchVulnerabilities.js
    │   │   └── getAggregations.js
    │   ├── variables.tf
    │   └── outputs.tf         # api_id, api_url, api_key
    ├── s3-firmware/
    │   ├── main.tf            # WORM bucket + KMS + versioning + lifecycle + policies
    │   ├── variables.tf
    │   └── outputs.tf         # bucket_name, bucket_arn
    ├── s3-frontend/
    │   ├── main.tf            # Static hosting bucket + OAI policy
    │   ├── variables.tf
    │   └── outputs.tf         # bucket_name, bucket_arn, website_endpoint
    ├── cloudfront/
    │   ├── main.tf            # Distribution + OAI + ACM cert reference + error pages
    │   ├── variables.tf
    │   └── outputs.tf         # distribution_id, domain_name
    ├── lambda-audit/
    │   ├── main.tf            # Function + event source mapping + log group
    │   ├── src/
    │   │   └── index.mjs      # Audit processor source code
    │   ├── variables.tf
    │   └── outputs.tf         # function_name, function_arn
    ├── iam/
    │   ├── main.tf            # All IAM roles + policies
    │   ├── variables.tf
    │   └── outputs.tf         # role ARNs for each service
    ├── waf/
    │   ├── main.tf            # WebACL + managed rules + rate limiting
    │   ├── variables.tf
    │   └── outputs.tf         # web_acl_arn
    ├── dns/
    │   ├── main.tf            # Route53 zone + ACM cert + validation records
    │   ├── variables.tf
    │   └── outputs.tf         # zone_id, certificate_arn, domain_name
    ├── opensearch/
    │   ├── main.tf            # Collection + policies + OSIS pipeline + export bucket
    │   ├── variables.tf
    │   └── outputs.tf         # collection_endpoint, pipeline_arn
    ├── monitoring/
    │   ├── main.tf            # CloudWatch dashboard with 4 service panels
    │   ├── variables.tf
    │   └── outputs.tf         # dashboard_arn
    └── alerting/
        ├── main.tf            # SNS topics + CloudWatch alarms + budget alerts
        ├── variables.tf
        └── outputs.tf         # topic_arns, alarm_arns
```

---

## 4. Environment Strategy (Section 13.3)

### 4.1 Per-Environment Configuration

| Aspect | Dev (`dev.tfvars`) | Staging (`staging.tfvars`) | Prod (`prod.tfvars`) |
|--------|-------------------|--------------------------|---------------------|
| Terraform state bucket | `ims-tfstate-dev` | `ims-tfstate-staging` | `ims-tfstate-prod` |
| DynamoDB PITR | `false` | `true` | `true` |
| Cognito MFA | `"OPTIONAL"` | `"OPTIONAL"` | `"REQUIRED"` |
| Token expiry (access) | `60` min | `15` min | `15` min |
| WAF enabled | `false` | `true` (count mode) | `true` (block mode) |
| WAF default action | N/A | `"count"` | `"block"` |
| CloudFront custom domain | `false` | `true` (staging subdomain) | `true` (prod domain) |
| OpenSearch type | `"managed"` (t3.small) | `"managed"` (t3.medium) | `"serverless"` |
| Lambda log retention | `7` days | `30` days | `90` days |
| S3 firmware object lock | `false` | `true` (governance) | `true` (compliance) |
| Budget alert threshold | `$50` | `$200` | `$1000` |
| Deploy trigger | PR merge to `dev` | PR merge to `staging` | Tag push `v*` to `main` |

### 4.2 Terraform Variables

```hcl
# variables.tf (root)
variable "environment" {
  type        = string
  description = "Environment name: dev, staging, prod"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "aws_region" {
  type    = string
  default = "ap-southeast-2"
}

variable "domain_name" {
  type        = string
  description = "Custom domain (e.g., ims.example.com)"
  default     = ""
}

variable "enable_waf" {
  type    = bool
  default = false
}

variable "waf_default_action" {
  type    = string
  default = "count"
}

variable "enable_pitr" {
  type    = bool
  default = false
}

variable "cognito_mfa" {
  type    = string
  default = "OPTIONAL"
}

variable "access_token_expiry_minutes" {
  type    = number
  default = 60
}

variable "opensearch_type" {
  type    = string
  default = "managed"
  validation {
    condition     = contains(["managed", "serverless"], var.opensearch_type)
    error_message = "OpenSearch type must be managed or serverless."
  }
}

variable "lambda_log_retention_days" {
  type    = number
  default = 7
}

variable "budget_limit_usd" {
  type    = number
  default = 50
}

variable "s3_firmware_object_lock" {
  type    = bool
  default = false
}

variable "alert_email" {
  type        = string
  description = "Email for SNS alert subscriptions"
}
```

---

## 5. CI/CD Pipeline (Section 13.4)

### 5.1 GitHub Actions Workflows

#### PR Pipeline (`.github/workflows/ci.yml`)

```yaml
name: CI Pipeline
on:
  pull_request:
    branches: [dev, staging, main]

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - run: terraform fmt -check -recursive
      - run: terraform init -backend-config="environments/${{ env.ENV }}.backend.hcl"
      - run: terraform validate
      - run: terraform plan -var-file="environments/${{ env.ENV }}.tfvars" -out=plan.tfplan
      - uses: actions/github-script@v7  # Comment plan on PR

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --coverage
      - run: npm run compliance:validate
```

#### Deploy Pipeline (`.github/workflows/deploy.yml`)

```yaml
name: Deploy
on:
  push:
    branches: [dev, staging]
  release:
    types: [published]  # tag push v*

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: terraform apply -auto-approve -var-file="environments/${{ env.ENV }}.tfvars"
      - run: npm run build
      - run: aws s3 sync dist/ s3://${{ env.FRONTEND_BUCKET }}
      - run: aws cloudfront create-invalidation --distribution-id ${{ env.CF_DIST_ID }} --paths "/*"
```

---

## 6. IAM Roles (Least-Privilege)

| Role | Service | Permissions |
|------|---------|-------------|
| `ims-appsync-role` | AppSync | DynamoDB: GetItem, PutItem, UpdateItem, DeleteItem, Query, Scan on DataTable + GSIs |
| `ims-appsync-opensearch-role` | AppSync HTTP | aoss:APIAccessAll on OpenSearch collection |
| `ims-lambda-audit-role` | Lambda | DynamoDB Streams: GetRecords, GetShardIterator, DescribeStream; DynamoDB: PutItem (write audit); CloudWatch Logs: CreateLogGroup, CreateLogStream, PutLogEvents |
| `ims-osis-pipeline-role` | OSIS | DynamoDB: DescribeTable, DescribeExport, ExportTableToPointInTime, GetRecords, GetShardIterator; S3: GetObject, PutObject on export bucket; aoss:BatchGetCollection, aoss:APIAccessAll |
| `ims-cloudfront-oai` | CloudFront | S3: GetObject on frontend bucket |

---

## 7. CloudWatch Dashboard Panels

4 service panels in a single CloudWatch dashboard:

### Panel 1: DynamoDB
- ConsumedReadCapacityUnits, ConsumedWriteCapacityUnits
- ThrottledRequests (read + write)
- SystemErrors
- SuccessfulRequestLatency (p50, p99)

### Panel 2: Lambda (Audit Processor)
- Invocations, Errors, Throttles
- Duration (p50, p95, p99)
- ConcurrentExecutions
- IteratorAge (stream lag)

### Panel 3: AppSync
- 4XXError, 5XXError
- Latency (p50, p95)
- ConnectSuccess (subscriptions)

### Panel 4: Cognito
- SignInSuccesses, SignInThrottles
- TokenRefreshSuccesses

---

## 8. WAF v2 Rules

| Rule | Type | Action |
|------|------|--------|
| AWS-AWSManagedRulesCommonRuleSet | Managed | Block (prod) / Count (staging) |
| AWS-AWSManagedRulesKnownBadInputsRuleSet | Managed | Block / Count |
| AWS-AWSManagedRulesSQLiRuleSet | Managed | Block / Count |
| RateLimitRule | Rate-based | Block after 2,000 requests / 5 min per IP |

---

## 9. SNS Alert Definitions

| Alarm | Metric | Threshold | Period |
|-------|--------|-----------|--------|
| DynamoDB Throttle | ThrottledRequests | > 0 | 5 min |
| Lambda Errors | Errors | > 5 | 5 min |
| Lambda Duration | Duration p99 | > 10,000 ms | 5 min |
| AppSync 5XX | 5XXError | > 10 | 5 min |
| AppSync Latency | Latency p95 | > 1,000 ms | 5 min |
| Budget Exceeded | EstimatedCharges | > budget_limit_usd | Monthly |
