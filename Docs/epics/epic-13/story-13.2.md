# Story 13.2: Telemetry Ingestion Pipeline

**Epic:** Epic 13 — Environmental Heatmaps & Blast Radius
**Persona:** Sarah (Platform Admin)
**Priority:** High
**Story Points:** 5

## User Story

As a Platform Admin, I want device telemetry to be automatically ingested and stored, so that the platform has continuous health data for heatmaps, blast radius calculations, and trend analysis.

## Acceptance Criteria

- [x] AC1: When a device sends telemetry data (via API mutation), the data is persisted and visible within 5 seconds on the device telemetry view
- [x] AC2: When telemetry is ingested, a risk score (0-100) is automatically computed and stored alongside the raw metrics
- [x] AC3: When I view the telemetry pipeline status indicator in the admin panel, I can see whether ingestion is healthy (green), degraded (amber), or failed (red)
- [x] AC4: When telemetry records are older than 30 days, they are automatically cleaned up (TTL expiry) without manual intervention
- [x] AC5: When invalid telemetry data is submitted (e.g., negative temperature, CPU > 100), the API returns a validation error with a descriptive message

## UI Behavior

- A "Telemetry Pipeline" status card appears on the admin dashboard showing: records ingested (last hour), pipeline health status, last successful ingestion timestamp
- Status indicator uses traffic light colors: green (healthy, data flowing), amber (delayed > 5 min), red (no data > 15 min)
- The status card is only visible to Admin and Manager roles

## Out of Scope

- Device-side telemetry agent or SDK
- Real-time streaming (WebSocket push of telemetry) — uses polling for now
- Telemetry alerting rules

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for Telemetry entity schema, `ingestTelemetry` mutation, and risk score computation formula.

## Definition of Done

- [x] Code reviewed and approved
- [x] Unit tests passing (>=85% coverage on new code)
- [x] E2E tests passing
- [x] Compliance check green
