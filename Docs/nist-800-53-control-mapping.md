# IMS Gen 2 — NIST 800-53 Rev 5 Control Mapping

> **Date:** April 2026
> **Purpose:** Maps IMS Gen 2 infrastructure and application controls to NIST 800-53 security requirements.
> **Scope:** AWS deployment (Terraform reference implementation)

---

## Control Families Covered

| Family                             | ID  | Controls Mapped |
| ---------------------------------- | --- | --------------- |
| Access Control                     | AC  | 8               |
| Audit & Accountability             | AU  | 7               |
| Configuration Management           | CM  | 4               |
| Identification & Authentication    | IA  | 5               |
| Incident Response                  | IR  | 3               |
| System & Communications Protection | SC  | 6               |
| System & Information Integrity     | SI  | 4               |

---

## AC — Access Control

| Control | Name                        | Implementation                                                                                                                                                       | Status      |
| ------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| AC-2    | Account Management          | Cognito User Pool with user groups (Admin, Manager, Technician, Viewer, CustomerAdmin). Group assignment via admin API. Inactive users disabled via `isActive` flag. | Implemented |
| AC-3    | Access Enforcement          | RBAC enforced at route level (`rbac.ts`) and API level (AppSync resolvers check `cognito:groups` claim). Page-level access via `canAccessPage()`.                    | Implemented |
| AC-6    | Least Privilege             | Five-role hierarchy with granular page/action permissions. No role has unnecessary access. API resolvers enforce per-operation authorization.                        | Implemented |
| AC-7    | Unsuccessful Logon Attempts | Cognito lockout after configurable failed attempts. MFA required for admin roles.                                                                                    | Implemented |
| AC-8    | System Use Notification     | Sign-in page displays terms of use. Configurable banner text.                                                                                                        | Planned     |
| AC-11   | Session Lock                | Session timeout with warning dialog (`session-timeout-warning.tsx`). Auto-logout after configurable inactivity period.                                               | Implemented |
| AC-12   | Session Termination         | Explicit sign-out clears tokens. Refresh token expiry forces re-authentication. Session data cleared from localStorage.                                              | Implemented |
| AC-17   | Remote Access               | HTTPS-only access enforced via CloudFront + WAF. TLS 1.2 minimum on all endpoints.                                                                                   | Implemented |

## AU — Audit & Accountability

