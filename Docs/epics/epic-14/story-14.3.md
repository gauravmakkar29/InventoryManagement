# Story 14.3: Network Topology Graph & Lateral Movement

**Epic:** Epic 14 — Incident Isolation & Lateral Movement
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 8

## User Story

As an Operations Manager, I want to see a network topology graph showing how devices are connected and which paths a threat could take to spread between devices, so that I can understand lateral movement risk and make informed containment decisions during incidents.

## Acceptance Criteria

- [x] AC1: When I open an incident and click "View Topology", a force-directed graph visualization appears showing the origin device and all related devices as nodes connected by edges
- [x] AC2: When I view the topology graph, nodes are color-coded by status (green=online, red=critical, gray=offline, orange=isolated) and sized by risk score (larger = higher risk)
- [x] AC3: When I hover over a node, a tooltip shows: device name, status, risk score, firmware version, and location
- [x] AC4: When I hover over an edge, it shows the relationship type (same location, same firmware, same customer, geographic proximity) and connection strength
- [x] AC5: When I click "Show Lateral Movement" for a specific device, the graph highlights the most likely lateral movement paths with animated red edges, and dims unaffected paths
- [x] AC6: When I view the lateral movement analysis, a side panel shows a ranked list of at-risk devices sorted by lateral movement probability (highest first) with: device name, probability percentage, and primary risk factor
- [ ] AC7: When the topology graph has more than 50 nodes, it automatically clusters nearby devices into expandable groups to maintain readability

## UI Behavior

- Topology graph renders in a full-width container below the incident detail header
- Graph supports pan (drag background) and zoom (scroll wheel) interactions
- Nodes are draggable for manual repositioning
- Legend panel in bottom-left shows: node colors by status, edge styles by relationship type
- Lateral movement panel slides in from the right (360px)
- Animated edges use a pulsing glow effect (subtle, 2-second cycle)
- Cluster nodes show a count badge and expand on click

## Out of Scope

- Real-time topology updates (refreshes on demand)
- Network packet-level analysis
- Topology based on actual network infrastructure (uses logical relationships)

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for TopologyGraph data structure, lateral movement calculation, and graph rendering approach.

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
