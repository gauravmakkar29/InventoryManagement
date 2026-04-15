/**
 * Tests for FirmwareTransitionPanel — focused on the Story 27.4 (#420)
 * reason-capture behavior (textarea + char counter + required-on-destructive).
 *
 * Non-reason concerns (role gating, SoD enforcement, transitions table) are
 * covered by the parent firmware-lifecycle flow's own tests / Storybook.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FirmwareTransitionPanel } from "@/app/components/firmware/firmware-lifecycle";
import { ApprovalStage, FirmwareLifecycleState, FirmwareStatus, type Firmware } from "@/lib/types";

// Use the Admin role and a different user id than `firmware.uploadedBy`
// so that role + SoD checks allow every transition under test.
const ROLE = "Admin" as const;
const CURRENT_USER_ID = "user-approver-01";

const MOCK_FIRMWARE: Firmware = {
  id: "fw-test-001",
  version: "v1.0.0",
  name: "Test Firmware",
  status: FirmwareStatus.Testing,
  approvalStage: ApprovalStage.Testing,
  releaseNotes: "test",
  fileSize: 1024,
  checksum: "sha256:test",
  uploadedBy: "user-uploader-02", // distinct from CURRENT_USER_ID
  uploadedAt: "2026-01-01T00:00:00Z",
  compatibleModels: ["TEST"],
  targetDeviceCount: 0,
  deployedDeviceCount: 0,
};

function renderPanel(
  currentState: FirmwareLifecycleState = FirmwareLifecycleState.Screening,
  onTransition = vi.fn(),
) {
  const result = render(
    <FirmwareTransitionPanel
      firmware={MOCK_FIRMWARE}
      currentState={currentState}
      role={ROLE}
      currentUserId={CURRENT_USER_ID}
      onTransition={onTransition}
    />,
  );
  return { ...result, onTransition };
}

describe("FirmwareTransitionPanel — reason capture (Story 27.4 #420)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("non-destructive transition (comment optional)", () => {
    it("opens the textarea with an 'optional' label and no min-char requirement", async () => {
      const user = userEvent.setup();
      renderPanel(FirmwareLifecycleState.Screening);

      // Click "Promote to Staged" — non-destructive transition
      await user.click(screen.getByRole("button", { name: /promote to staged/i }));

      const textarea = screen.getByRole("textbox");
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute("aria-required", "false");
      expect(screen.getByText(/comment \(optional\)/i)).toBeInTheDocument();
    });

    it("enables confirm with an empty reason", async () => {
      const user = userEvent.setup();
      const { onTransition } = renderPanel(FirmwareLifecycleState.Screening);

      await user.click(screen.getByRole("button", { name: /promote to staged/i }));
      const confirmBtn = screen.getByRole("button", { name: /confirm promote to staged/i });
      expect(confirmBtn).toBeEnabled();

      await user.click(confirmBtn);
      expect(onTransition).toHaveBeenCalledWith(
        MOCK_FIRMWARE.id,
        FirmwareLifecycleState.Staged,
        undefined, // empty reason => undefined
      );
    });

    it("passes a trimmed reason to onTransition when provided", async () => {
      const user = userEvent.setup();
      const { onTransition } = renderPanel(FirmwareLifecycleState.Screening);

      await user.click(screen.getByRole("button", { name: /promote to staged/i }));
      await user.type(screen.getByRole("textbox"), "  tested in sandbox  ");
      await user.click(screen.getByRole("button", { name: /confirm promote to staged/i }));

      expect(onTransition).toHaveBeenCalledWith(
        MOCK_FIRMWARE.id,
        FirmwareLifecycleState.Staged,
        "tested in sandbox",
      );
    });
  });

  describe("destructive transition (reason required, min 10)", () => {
    it("labels the textarea 'required' and marks aria-required", async () => {
      const user = userEvent.setup();
      renderPanel(FirmwareLifecycleState.Screening);

      await user.click(screen.getByRole("button", { name: /recall/i }));

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("aria-required", "true");
      expect(screen.getByText(/reason \(required/i)).toBeInTheDocument();
    });

    it("disables confirm until reason reaches the minimum length", async () => {
      const user = userEvent.setup();
      renderPanel(FirmwareLifecycleState.Screening);

      await user.click(screen.getByRole("button", { name: /recall/i }));
      const confirmBtn = screen.getByRole("button", { name: /confirm recall/i });

      // Empty
      expect(confirmBtn).toBeDisabled();

      // Under 10 chars
      await user.type(screen.getByRole("textbox"), "short");
      expect(confirmBtn).toBeDisabled();

      // Exactly 10 chars
      await user.clear(screen.getByRole("textbox"));
      await user.type(screen.getByRole("textbox"), "0123456789");
      expect(confirmBtn).toBeEnabled();
    });

    it("shows a 'need N more' hint while under the minimum", async () => {
      const user = userEvent.setup();
      renderPanel(FirmwareLifecycleState.Screening);

      await user.click(screen.getByRole("button", { name: /recall/i }));
      await user.type(screen.getByRole("textbox"), "seven.."); // 7 chars

      // Character counter should render the remaining-chars hint
      expect(screen.getByText(/need 3 more/i)).toBeInTheDocument();
    });

    it("forwards the validated reason to onTransition", async () => {
      const user = userEvent.setup();
      const { onTransition } = renderPanel(FirmwareLifecycleState.Screening);

      await user.click(screen.getByRole("button", { name: /recall/i }));
      const reason = "CVE-2026-1234 introduced a remote-code-execution path — blocking immediately";
      await user.type(screen.getByRole("textbox"), reason);
      await user.click(screen.getByRole("button", { name: /confirm recall/i }));

      expect(onTransition).toHaveBeenCalledWith(
        MOCK_FIRMWARE.id,
        FirmwareLifecycleState.Recalled,
        reason,
      );
    });
  });

  describe("character counter", () => {
    it("updates as the user types", async () => {
      const user = userEvent.setup();
      renderPanel(FirmwareLifecycleState.Screening);

      await user.click(screen.getByRole("button", { name: /promote to staged/i }));
      const textarea = screen.getByRole("textbox");

      await user.type(textarea, "hello");
      expect(screen.getByText(/5 \/ 1000/)).toBeInTheDocument();
    });

    it("caps input at the max length via maxLength attribute", async () => {
      renderPanel(FirmwareLifecycleState.Screening);

      fireEvent.click(screen.getByRole("button", { name: /promote to staged/i }));
      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("maxLength", "1000");
    });
  });
});
