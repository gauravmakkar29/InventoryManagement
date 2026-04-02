# AWS Amplify Gen2 Adapter

Provider adapters for IMS Gen 2 running on AWS Amplify Gen2 infrastructure.

## Overview

Amplify Gen2 deploys the same underlying AWS services as CDK/Terraform:

- **Auth:** Cognito User Pool
- **API:** AppSync GraphQL (or API Gateway REST)
- **Storage:** S3

These adapters communicate with those services using standard HTTP calls (no `@aws-amplify/*` SDK dependency). The difference from the CDK adapter is the deployment model, not the runtime API.

## Setup

### 1. Initialize Amplify Gen2

```bash
npx ampx sandbox
```

This generates `amplify_outputs.json` with your resource connection info.

### 2. Configure Environment Variables

Extract values from `amplify_outputs.json` and set them in your `.env` file:

```bash
# Required
VITE_PLATFORM=aws-amplify
VITE_AUTH_PROVIDER_URL=https://cognito-idp.<region>.amazonaws.com/<user-pool-id>
VITE_AUTH_CLIENT_ID=<user-pool-client-id>
VITE_API_ENDPOINT=https://<appsync-id>.appsync-api.<region>.amazonaws.com/graphql
VITE_AUTH_REGION=<region>

# Optional
VITE_API_TYPE=graphql
VITE_STORAGE_ENDPOINT=https://<api-id>.execute-api.<region>.amazonaws.com/storage
VITE_SEARCH_ENDPOINT=https://<opensearch-endpoint>
VITE_REALTIME_ENDPOINT=wss://<appsync-id>.appsync-realtime-api.<region>.amazonaws.com/graphql
```

### Mapping from `amplify_outputs.json`

| amplify_outputs.json path  | Env var                                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| `auth.user_pool_id`        | Build the `VITE_AUTH_PROVIDER_URL` (prefix with `https://cognito-idp.<region>.amazonaws.com/`) |
| `auth.user_pool_client_id` | `VITE_AUTH_CLIENT_ID`                                                                          |
| `auth.aws_region`          | `VITE_AUTH_REGION`                                                                             |
| `data.url`                 | `VITE_API_ENDPOINT`                                                                            |
| `storage.bucket_name`      | Used to configure `VITE_STORAGE_ENDPOINT` (via your API layer)                                 |

### 3. Start Development

```bash
npm run dev
```

## Architecture

```
aws-amplify/
  amplify-auth-adapter.ts    # Cognito auth via HTTP (same protocol as CDK)
  amplify-api-provider.ts    # AppSync/API Gateway via resilient HTTP client
  amplify-storage-provider.ts # localStorage + S3 presigned URL helpers
```

All adapters implement the provider interfaces defined in `../types.ts`:

- `IAuthAdapter` — sign in, sign out, MFA, session management
- `IApiProvider` — CRUD operations, search, telemetry
- `IStorageProvider` — client-side key-value persistence

## Extending

To connect additional GraphQL queries/mutations, edit `amplify-api-provider.ts`. The skeleton methods throw descriptive errors indicating which method needs implementation. Match the queries to your Amplify Gen2 AppSync schema.

## Differences from CDK Adapter

| Aspect           | CDK Adapter                 | Amplify Adapter                         |
| ---------------- | --------------------------- | --------------------------------------- |
| Deployment       | `cdk deploy`                | `ampx sandbox` / `ampx deploy`          |
| Config source    | Manual env vars             | `amplify_outputs.json`                  |
| Storage keys     | `ims-cdk-*`                 | `ims-amplify-*`                         |
| Runtime protocol | Cognito HTTP + AppSync HTTP | Cognito HTTP + AppSync HTTP (identical) |
