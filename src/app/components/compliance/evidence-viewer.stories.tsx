import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";

import { EvidenceViewer } from "./evidence-viewer";
import { EvidenceStoreProvider, createMockEvidenceStore } from "@/lib/compliance/evidence";
import type { EvidenceMetadata, IEvidenceStore } from "@/lib/compliance/evidence";

const DEMO_ACTOR = { userId: "demo-user", displayName: "Demo User" } as const;

function makePdfBytes(): Uint8Array {
  const header = "%PDF-1.4\n% Demo evidence payload for Storybook";
  return new TextEncoder().encode(header);
}

function makePngBytes(): Uint8Array {
  // 1x1 transparent PNG
  return Uint8Array.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
    0x89, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
    0x42, 0x60, 0x82,
  ]);
}

interface HarnessProps {
  readonly mimeType: string;
  readonly bytes: Uint8Array;
  readonly children: (id: string) => ReactNode;
}

function EvidenceHarness({ mimeType, bytes, children }: HarnessProps) {
  const [id, setId] = useState<string | undefined>(undefined);
  const [store] = useState<IEvidenceStore>(() => createMockEvidenceStore());
  const [qc] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }));

  useEffect(() => {
    let cancelled = false;
    void store
      .put({
        bytes,
        mimeType,
        retentionMode: "compliance",
        retainUntil: "2099-01-01T00:00:00Z",
        tags: { demo: "true" },
        actor: DEMO_ACTOR,
      })
      .then((meta: EvidenceMetadata) => {
        if (!cancelled) setId(meta.id);
      });
    return () => {
      cancelled = true;
    };
  }, [store, bytes, mimeType]);

  return (
    <QueryClientProvider client={qc}>
      <EvidenceStoreProvider store={store} actor={DEMO_ACTOR}>
        <div className="max-w-xl p-4">
          {id ? children(id) : <p className="text-xs">Seeding mock store…</p>}
        </div>
      </EvidenceStoreProvider>
    </QueryClientProvider>
  );
}

const meta: Meta<typeof EvidenceViewer> = {
  title: "Compliance/EvidenceViewer",
  component: EvidenceViewer,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof EvidenceViewer>;

export const PdfPreview: Story = {
  render: () => (
    <EvidenceHarness mimeType="application/pdf" bytes={makePdfBytes()}>
      {(id) => <EvidenceViewer evidenceId={id} />}
    </EvidenceHarness>
  ),
};

export const ImagePreview: Story = {
  render: () => (
    <EvidenceHarness mimeType="image/png" bytes={makePngBytes()}>
      {(id) => <EvidenceViewer evidenceId={id} />}
    </EvidenceHarness>
  ),
};

export const UnsupportedMime: Story = {
  render: () => (
    <EvidenceHarness
      mimeType="application/octet-stream"
      bytes={new TextEncoder().encode("binary payload")}
    >
      {(id) => <EvidenceViewer evidenceId={id} />}
    </EvidenceHarness>
  ),
};

export const NoPreview: Story = {
  render: () => (
    <EvidenceHarness mimeType="application/pdf" bytes={makePdfBytes()}>
      {(id) => <EvidenceViewer evidenceId={id} preview={false} />}
    </EvidenceHarness>
  ),
};
