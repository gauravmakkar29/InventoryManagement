# Story 17.6: CloudWatch Monitoring, SNS Alerting & Budget Alarms

**Epic:** Epic 17 — Platform Infrastructure (Terraform)
**Persona:** Platform Engineer (DevOps)
**Priority:** Medium
**Story Points:** 5

## User Story
As a Platform Engineer, I want to provision CloudWatch dashboards with service metrics, SNS-based alerting for error thresholds, and budget alarms for cost governance via Terraform, so that the team is automatically notified of operational issues and cost overruns.

## Acceptance Criteria
- [ ] AC1: When I apply the `monitoring` module, a CloudWatch dashboard is created with 4 panels: DynamoDB metrics, Lambda metrics, AppSync metrics, and Cognito metrics
- [ ] AC2: When I view the CloudWatch dashboard in the AWS console, I see real-time graphs for: DynamoDB read/write capacity + throttles, Lambda invocations + errors + duration, AppSync 4XX/5XX errors + latency, and Cognito sign-in successes + throttles
- [ ] AC3: When I apply the `alerting` module, SNS topics are created with email subscriptions (using the `alert_email` variable) for operational alerts
- [ ] AC4: When DynamoDB throttling occurs, a CloudWatch alarm triggers and sends an email notification via SNS within 5 minutes
- [ ] AC5: When Lambda errors exceed 5 in a 5-minute period, an alarm triggers and notifies the team
- [ ] AC6: When AppSync 5XX errors exceed 10 in a 5-minute period, or p95 latency exceeds 1,000ms, an alarm triggers
- [ ] AC7: When I apply the `alerting` module, a budget alarm is created with the environment-specific threshold ($50 dev / $200 staging / $1,000 prod) that notifies when estimated charges exceed the budget
- [ ] AC8: When I add a new alarm, I only need to define the metric name and threshold — the module handles SNS integration automatically

## UI Behavior
- N/A (infrastructure-only story — monitoring is viewed in AWS Console)

## Out of Scope
- Custom application-level metrics (only AWS service metrics)
- PagerDuty or OpsGenie integration
- Log-based alerting (CloudWatch Logs Insights queries)

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for CloudWatch dashboard panels, SNS alert definitions, and budget thresholds.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
