import type { Meta, StoryObj } from "@storybook/react";
import { SlaCountdown } from "./sla-countdown";
import type { SlaCondition } from "@/lib/compliance/approval";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function cond(inMs: number, status: SlaCondition["status"] = "pending"): SlaCondition {
  return {
    id: `c-${inMs}`,
    description: "sample condition",
    dueAt: new Date(Date.now() + inMs).toISOString(),
    status,
  };
}

const meta: Meta<typeof SlaCountdown> = {
  title: "Compliance/SlaCountdown",
  component: SlaCountdown,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Severity pill for a conditional-approval SLA — safe (>7d), warn (≤7d), urgent (≤24h), breached. Text updates once per minute.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SlaCountdown>;

export const Safe: Story = {
  args: { condition: cond(10 * MS_PER_DAY) },
};
export const Warn: Story = {
  args: { condition: cond(3 * MS_PER_DAY) },
};
export const Urgent: Story = {
  args: { condition: cond(12 * 60 * 60 * 1000) },
};
export const Breached: Story = {
  args: { condition: cond(-2 * MS_PER_DAY) },
};
export const Satisfied: Story = {
  args: { condition: cond(-2 * MS_PER_DAY, "satisfied") },
};
