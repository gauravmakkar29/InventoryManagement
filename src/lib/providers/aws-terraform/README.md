# AWS Terraform Adapter Package

Connects the IMS Gen 2 frontend to AWS services provisioned by Terraform. Since Terraform and CDK both deploy the same AWS services (Cognito, AppSync, S3), these adapters follow the same patterns as the CDK adapters.

## Architecture

```
platform.config.ts (VITE_PLATFORM=aws-terraform)
├── terraform-auth-adapter.ts    → Cognito User Pool (USER_PASSWORD_AUTH via HTTP)
├── terraform-api-provider.ts    → AppSync GraphQL / API Gateway REST
└── terraform-storage-provider.ts → localStorage + S3 endpoint config
```

## Configuration

Set these environment variables from your Terraform outputs. Add them to `.env` or your deployment configuration.

### Required

| Variable                 | Source (Terraform output)                  | Description                                   |
| ------------------------ | ------------------------------------------ | --------------------------------------------- |
| `VITE_PLATFORM`          | Set to `aws-terraform`                     | Activates this adapter package                |
| `VITE_AUTH_PROVIDER_URL` | `cognito_issuer_url`                       | Cognito User Pool issuer URL                  |
| `VITE_AUTH_CLIENT_ID`    | `cognito_client_id`                        | Cognito app client ID (public SPA, no secret) |
| `VITE_API_ENDPOINT`      | `appsync_graphql_url` or `api_gateway_url` | Backend API URL                               |

### Optional

| Variable                 | Source (Terraform output)   | Description                            |
| ------------------------ | --------------------------- | -------------------------------------- |
| `VITE_AUTH_REGION`       | `aws_region`                | AWS region (default: `ap-southeast-2`) |
| `VITE_API_TYPE`          | —                           | `graphql` (default) or `rest`          |
| `VITE_STORAGE_ENDPOINT`  | `s3_presigned_url_endpoint` | S3 endpoint for file uploads           |
| `VITE_SEARCH_ENDPOINT`   | `opensearch_endpoint`       | OpenSearch for full-text/geo search    |
| `VITE_REALTIME_ENDPOINT` | `appsync_realtime_url`      | Real-time device status WebSocket      |

### Example `.env`

```bash
VITE_PLATFORM=aws-terraform
VITE_AUTH_PROVIDER_URL=https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_XXXXXXXXX
VITE_AUTH_CLIENT_ID=1abc2defgh3ijklmnop4qrst5u
VITE_AUTH_REGION=ap-southeast-2
VITE_API_ENDPOINT=https://xxxxxxxxxx.appsync-api.ap-southeast-2.amazonaws.com/graphql
VITE_API_TYPE=graphql
VITE_STORAGE_ENDPOINT=https://ims-uploads.s3.ap-southeast-2.amazonaws.com
```

## Migration from Hardcoded Config

If your project previously hardcoded AWS resource IDs directly in the frontend:

1. **Remove hardcoded values** from source code (User Pool IDs, API URLs, etc.)
2. **Add Terraform outputs** for each required value in your `.tf` files:

   ```hcl
   output "cognito_issuer_url" {
     value = "https://cognito-idp.${var.region}.amazonaws.com/${aws_cognito_user_pool.main.id}"
   }

   output "cognito_client_id" {
     value = aws_cognito_user_pool_client.spa.id
   }

   output "appsync_graphql_url" {
     value = aws_appsync_graphql_api.main.uris["GRAPHQL"]
   }
   ```

3. **Populate `.env`** from Terraform outputs (manually or via CI/CD):
   ```bash
   terraform output -json | jq -r '
     "VITE_PLATFORM=aws-terraform",
     "VITE_AUTH_PROVIDER_URL=\(.cognito_issuer_url.value)",
     "VITE_AUTH_CLIENT_ID=\(.cognito_client_id.value)",
     "VITE_API_ENDPOINT=\(.appsync_graphql_url.value)"
   ' > .env
   ```
4. **Set `VITE_PLATFORM=aws-terraform`** to activate the adapter package

## How It Works

- **Auth:** Calls the Cognito Identity Provider HTTP API directly (no AWS SDK). Supports `USER_PASSWORD_AUTH`, `REFRESH_TOKEN_AUTH`, and MFA challenge flows.
- **API:** Uses the resilient `api-client.ts` to call AppSync GraphQL or REST endpoints with JWT bearer token auth.
- **Storage:** Key-value persistence uses browser `localStorage`. File uploads (firmware, compliance docs) route through the API provider's mutation methods.

## Reference Infrastructure

The Terraform modules that provision these AWS resources are in:

```
infra/reference/aws-terraform/
├── modules/cognito/       → User Pool + App Client
├── modules/appsync/       → GraphQL API
├── modules/s3/            → Storage buckets
└── environments/          → Per-environment tfvars
```
