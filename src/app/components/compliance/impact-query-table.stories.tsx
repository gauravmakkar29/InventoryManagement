import type { Meta, StoryObj } from "@storybook/react";
import {
  ComplianceHarness,
  DEMO_ACTOR,
  type ComplianceHarnessStores,
} from "./__stories/compliance-story-harness";
import { ImpactQueryTable } from "./impact-query-table";

async function seedConsumers(
  graph: ComplianceHarnessStores["dependencyGraph"],
  count: number,
): Promise<void> {
  const sites = ["site:alpha", "site:beta", "site:gamma"];
  const states = ["active", "quarantined", "decommissioned"];
  const versions = ["1.0", "1.1", "1.2"];
  for (let i = 0; i < count; i++) {
    await graph.upsertBinding({
      consumerId: `dev-${i.toString().padStart(4, "0")}`,
      consumerType: "Device",
      resourceId: "fw-demo",
      version: versions[i % versions.length]!,
      scope: [sites[i % sites.length]!],
      state: states[i % states.length]!,
      meta: { model: "SG5000HV" },
      actor: DEMO_ACTOR,
    });
  }
}

const meta: Meta<typeof ImpactQueryTable> = {
  title: "Compliance/ImpactQueryTable",
  component: ImpactQueryTable,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Version-first blast-radius query. Scope + state filters compose with ANY-OF semantics; CSV export iterates all pages so large result sets ship consistently.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ImpactQueryTable>;

export const Populated: Story = {
  render: () => (
    <ComplianceHarness seed={async ({ dependencyGraph }) => seedConsumers(dependencyGraph, 60)}>
      {(stores) => (
        <ImpactQueryTable
          driver={stores.dependencyGraph}
          actor={DEMO_ACTOR}
          resourceId="fw-demo"
          version="1.0"
          scopeOptions={["site:alpha", "site:beta", "site:gamma"]}
          stateOptions={["active", "quarantined", "decommissioned"]}
          limit={10}
        />
      )}
    </ComplianceHarness>
  ),
};

export const Empty: Story = {
  render: () => (
    <ComplianceHarness>
      {(stores) => (
        <ImpactQueryTable
          driver={stores.dependencyGraph}
          actor={DEMO_ACTOR}
          resourceId="fw-demo"
          version="9.9"
          scopeOptions={["site:alpha"]}
          stateOptions={["active"]}
        />
      )}
    </ComplianceHarness>
  ),
};

export const LargeResultSet: Story = {
  render: () => (
    <ComplianceHarness seed={async ({ dependencyGraph }) => seedConsumers(dependencyGraph, 250)}>
      {(stores) => (
        <ImpactQueryTable
          driver={stores.dependencyGraph}
          actor={DEMO_ACTOR}
          resourceId="fw-demo"
          version="1.0"
          scopeOptions={["site:alpha", "site:beta", "site:gamma"]}
          stateOptions={["active", "quarantined", "decommissioned"]}
          limit={25}
        />
      )}
    </ComplianceHarness>
  ),
};
