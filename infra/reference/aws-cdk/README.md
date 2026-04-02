# AWS CDK Reference Implementation

Reference CDK stacks that provision infrastructure for the IMS Gen 2 template.

## Prerequisites

- Node.js 20+
- AWS CDK CLI: `npm install -g aws-cdk`
- AWS credentials configured

## Stacks

| Stack | Resources | Outputs |
|-------|-----------|---------|
| `ImsAuthStack` | Cognito User Pool + App Client + User Groups | `VITE_AUTH_PROVIDER_URL`, `VITE_AUTH_CLIENT_ID` |
| `ImsApiStack` | AppSync GraphQL API + DynamoDB resolvers | `VITE_API_ENDPOINT`, `VITE_API_TYPE` |
| `ImsDataStack` | DynamoDB tables (DataTable + AuditLog) | Table ARNs |
| `ImsStorageStack` | S3 bucket for firmware/docs | `VITE_STORAGE_ENDPOINT` |

## Quick Start

```bash
cd infra/reference/aws-cdk
npm install
cdk bootstrap
cdk deploy --all
```

## Connecting to the Template

After deploy, CDK outputs the env vars the template needs:

```bash
# Copy outputs to .env
cdk deploy --all --outputs-file cdk-outputs.json
node -e "
  const o = require('./cdk-outputs.json');
  const auth = o.ImsAuthStack;
  const api = o.ImsApiStack;
  console.log('VITE_PLATFORM=aws-cdk');
  console.log('VITE_AUTH_PROVIDER_URL=' + auth.AuthProviderUrl);
  console.log('VITE_AUTH_CLIENT_ID=' + auth.AuthClientId);
  console.log('VITE_API_ENDPOINT=' + api.ApiEndpoint);
  console.log('VITE_API_TYPE=graphql');
" > ../../.env
```

See `Docs/integration-contract.md` for the full env var specification.
