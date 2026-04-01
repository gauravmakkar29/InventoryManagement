import { useState, useEffect, useRef, useCallback } from "react";
import { ShieldCheck, Copy, Check, AlertCircle, X } from "lucide-react";
import { useAuth } from "../../lib/use-auth";
import { cn } from "../../lib/utils";

interface MfaSetupProps {
  onClose: () => void;
}

export function MfaSetup({ onClose }: MfaSetupProps) {
  const { setupMfa, confirmMfaSetup } = useAuth();
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [secret, setSecret] = useState("");
  const [copied, setCopied] = useState(false);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setupMfa().then((uri) => {
      setTotpUri(uri);
      // Extract secret from URI
      const match = uri.match(/secret=([A-Z2-7]+)/);
      if (match) setSecret(match[1]!);
    });
  }, [setupMfa]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [secret]);

  const handleChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d?$/.test(value)) return;
      const next = [...digits];
      next[index] = value;
      setDigits(next);
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
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

  const handleVerify = async () => {
    const code = digits.join("");
    if (code.length !== 6) return;

    setIsVerifying(true);
    setError(null);
    try {
      await confirmMfaSetup(code);
      onClose();
    } catch {
      setError("Invalid verification code. Please try again.");
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  // QR code rendered as a placeholder since we can't generate actual QR in mock
  const qrPlaceholder = totpUri ? (
    <div className="flex h-[180px] w-[180px] items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
      <div className="text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-2 text-[13px] text-gray-500">QR Code</p>
        <p className="text-[12px] text-gray-300">Scan with authenticator</p>
      </div>
    </div>
  ) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-600 cursor-pointer"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 text-center">
          <h2 className="text-[20px] font-semibold text-gray-900">Set Up MFA</h2>
          <p className="mt-1.5 text-[15px] text-gray-500">
            Scan the QR code with your authenticator app
          </p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-5">{qrPlaceholder}</div>

        {/* Manual key */}
        {secret && (
          <div className="mb-5">
            <p className="text-[14px] font-medium text-gray-500 mb-1.5">
              Can't scan? Enter this key manually:
            </p>
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5">
              <code className="flex-1 text-[15px] font-mono font-medium text-gray-700 tracking-widest">
                {secret}
              </code>
              <button
                onClick={handleCopy}
                className="shrink-0 text-gray-500 hover:text-gray-600 cursor-pointer"
                aria-label="Copy secret key"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Verification code input */}
        <div className="mb-4">
          <p className="text-[14px] font-medium text-gray-700 mb-2">
            Enter the 6-digit verification code:
          </p>
          <div className="flex justify-center gap-2">
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
                className={cn(
                  "h-11 w-10 rounded-lg border border-gray-200 bg-white text-center text-[16px] font-semibold text-gray-900",
                  "focus:border-[#FF7900] focus:outline-none focus:ring-2 focus:ring-[#FF7900]/20",
                  "disabled:opacity-60",
                )}
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div
            className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
            <p className="text-[14px] text-red-700">{error}</p>
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={isVerifying || digits.join("").length !== 6}
          className={cn(
            "flex h-11 w-full items-center justify-center rounded-lg bg-[#FF7900] text-[15px] font-semibold text-white",
            "hover:bg-[#e66d00] cursor-pointer",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {isVerifying ? "Verifying..." : "Enable MFA"}
        </button>
      </div>
    </div>
  );
}
