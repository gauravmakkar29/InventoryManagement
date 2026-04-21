import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ApprovalDecisionPanel } from "./approval-decision-panel";
import type { Approval, ApprovalState } from "@/lib/compliance/approval";
import type { Completeness } from "@/lib/compliance/checklist";

const BASE: Omit<Approval, "state" | "reviewer" | "reason" | "decidedAt"> = {
  id: "a-1",
  subjectId: "subj-1",
  submittedBy: { userId: "alice", displayName: "Alice" },
  conditions: [],
  history: [],
};

function initial(state: ApprovalState): Approval {
  return { ...BASE, state, reviewer: null, reason: null, decidedAt: null };
}

interface HarnessProps {
  readonly initialState: ApprovalState;
  readonly completeness: Completeness;
  readonly canDecide: boolean;
}

function Harness({ initialState, completeness, canDecide }: HarnessProps) {
  const [approval, setApproval] = useState<Approval>(() => initial(initialState));
  return (
    <ApprovalDecisionPanel
      approval={approval}
      completeness={completeness}
      canDecide={canDecide}
      onDecide={async ({ nextState, reason }) => {
        setApproval((prev) => ({
          ...prev,
          state: nextState,
          reviewer: { userId: "bob", displayName: "Bob Reviewer" },
          reason: reason ?? null,
          decidedAt: new Date().toISOString(),
        }));
      }}
    />
  );
}

const meta: Meta<typeof ApprovalDecisionPanel> = {
  title: "Compliance/ApprovalDecisionPanel",
  component: ApprovalDecisionPanel,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Reviewer-only sticky decision surface. Buttons are enabled only when the transition is legal given the current state + checklist completeness. Server is the ground truth — client disabling is ergonomic only.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ApprovalDecisionPanel>;

export const PendingAndComplete: Story = {
  render: () => <Harness initialState="pending" completeness={{ kind: "complete" }} canDecide />,
};

export const PendingButIncomplete: Story = {
  render: () => (
    <Harness
      initialState="pending"
      completeness={{ kind: "incomplete", missing: ["sbom", "fat"] }}
      canDecide
    />
  ),
};

export const PendingAndConditional: Story = {
  render: () => (
    <Harness
      initialState="pending"
      completeness={{ kind: "conditionally-complete", pendingWaivers: ["fat"] }}
      canDecide
    />
  ),
};

export const ReadOnlyNoDecideAuth: Story = {
  render: () => (
    <Harness initialState="pending" completeness={{ kind: "complete" }} canDecide={false} />
  ),
};
