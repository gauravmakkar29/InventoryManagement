import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { VersionTimeline, type TimelineEvent } from "@/app/components/shared/version-timeline";

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const MOCK_EVENTS: TimelineEvent[] = [
  {
    id: "evt-1",
    type: "UPLOADED",
    label: "UPLOADED",
    actor: "eng.chen@example.com",
    timestamp: "2025-08-10T09:00:00Z",
    description: "Initial firmware upload",
    color: "blue",
  },
  {
    id: "evt-2",
    type: "APPROVED",
    label: "APPROVED",
    actor: "mgr.smith@example.com",
    timestamp: "2025-08-15T14:00:00Z",
    description: "Passed compliance review",
    color: "green",
    metadata: { reviewId: "GP-2025-1842", score: "94" },
  },
  {
    id: "evt-3",
    type: "REJECTED",
    label: "REJECTED",
    actor: "compliance@guidepoint.com",
    timestamp: "2025-08-20T10:00:00Z",
    description: "Failed security scan",
    color: "red",
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("VersionTimeline", () => {
  it("renders all timeline events", () => {
    render(<VersionTimeline events={MOCK_EVENTS} />);

    expect(screen.getByText("Initial firmware upload")).toBeInTheDocument();
    expect(screen.getByText("Passed compliance review")).toBeInTheDocument();
    expect(screen.getByText("Failed security scan")).toBeInTheDocument();
  });

  it("renders event type labels", () => {
    render(<VersionTimeline events={MOCK_EVENTS} />);

    // Type appears both as badge label and type text, so use getAllByText
    expect(screen.getAllByText("UPLOADED")).toHaveLength(2);
    expect(screen.getAllByText("APPROVED")).toHaveLength(2);
    expect(screen.getAllByText("REJECTED")).toHaveLength(2);
  });

  it("renders actor names", () => {
    render(<VersionTimeline events={MOCK_EVENTS} />);

    expect(screen.getByText("eng.chen@example.com")).toBeInTheDocument();
    expect(screen.getByText("mgr.smith@example.com")).toBeInTheDocument();
  });

  it("renders metadata badges when present", () => {
    render(<VersionTimeline events={MOCK_EVENTS} />);

    expect(screen.getByText(/reviewId:/)).toBeInTheDocument();
    expect(screen.getByText(/GP-2025-1842/)).toBeInTheDocument();
    expect(screen.getByText(/score:/)).toBeInTheDocument();
    expect(screen.getByText(/94/)).toBeInTheDocument();
  });

  it("shows empty state when no events", () => {
    render(<VersionTimeline events={[]} />);

    expect(screen.getByText("No events")).toBeInTheDocument();
    expect(screen.getByText("No timeline events have been recorded yet.")).toBeInTheDocument();
  });

  it("shows custom empty message", () => {
    render(
      <VersionTimeline
        events={[]}
        emptyMessage="No deployments"
        emptyDescription="Nothing deployed yet."
      />,
    );

    expect(screen.getByText("No deployments")).toBeInTheDocument();
    expect(screen.getByText("Nothing deployed yet.")).toBeInTheDocument();
  });

  it("shows skeleton loading state", () => {
    render(<VersionTimeline events={[]} loading />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByLabelText("Loading timeline")).toBeInTheDocument();
  });

  it("has correct ARIA structure", () => {
    render(<VersionTimeline events={MOCK_EVENTS} />);

    const list = screen.getByRole("list");
    expect(list).toHaveAttribute("aria-label", "Version timeline");

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
  });

  it("renders time elements with dateTime attribute", () => {
    render(<VersionTimeline events={MOCK_EVENTS} />);

    const times = document.querySelectorAll("time");
    expect(times).toHaveLength(3);
    expect(times[0]).toHaveAttribute("dateTime", "2025-08-10T09:00:00Z");
  });
});
