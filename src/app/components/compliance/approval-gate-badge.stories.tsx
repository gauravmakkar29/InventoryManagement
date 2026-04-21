import type { Meta, StoryObj } from "@storybook/react";
import { ApprovalGateBadge } from "./approval-gate-badge";
import type { Approval } from "@/lib/compliance/approval";

const BASE: Omit<Approval, "state" | "reviewer" | "reason" | "decidedAt"> = {
  id: "a-1",
  subjectId: "subj-1",
  submittedBy: { userId: "alice", displayName: "Alice" },
  conditions: [],
  history: [],
};
const BOB = { userId: "bob", displayName: "Bob Reviewer" };

function mk(
  state: Approval["state"],
  reviewer: Approval["reviewer"] = null,
  reason: string | null = null,
): Approval {
  return {
    ...BASE,
    state,
    reviewer,
    reason,
    decidedAt: reviewer ? "2026-04-21T10:00:00Z" : null,
  };
}

const meta: Meta<typeof ApprovalGateBadge> = {
  title: "Compliance/ApprovalGateBadge",
  component: ApprovalGateBadge,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Compact 22px pill showing approval state. Hover reveals reviewer, decision time, and reason.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ApprovalGateBadge>;

export const Pending: Story = {
  args: { approval: mk("pending") },
};
export const Approved: Story = {
  args: { approval: mk("approved", BOB) },
};
export const ConditionallyApproved: Story = {
  args: {
    approval: mk(
      "conditionally-approved",
      BOB,
      "Shipping as conditional — FAT report pending within two weeks.",
    ),
  },
};
export const Rejected: Story = {
  args: {
    approval: mk("rejected", BOB, "Architecture diagram is missing — resubmit with diagrams."),
  },
};
export const Missing: Story = {
  args: { approval: null },
};
