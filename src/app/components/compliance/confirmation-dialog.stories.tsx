import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ConfirmationDialog } from "./confirmation-dialog";
import type { ActionInitiation, ProofValidator } from "@/lib/compliance/confirmation";

interface DeployProof {
  readonly note: string;
  readonly photos: readonly string[];
}

const DEPLOY_INIT: ActionInitiation<{ readonly siteId: string }> = {
  id: "init-1",
  kind: "deploy-firmware",
  payload: { siteId: "site-alpha" },
  initiatedAt: "2026-04-21T10:00:00Z",
  initiatedBy: { userId: "alice", displayName: "Alice Tech" },
  state: "initiated",
};

const DEPLOY_VALIDATOR: ProofValidator<DeployProof> = (p) => {
  const messages: string[] = [];
  if (p.note.length < 10) messages.push("note must be at least 10 characters");
  if (p.photos.length < 1) messages.push("at least one photo reference is required");
  return { ok: messages.length === 0, messages };
};

function Harness() {
  const [open, setOpen] = useState(true);
  const [confirmed, setConfirmed] = useState<DeployProof | null>(null);

  if (confirmed) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 text-[12px]">
        <p className="font-medium">Confirmed</p>
        <pre className="mt-1 whitespace-pre-wrap text-muted-foreground">
          {JSON.stringify(confirmed, null, 2)}
        </pre>
        <button
          type="button"
          onClick={() => {
            setConfirmed(null);
            setOpen(true);
          }}
          className="mt-2 rounded-md border border-border bg-card px-3 py-1.5 text-[11px]"
        >
          Reset
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-border bg-card px-3 py-1.5 text-[12px]"
      >
        Re-open
      </button>
    );
  }

  return (
    <ConfirmationDialog<DeployProof>
      initiation={DEPLOY_INIT as ActionInitiation}
      validator={DEPLOY_VALIDATOR}
      initialProof={{ note: "", photos: [] }}
      onConfirm={async (proof) => {
        setConfirmed(proof);
        setOpen(false);
      }}
      onClose={() => setOpen(false)}
      title="Confirm deployment"
      renderFields={({ proof, setProof }) => (
        <>
          <div>
            <label
              htmlFor="confirm-demo-note"
              className="mb-1 block text-[12px] font-medium text-foreground"
            >
              Installation notes
            </label>
            <textarea
              id="confirm-demo-note"
              value={proof.note}
              onChange={(e) => setProof({ ...proof, note: e.target.value })}
              rows={3}
              className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-[12px] outline-none focus:border-primary"
            />
          </div>
          <div>
            <label
              htmlFor="confirm-demo-photos"
              className="mb-1 block text-[12px] font-medium text-foreground"
            >
              Photo evidence references (one per line)
            </label>
            <textarea
              id="confirm-demo-photos"
              value={proof.photos.join("\n")}
              onChange={(e) =>
                setProof({
                  ...proof,
                  photos: e.target.value
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              rows={2}
              placeholder="ev-photo-1&#10;ev-photo-2"
              className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-[12px] outline-none focus:border-primary"
            />
          </div>
        </>
      )}
    />
  );
}

const meta: Meta<typeof ConfirmationDialog> = {
  title: "Compliance/ConfirmationDialog",
  component: ConfirmationDialog,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Caller-driven proof capture. Validator is a pure function; the dialog renders caller-supplied fields. Same component works for any action kind — deployment, shipment, settings reconciliation, etc.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ConfirmationDialog>;

export const DeploymentConfirmation: Story = {
  render: () => <Harness />,
};
