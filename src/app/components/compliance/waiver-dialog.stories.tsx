import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { WaiverDialog } from "./waiver-dialog";

const meta: Meta<typeof WaiverDialog> = {
  title: "Compliance/WaiverDialog",
  component: WaiverDialog,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Reviewer-only dialog for recording permanent or conditional waivers. Reason is 10-500 chars; conditional waivers require a due date bounded to today..+365d (SI-10).",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof WaiverDialog>;

function Harness({ slotKey = "sbom" }: { readonly slotKey?: string }) {
  const [open, setOpen] = useState(true);
  const [recorded, setRecorded] = useState<string | null>(null);
  if (!open && !recorded) {
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
  if (recorded) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 text-[12px]">
        <p className="font-medium">Recorded</p>
        <p className="mt-1 text-muted-foreground">{recorded}</p>
        <button
          type="button"
          onClick={() => {
            setRecorded(null);
            setOpen(true);
          }}
          className="mt-2 rounded-md border border-border bg-card px-3 py-1.5 text-[11px]"
        >
          Reset
        </button>
      </div>
    );
  }
  return (
    <WaiverDialog
      slotKey={slotKey}
      onClose={() => setOpen(false)}
      onPermanent={(reason) => {
        setRecorded(`Permanent waiver: ${reason}`);
        setOpen(false);
      }}
      onConditional={(reason, dueAt) => {
        setRecorded(`Conditional waiver due ${dueAt}: ${reason}`);
        setOpen(false);
      }}
    />
  );
}

export const Default: Story = {
  render: () => <Harness />,
};

export const WithCustomSlot: Story = {
  render: () => <Harness slotKey="architecture-diagram" />,
};
