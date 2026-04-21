import type { Meta, StoryObj } from "@storybook/react";
import { ComplianceHarness, DEMO_ACTOR } from "./__stories/compliance-story-harness";
import { SecureDownloadButton } from "./secure-download-button";

const meta: Meta<typeof SecureDownloadButton> = {
  title: "Compliance/SecureDownloadButton",
  component: SecureDownloadButton,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Single-click mint → (optional step-up MFA) → redeem → open. Driven by the callerinjected `ISecureDistribution` driver; tokens are single-use, recipient-bound, and expire on first use.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SecureDownloadButton>;

export const Default: Story = {
  render: () => (
    <ComplianceHarness>
      {(stores) => (
        <SecureDownloadButton
          driver={stores.distribution}
          actor={DEMO_ACTOR}
          recipientUserId={DEMO_ACTOR.userId}
          evidenceId="ev-demo-1"
          purpose="Storybook demo"
        />
      )}
    </ComplianceHarness>
  ),
};

export const RequiresStepUpMfa: Story = {
  render: () => (
    <ComplianceHarness>
      {(stores) => (
        <SecureDownloadButton
          driver={stores.distribution}
          actor={DEMO_ACTOR}
          recipientUserId={DEMO_ACTOR.userId}
          evidenceId="ev-demo-2"
          purpose="Storybook demo (MFA-gated)"
          requireStepUpMfa
          onStepUpMfa={async () => {
            // Storybook mock: simulate a 1-second MFA challenge that resolves to a fresh timestamp
            await new Promise((resolve) => setTimeout(resolve, 1_000));
            return new Date().toISOString();
          }}
        />
      )}
    </ComplianceHarness>
  ),
};

export const CustomLabelAndExpiry: Story = {
  render: () => (
    <ComplianceHarness>
      {(stores) => (
        <SecureDownloadButton
          driver={stores.distribution}
          actor={DEMO_ACTOR}
          recipientUserId={DEMO_ACTOR.userId}
          evidenceId="ev-demo-3"
          label="Download audit bundle"
          expiresInSeconds={300}
        />
      )}
    </ComplianceHarness>
  ),
};
