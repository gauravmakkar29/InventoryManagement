import { describe, expect, it } from "vitest";
import { createMockSecureDistribution } from "@/lib/compliance/distribution/mock-secure-distribution";
import {
  MfaStepUpRequiredError,
  SecureLinkConsumedError,
  SecureLinkExpiredError,
  TokenMismatchError,
} from "@/lib/compliance/distribution/distribution-errors";
import { AccessDeniedError } from "@/lib/compliance/types";
import type { Role } from "@/lib/rbac";

const ADMIN = { userId: "admin", displayName: "Admin" };
const ALICE = { userId: "alice", displayName: "Alice" };
const BOB = { userId: "bob", displayName: "Bob" };

function adminOrTech(actor: { userId: string }): Role {
  return actor.userId === "admin" ? "Admin" : "Technician";
}

describe("createMockSecureDistribution — Story 28.5", () => {
  it("mint + redeem round-trip returns a storage URL", async () => {
    const driver = createMockSecureDistribution({ resolveRole: adminOrTech });
    const link = await driver.mintLink(
      {
        evidenceId: "ev-1",
        recipientUserId: ALICE.userId,
        expiresInSeconds: 60,
        requireStepUpMfa: false,
      },
      ADMIN,
    );
    expect(link.singleUse).toBe(true);
    expect(link.jti).toMatch(/^[0-9a-f]{32}$/);

    const redemption = await driver.redeem(link.token, { actor: ALICE });
    expect(redemption.evidenceId).toBe("ev-1");
    expect(redemption.recipientUserId).toBe(ALICE.userId);
  });

  it("double-redeem fails with SecureLinkConsumedError", async () => {
    const driver = createMockSecureDistribution({ resolveRole: adminOrTech });
    const link = await driver.mintLink(
      {
        evidenceId: "ev-1",
        recipientUserId: ALICE.userId,
        expiresInSeconds: 60,
        requireStepUpMfa: false,
      },
      ADMIN,
    );
    await driver.redeem(link.token, { actor: ALICE });
    await expect(driver.redeem(link.token, { actor: ALICE })).rejects.toBeInstanceOf(
      SecureLinkConsumedError,
    );
  });

  it("redeem rejected when redeemer != recipient", async () => {
    const driver = createMockSecureDistribution({ resolveRole: adminOrTech });
    const link = await driver.mintLink(
      {
        evidenceId: "ev-1",
        recipientUserId: ALICE.userId,
        expiresInSeconds: 60,
        requireStepUpMfa: false,
      },
      ADMIN,
    );
    await expect(driver.redeem(link.token, { actor: BOB })).rejects.toBeInstanceOf(
      TokenMismatchError,
    );
  });

  it("redeem rejected after expiry", async () => {
    let clock = new Date("2026-04-21T10:00:00Z");
    const driver = createMockSecureDistribution({
      resolveRole: adminOrTech,
      now: () => clock,
    });
    const link = await driver.mintLink(
      {
        evidenceId: "ev-1",
        recipientUserId: ALICE.userId,
        expiresInSeconds: 60,
        requireStepUpMfa: false,
      },
      ADMIN,
    );
    clock = new Date("2026-04-21T10:02:00Z");
    await expect(driver.redeem(link.token, { actor: ALICE })).rejects.toBeInstanceOf(
      SecureLinkExpiredError,
    );
  });

  it("step-up MFA required when flag set and no fresh timestamp", async () => {
    const driver = createMockSecureDistribution({ resolveRole: adminOrTech });
    const link = await driver.mintLink(
      {
        evidenceId: "ev-mfa",
        recipientUserId: ALICE.userId,
        expiresInSeconds: 60,
        requireStepUpMfa: true,
      },
      ADMIN,
    );
    await expect(driver.redeem(link.token, { actor: ALICE })).rejects.toBeInstanceOf(
      MfaStepUpRequiredError,
    );
  });

  it("step-up MFA accepts a fresh timestamp", async () => {
    const clock = new Date("2026-04-21T10:00:00Z");
    const driver = createMockSecureDistribution({
      resolveRole: adminOrTech,
      now: () => clock,
    });
    const link = await driver.mintLink(
      {
        evidenceId: "ev-mfa",
        recipientUserId: ALICE.userId,
        expiresInSeconds: 60,
        requireStepUpMfa: true,
      },
      ADMIN,
    );
    const redemption = await driver.redeem(link.token, {
      actor: ALICE,
      lastStepUpMfaAt: new Date(clock.getTime() - 60_000).toISOString(),
    });
    expect(redemption.jti).toBe(link.jti);
  });

  it("step-up MFA rejects stale timestamp", async () => {
    const clock = new Date("2026-04-21T10:00:00Z");
    const driver = createMockSecureDistribution({
      resolveRole: adminOrTech,
      now: () => clock,
    });
    const link = await driver.mintLink(
      {
        evidenceId: "ev-mfa",
        recipientUserId: ALICE.userId,
        expiresInSeconds: 60,
        requireStepUpMfa: true,
      },
      ADMIN,
    );
    await expect(
      driver.redeem(link.token, {
        actor: ALICE,
        lastStepUpMfaAt: new Date(clock.getTime() - 10 * 60 * 1000).toISOString(),
      }),
    ).rejects.toBeInstanceOf(MfaStepUpRequiredError);
  });

  it("token tampering detected by signature check", async () => {
    const driver = createMockSecureDistribution({ resolveRole: adminOrTech });
    const link = await driver.mintLink(
      {
        evidenceId: "ev-1",
        recipientUserId: ALICE.userId,
        expiresInSeconds: 60,
        requireStepUpMfa: false,
      },
      ADMIN,
    );
    const tampered = link.token.slice(0, -2) + "ff";
    await expect(driver.redeem(tampered, { actor: ALICE })).rejects.toBeInstanceOf(
      TokenMismatchError,
    );
  });

  it("race safety — concurrent redemptions produce exactly one success", async () => {
    const driver = createMockSecureDistribution({ resolveRole: adminOrTech });
    const link = await driver.mintLink(
      {
        evidenceId: "ev-race",
        recipientUserId: ALICE.userId,
        expiresInSeconds: 60,
        requireStepUpMfa: false,
      },
      ADMIN,
    );
    const results = await Promise.allSettled([
      driver.redeem(link.token, { actor: ALICE }),
      driver.redeem(link.token, { actor: ALICE }),
    ]);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
    const reason = (rejected[0] as PromiseRejectedResult).reason;
    expect(reason).toBeInstanceOf(SecureLinkConsumedError);
  });

  it("mintLink denied for role without distribution:approve", async () => {
    const driver = createMockSecureDistribution({ resolveRole: adminOrTech });
    await expect(
      driver.mintLink(
        {
          evidenceId: "ev-1",
          recipientUserId: ALICE.userId,
          expiresInSeconds: 60,
          requireStepUpMfa: false,
        },
        ALICE, // Technician — not authorized to approve distribution
      ),
    ).rejects.toBeInstanceOf(AccessDeniedError);
  });

  it("listMyActive returns only active links for the given recipient", async () => {
    const driver = createMockSecureDistribution({ resolveRole: adminOrTech });
    const l1 = await driver.mintLink(
      {
        evidenceId: "ev-A",
        recipientUserId: ALICE.userId,
        expiresInSeconds: 300,
        requireStepUpMfa: false,
      },
      ADMIN,
    );
    await driver.mintLink(
      {
        evidenceId: "ev-B",
        recipientUserId: BOB.userId,
        expiresInSeconds: 300,
        requireStepUpMfa: false,
      },
      ADMIN,
    );
    const aliceActive = await driver.listMyActive(ALICE.userId);
    expect(aliceActive.length).toBe(1);
    expect(aliceActive[0]?.jti).toBe(l1.jti);

    // After consuming, listMyActive should exclude it.
    await driver.redeem(l1.token, { actor: ALICE });
    const aliceActive2 = await driver.listMyActive(ALICE.userId);
    expect(aliceActive2.length).toBe(0);
  });
});
