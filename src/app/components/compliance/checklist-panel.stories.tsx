import type { Meta, StoryObj } from "@storybook/react";
import { ComplianceHarness, DEMO_ACTOR } from "./__stories/compliance-story-harness";
import { ChecklistPanel } from "./checklist-panel";
import type { ChecklistSchema } from "@/lib/compliance/checklist";

const DEMO_SCHEMA: ChecklistSchema = {
  schemaId: "release-bundle",
  label: "Release Bundle Checklist",
  slots: [
    { key: "sbom", label: "Software Bill of Materials", required: true },
    { key: "hbom", label: "Hardware Bill of Materials", required: true },
    { key: "fat", label: "FAT / QA Test Results", required: true },
    { key: "release-notes", label: "Release Notes", required: true },
    { key: "attestation", label: "Attestation", required: false },
  ],
};

const meta: Meta<typeof ChecklistPanel> = {
  title: "Compliance/ChecklistPanel",
  component: ChecklistPanel,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Domain-agnostic N-of-M checklist with four slot states: present, missing, waived-permanent, waived-conditional. Actions gated on caller-supplied `canAttach` / `canWaive`.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChecklistPanel>;

export const AllMissing: Story = {
  render: () => (
    <ComplianceHarness schemas={[DEMO_SCHEMA]}>
      {() => (
        <ChecklistPanel schemaId={DEMO_SCHEMA.schemaId} subjectId="sub-1" canAttach canWaive />
      )}
    </ComplianceHarness>
  ),
};

export const Complete: Story = {
  render: () => (
    <ComplianceHarness
      schemas={[DEMO_SCHEMA]}
      seed={async ({ checklistStore }) => {
        for (const key of ["sbom", "hbom", "fat", "release-notes"]) {
          await checklistStore.attachSlot(
            DEMO_SCHEMA.schemaId,
            "sub-2",
            key,
            `ev-${key}`,
            DEMO_ACTOR,
          );
        }
      }}
    >
      {() => (
        <ChecklistPanel schemaId={DEMO_SCHEMA.schemaId} subjectId="sub-2" canAttach canWaive />
      )}
    </ComplianceHarness>
  ),
};

export const ConditionallyComplete: Story = {
  render: () => (
    <ComplianceHarness
      schemas={[DEMO_SCHEMA]}
      seed={async ({ checklistStore }) => {
        await checklistStore.attachSlot(
          DEMO_SCHEMA.schemaId,
          "sub-3",
          "sbom",
          "ev-sbom",
          DEMO_ACTOR,
        );
        await checklistStore.attachSlot(
          DEMO_SCHEMA.schemaId,
          "sub-3",
          "hbom",
          "ev-hbom",
          DEMO_ACTOR,
        );
        await checklistStore.attachSlot(
          DEMO_SCHEMA.schemaId,
          "sub-3",
          "release-notes",
          "ev-rn",
          DEMO_ACTOR,
        );
        await checklistStore.waiveConditional(
          DEMO_SCHEMA.schemaId,
          "sub-3",
          "fat",
          "Hardware regression lab queued — expected within two weeks.",
          new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          DEMO_ACTOR,
        );
      }}
    >
      {() => (
        <ChecklistPanel schemaId={DEMO_SCHEMA.schemaId} subjectId="sub-3" canAttach canWaive />
      )}
    </ComplianceHarness>
  ),
};

export const MixedStates: Story = {
  render: () => (
    <ComplianceHarness
      schemas={[DEMO_SCHEMA]}
      seed={async ({ checklistStore }) => {
        await checklistStore.attachSlot(
          DEMO_SCHEMA.schemaId,
          "sub-4",
          "sbom",
          "ev-sbom",
          DEMO_ACTOR,
        );
        await checklistStore.waivePermanent(
          DEMO_SCHEMA.schemaId,
          "sub-4",
          "hbom",
          "Not applicable to this product line — software-only release.",
          DEMO_ACTOR,
        );
        await checklistStore.waiveConditional(
          DEMO_SCHEMA.schemaId,
          "sub-4",
          "fat",
          "FAT scheduled for next week — interim approval granted.",
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          DEMO_ACTOR,
        );
      }}
    >
      {() => (
        <ChecklistPanel schemaId={DEMO_SCHEMA.schemaId} subjectId="sub-4" canAttach canWaive />
      )}
    </ComplianceHarness>
  ),
};

export const NoWaiveAuthority: Story = {
  render: () => (
    <ComplianceHarness schemas={[DEMO_SCHEMA]}>
      {() => (
        <ChecklistPanel
          schemaId={DEMO_SCHEMA.schemaId}
          subjectId="sub-5"
          canAttach
          canWaive={false}
        />
      )}
    </ComplianceHarness>
  ),
};
