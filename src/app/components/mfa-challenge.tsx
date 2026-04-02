import { useState, useRef, useCallback } from "react";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { useAuth } from "../../lib/use-auth";
import { cn } from "../../lib/utils";

interface MfaChallengeProps {
  onSuccess: () => void;
}

export function MfaChallenge({ onSuccess }: MfaChallengeProps) {
  const { verifyMfa, signInError, signOut } = useAuth();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d?$/.test(value)) return;

      const next = [...digits];
      next[index] = value;
      setDigits(next);

      // Auto-focus next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      // Auto-submit when all 6 digits are entered
      if (value && index === 5) {
        const code = next.join("");
        if (code.length === 6) {
          handleSubmit(code);
        }
      }
    },
    [digits],
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [digits],
  );

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 0) return;

    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i]!;
    }
    setDigits(next);

    if (pasted.length === 6) {
      handleSubmit(pasted);
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  }, []);

  const handleSubmit = async (code: string) => {
    setIsVerifying(true);
    try {
      await verifyMfa(code);
      onSuccess();
    } catch {
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f9fafb] px-6">
      <div className="w-full max-w-[400px]">
        <div className="rounded-2xl bg-card p-8 shadow-lg">
          <div className="mb-7 flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
              <ShieldCheck className="h-9 w-9 text-accent-text" aria-hidden="true" />
            </div>
            <h2 className="text-[22px] font-semibold text-foreground">Verification Required</h2>
            <p className="mt-1.5 text-[15px] text-muted-foreground">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          {signInError && (
            <div
              className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
              <p className="text-[14px] leading-snug text-red-700">{signInError}</p>
            </div>
          )}

          {/* 6-digit code input */}
          <div className="flex justify-center gap-2.5" onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={isVerifying}
                autoFocus={i === 0}
                className={cn(
                  "h-12 w-11 rounded-lg border border-border bg-card text-center text-[18px] font-semibold text-foreground",
                  "focus:border-accent-text focus:outline-none focus:ring-2 focus:ring-ring/20",
                  "disabled:opacity-60",
                )}
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>

          {isVerifying && (
            <p className="mt-4 text-center text-[14px] text-muted-foreground">Verifying...</p>
          )}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={signOut}
              className="text-[14px] text-muted-foreground hover:text-muted-foreground cursor-pointer"
            >
              Cancel and sign out
            </button>
          </div>

          <div className="mt-4 rounded-lg bg-muted px-4 py-3">
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Open your authenticator app (Google Authenticator, Authy, etc.) and enter the current
              code. The code changes every 30 seconds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
