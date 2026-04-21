import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useState } from "react";
import {
  ComplianceHarness,
  DEMO_ACTOR,
  OTHER_ACTOR,
  type ComplianceHarnessStores,
} from "./__stories/compliance-story-harness";
import { ConditionsPanel } from "./conditions-panel";
import type { Approval, SlaCondition } from "@/lib/compliance/approval";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function mkCond(
  id: string,
  inMs: number,
  status: SlaCondition["status"] = "pending",
): SlaCondition {
  return {
    id,
    description: `Condition ${id}: evidence expected`,
    dueAt: new Date(Date.now() + inMs).toISOString(),
    status,
  };
}

async function seedApproval(
  engine: ComplianceHarnessStores["approvalEngine"],
  conditions: readonly SlaCondition[],
): Promise<Approval> {
  const created = await engine.create("subj-demo", DEMO_ACTOR);
  const decided = await engine.decide(
    created.id,
    {
      nextState: "conditionally-approved",
      reviewer: OTHER_ACTOR,
      reason: "Conditional approval with tracked SLA conditions.",
      conditions,
    },
    { completeness: { kind: "conditionally-complete", pendingWaivers: ["fat"] } },
  );
  return decided;
}

function useSeededApproval(
  seed: () => Promise<Approval>,
): readonly [Approval | null, (a: Approval) => void] {
  const [approval, setApproval] = useState<Approval | null>(null);
  useEffect(() => {
    let cancelled = false;
    void seed().then((a) => {
      if (!cancelled) setApproval(a);
    });
    return () => {
      cancelled = true;
    };
  }, [seed]);
  return [approval, setApproval] as const;
}

interface RenderHostProps {
  readonly stores: ComplianceHarnessStores;
  readonly conditions: readonly SlaCondition[];
  readonly canSatisfy: boolean;
}

function ConditionsPanelRenderHost({ stores, conditions, canSatisfy }: RenderHostProps) {
  const [approval] = useSeededApproval(() => {
    if (conditions.length === 0) {
      return Promise.resolve<Approval>({
        id: "a-empty",
        subjectId: "subj-demo",
        submittedBy: DEMO_ACTOR,
        state: "approved",
        reviewer: OTHER_ACTOR,
        reason: null,
        decidedAt: new Date().toISOString(),
        conditions: [],
        history: [],
      });
    }
    return seedApproval(stores.approvalEngine, conditions);
  });

  if (!approval) return <p className="text-xs">Seeding approval…</p>;
  return (
    <ConditionsPanel
      approval={approval}
      engine={stores.approvalEngine}
      actor={OTHER_ACTOR}
      canSatisfy={canSatisfy}
    />
  );
}

const meta: Meta<typeof ConditionsPanel> = {
  title: "Compliance/ConditionsPanel",
  component: ConditionsPanel,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Lists SLA conditions attached to a conditionally-approved subject. Reviewers can mark individual conditions satisfied with a required reason (10-500 chars).",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ConditionsPanel>;

export const MixedStatuses: Story = {
  render: () => (
    <ComplianceHarness>
      {(stores) => (
        <ConditionsPanelRenderHost
          stores={stores}
          conditions={[
            mkCond("c-1", 5 * MS_PER_DAY),
            mkCond("c-2", 12 * 60 * 60 * 1000),
            mkCond("c-3", -MS_PER_DAY),
            mkCond("c-4", 2 * MS_PER_DAY, "satisfied"),
          ]}
          canSatisfy
        />
      )}
    </ComplianceHarness>
  ),
};

export const Empty: Story = {
  render: () => (
    <ComplianceHarness>
      {(stores) => <ConditionsPanelRenderHost stores={stores} conditions={[]} canSatisfy />}
    </ComplianceHarness>
  ),
};

export const ReadOnly: Story = {
  render: () => (
    <ComplianceHarness>
      {(stores) => (
        <ConditionsPanelRenderHost
          stores={stores}
          conditions={[mkCond("c-1", 4 * MS_PER_DAY), mkCond("c-2", -MS_PER_DAY)]}
          canSatisfy={false}
        />
      )}
    </ComplianceHarness>
  ),
};