| Control | Name                                  | Implementation                                                                                                                        | Status      |
| ------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| AU-2    | Event Logging                         | DynamoDB Streams → Lambda audit processor captures all CREATE, MODIFY, DELETE events. Dedicated AuditLog table (#167).                | Implemented |
| AU-3    | Content of Audit Records              | Audit entries include: timestamp, action, resourceType, resourceId, userId, clientIP, before/after values.                            | Implemented |
| AU-4    | Audit Log Storage Capacity            | Dedicated AuditLog DynamoDB table with PAY_PER_REQUEST billing (auto-scales). CloudTrail logs to S3 with lifecycle policies.          | Implemented |
| AU-5    | Response to Audit Processing Failures | Lambda audit processor has DLQ for failed events. CloudWatch alarms on processing errors.                                             | Implemented |
| AU-6    | Audit Record Review                   | Analytics page with audit log table (Story 7.5). Filter by user, resource, date range. Export capability.                             | Implemented |
| AU-8    | Time Stamps                           | All audit records use ISO 8601 UTC timestamps. DynamoDB TTL for automatic rotation.                                                   | Implemented |
| AU-12   | Audit Record Generation               | CloudTrail captures all AWS API calls (management + S3 data events). Application-level audit via DynamoDB Streams. Combined coverage. | Implemented |

## CM — Configuration Management

| Control | Name                         | Implementation                                                                                       | Status      |
| ------- | ---------------------------- | ---------------------------------------------------------------------------------------------------- | ----------- |
| CM-2    | Baseline Configuration       | Infrastructure defined as code (Terraform/CDK). All config in version control. No manual changes.    | Implemented |
| CM-3    | Configuration Change Control | GitHub PRs required for all changes. CI validates build + tests + Terraform plan before merge.       | Implemented |
| CM-6    | Configuration Settings       | Environment-specific settings via `.tfvars` files (dev, staging, prod). No hardcoded secrets (#166). | Implemented |
| CM-8    | System Component Inventory   | Device inventory is the core application function. SBOM tracking for software components.            | Implemented |

## IA — Identification & Authentication

| Control | Name                                            | Implementation                                                                                                 | Status      |
| ------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------- |
| IA-2    | Identification & Authentication                 | Cognito User Pool with email/password + MFA. JWT tokens with `sub`, `email`, `cognito:groups` claims.          | Implemented |
| IA-2(1) | MFA to Privileged Accounts                      | TOTP-based MFA via Cognito. Required for Admin and Manager roles.                                              | Implemented |
| IA-4    | Identifier Management                           | Cognito-managed UUIDs (`sub` claim). Email uniqueness enforced.                                                | Implemented |
| IA-5    | Authenticator Management                        | Cognito password policies (min length, complexity). Refresh tokens rotated. Secrets in Secrets Manager (#166). | Implemented |
| IA-8    | Identification & Authentication (Non-Org Users) | Azure AD B2C / Cognito federated identity for external customer users (CustomerAdmin role).                    | Planned     |

## IR — Incident Response

| Control | Name                | Implementation                                                                                          | Status      |
| ------- | ------------------- | ------------------------------------------------------------------------------------------------------- | ----------- |
| IR-4    | Incident Handling   | Incident Response page with isolation, playbooks, and timeline (Epic 14). Device quarantine management. | Implemented |
| IR-5    | Incident Monitoring | CloudWatch alarms, Application Insights, structured logging. Real-time alerts via SNS.                  | Implemented |
| IR-6    | Incident Reporting  | Audit trail correlation. Export capabilities for compliance reporting.                                  | Implemented |

## SC — System & Communications Protection

| Control | Name                              | Implementation                                                                                                               | Status      |
| ------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------- |
| SC-7    | Boundary Protection               | WAF on CloudFront/AppSync. Rate limiting. IP-based rules configurable.                                                       | Implemented |
| SC-8    | Transmission Confidentiality      | TLS 1.2+ enforced on all endpoints (CloudFront, AppSync, S3). HTTPS-only.                                                    | Implemented |
| SC-12   | Cryptographic Key Management      | KMS keys for DynamoDB, S3, CloudTrail encryption. Key rotation enabled.                                                      | Implemented |
| SC-13   | Cryptographic Protection          | AES-256 encryption at rest (DynamoDB, S3). TLS in transit. JWT token signing via Cognito RSA keys.                           | Implemented |
| SC-28   | Protection of Information at Rest | Server-side encryption on all data stores: DynamoDB (KMS), S3 (KMS), OpenSearch (encryption at rest), CloudTrail logs (KMS). | Implemented |
| SC-39   | Process Isolation                 | Serverless architecture (Lambda, AppSync) provides inherent process isolation. No shared servers.                            | Implemented |

## SI — System & Information Integrity

| Control | Name                         | Implementation                                                                                                    | Status      |
| ------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------- |
| SI-2    | Flaw Remediation             | Vulnerability tracking panel (Epic 11). CVE monitoring via SBOM analysis. Firmware approval workflow for patches. | Implemented |
| SI-3    | Malicious Code Protection    | Input sanitization (`security.ts`). CSP headers via CloudFront. XSS protection. No user-uploaded code execution.  | Implemented |
| SI-4    | System Monitoring            | CloudWatch metrics, CloudTrail API logging, Application Insights APM. Anomaly detection via smart alerts.         | Implemented |
| SI-10   | Information Input Validation | Zod schemas for all form inputs. Server-side validation in AppSync resolvers. SQL/NoSQL injection prevention.     | Implemented |

---

## Infrastructure Controls Summary

| AWS Service        | Controls Addressed             | Module                                   |
| ------------------ | ------------------------------ | ---------------------------------------- |
| **Cognito**        | AC-2, AC-7, IA-2, IA-4, IA-5   | `modules/cognito`                        |
| **AppSync + WAF**  | AC-3, SC-7, SC-8               | `modules/appsync`, `modules/waf`         |
| **DynamoDB**       | AU-2, AU-3, AU-4, SC-12, SC-28 | `modules/dynamodb`                       |
| **Lambda (Audit)** | AU-2, AU-5                     | `modules/lambda-audit`                   |
| **CloudTrail**     | AU-12, SI-4                    | `modules/cloudtrail`                     |
| **S3**             | AU-4, SC-12, SC-28             | `modules/s3-firmware`                    |
| **CloudFront**     | AC-17, SC-7, SC-8, SI-3        | `modules/cloudfront`                     |
| **KMS**            | SC-12, SC-13                   | All modules (shared keys)                |
| **CloudWatch**     | AU-5, IR-5, SI-4               | `modules/monitoring`, `modules/alerting` |

---

## Gaps & Planned Controls

| Control | Name                            | Gap                         | Plan                                                   |
| ------- | ------------------------------- | --------------------------- | ------------------------------------------------------ |
| AC-8    | System Use Notification         | No login banner             | Add configurable banner to sign-in page                |
| IA-8    | Non-Org Authentication          | B2C federation not deployed | Deploy Cognito federated identity for customer tenants |
| SC-7(3) | Access Points                   | No VPC isolation            | Add VPC module for production (Story #168 planned)     |
| AU-9    | Protection of Audit Information | Audit logs not WORM         | Enable S3 Object Lock on audit export bucket           |
