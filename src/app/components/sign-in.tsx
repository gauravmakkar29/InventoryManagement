import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { Eye, EyeOff, AlertCircle, Fingerprint, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/use-auth";
import { cn } from "@/lib/utils";
import { MfaChallenge } from "./mfa-challenge";

interface SignInForm {
  email: string;
  password: string;
}

/* ─── Animated solar cell pattern (light theme) ───────────────────── */

function SolarPattern() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const cols = 20;
      const rows = 14;
      const cellW = w / cols;
      const cellH = h / rows;

      // Subtle grid
      for (let i = 0; i <= cols; i++) {
        const x = i * cellW;
        ctx.strokeStyle = "rgba(255, 121, 0, 0.06)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let j = 0; j <= rows; j++) {
        const y = j * cellH;
        ctx.strokeStyle = "rgba(255, 121, 0, 0.06)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Pulsing cells — like solar panels charging
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const wave = Math.sin(time * 0.8 + i * 0.6 + j * 0.8);
          if (wave > 0.5) {
            const alpha = (wave - 0.5) * 0.08;
            ctx.fillStyle = `rgba(255, 121, 0, ${alpha})`;
            ctx.fillRect(i * cellW + 1, j * cellH + 1, cellW - 2, cellH - 2);
          }
        }
      }

      // Floating energy dots
      for (let i = 0; i < 6; i++) {
        const px = ((time * 15 + i * 180) % (w + 80)) - 40;
        const py = h * 0.35 + Math.sin(time * 0.4 + i * 1.8) * h * 0.2;
        const size = 2 + Math.sin(time + i) * 0.8;
        ctx.fillStyle = `rgba(255, 121, 0, ${0.12 + Math.sin(time + i) * 0.06})`;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }

      time += 0.01;
      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden="true" />;
}

/* ─── Brand mark ──────────────────────────────────────────────────── */

function BrandMark({ variant = "light" }: { variant?: "light" | "dark" }) {
  const isDark = variant === "dark";
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center shadow-sm">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4" fill="white" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <path d="M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        </svg>
      </div>
      <div>
        <h1 className={cn("text-[18px] font-bold tracking-tight leading-none", isDark ? "text-gray-900" : "text-white")}>
          IMS Gen<span className="text-orange-500">2</span>
        </h1>
        <p className={cn("text-[10px] tracking-[0.15em] uppercase font-medium mt-0.5", isDark ? "text-gray-400" : "text-white/50")}>
          Hardware Lifecycle Platform
        </p>
      </div>
    </div>
  );
}

/* ─── Main Sign-In ────────────────────────────────────────────────── */

export function SignIn() {
  const { signIn, isAuthenticated, signInError, mfaRequired } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInForm>();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: SignInForm) => {
    try {
      await signIn(data.email, data.password);
      if (!mfaRequired) {
        navigate("/", { replace: true });
      }
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("fetch")) {
        toast.error("Unable to connect. Check your network and try again.");
      }
    }
  };

  if (mfaRequired) {
    return <MfaChallenge onSuccess={() => navigate("/", { replace: true })} />;
  }

  return (
    <div className="flex min-h-screen">
      {/* ─── Left panel: Brand showcase ─── */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between relative overflow-hidden bg-[#0f172a]">
        {/* Warm glow overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_30%_40%,rgba(255,121,0,0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_80%,rgba(255,121,0,0.05),transparent_60%)]" />

        <SolarPattern />

        {/* Top: Brand */}
        <div className="relative z-10 p-8">
          <BrandMark variant="light" />
        </div>

        {/* Center: Hero */}
        <div className="relative z-10 px-8 flex-1 flex flex-col justify-center max-w-lg">
          <p className="text-[12px] font-semibold text-orange-400 uppercase tracking-[0.2em] mb-4">
            Enterprise Platform
          </p>
          <h2 className="text-[38px] font-bold text-white leading-[1.1] tracking-tight">
            Command your
            <br />
            solar fleet
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-400 max-w-sm">
            Unified device management, firmware deployment, compliance tracking,
            and operational analytics for energy infrastructure.
          </p>

          {/* Capabilities */}
          <div className="mt-8 space-y-2.5">
            {[
              "Device inventory & lifecycle tracking",
              "Firmware OTA with multi-stage approval",
              "Compliance audit & vulnerability management",
              "Real-time fleet health analytics",
            ].map((item, i) => (
              <div key={item} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-orange-500/10 text-orange-400 text-[11px] font-bold tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <span className="text-[14px] text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Stats */}
        <div className="relative z-10 p-8 pt-0">
          <div className="border-t border-white/[0.06] pt-6 flex items-center gap-8">
            {[
              { value: "2,847", label: "Devices" },
              { value: "99.7%", label: "Uptime" },
              { value: "1.2 GW", label: "Managed" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-[20px] font-bold text-white tabular-nums">{value}</p>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Right panel: Sign-in form (LIGHT) ─── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 lg:w-[48%] bg-[#f7f8fa]">
        <div className="w-full max-w-[400px]">
          {/* Mobile brand */}
          <div className="mb-10 lg:hidden">
            <BrandMark variant="dark" />
          </div>

          {/* Form card */}
          <div className="rounded-2xl bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.04)] border border-gray-100">
            <div className="mb-7">
              <h2 className="text-[24px] font-semibold text-gray-900 tracking-tight">
                Welcome back
              </h2>
              <p className="mt-1.5 text-[15px] text-gray-500">
                Sign in to your management console
              </p>
            </div>

            {/* Error banner */}
            {signInError && (
              <div
                className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
                role="alert"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
                <p className="text-[14px] leading-snug text-red-700">{signInError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="signin-email"
                  className="block text-[13px] font-medium text-gray-700"
                >
                  Email address
                </label>
                <div className={cn(
                  "rounded-lg border transition-all duration-150",
                  focusedField === "email"
                    ? "border-orange-400 ring-[3px] ring-orange-500/10"
                    : "border-gray-200 hover:border-gray-300",
                  errors.email && "border-red-400 ring-[3px] ring-red-500/10",
                )}>
                  <input
                    id="signin-email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@sungrow.com"
                    aria-describedby={errors.email ? "signin-email-error" : undefined}
                    aria-invalid={errors.email ? true : undefined}
                    className="block h-11 w-full rounded-lg bg-transparent px-3.5 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Enter a valid email address",
                      },
                      onBlur: () => setFocusedField(null),
                    })}
                    onFocus={() => setFocusedField("email")}
                  />
                </div>
                {errors.email && (
                  <p id="signin-email-error" className="text-[13px] text-red-600" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="signin-password"
                    className="block text-[13px] font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-[13px] font-medium text-orange-600 hover:text-orange-700 transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className={cn(
                  "relative rounded-lg border transition-all duration-150",
                  focusedField === "password"
                    ? "border-orange-400 ring-[3px] ring-orange-500/10"
                    : "border-gray-200 hover:border-gray-300",
                  errors.password && "border-red-400 ring-[3px] ring-red-500/10",
                )}>
                  <input
                    id="signin-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    aria-describedby={errors.password ? "signin-password-error" : undefined}
                    aria-invalid={errors.password ? true : undefined}
                    className="block h-11 w-full rounded-lg bg-transparent px-3.5 pr-10 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
                    {...register("password", {
                      required: "Password is required",
                      onBlur: () => setFocusedField(null),
                    })}
                    onFocus={() => setFocusedField("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p id="signin-password-error" className="text-[13px] text-red-600" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "group relative flex h-11 w-full items-center justify-center rounded-lg text-[15px] font-semibold text-white cursor-pointer",
                  "bg-orange-500 hover:bg-orange-600",
                  "shadow-sm hover:shadow-md",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  "transition-all duration-150",
                )}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <span className="flex items-center gap-1.5">
                    Sign in
                    <ChevronRight className="h-4 w-4 opacity-60 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                  </span>
                )}
              </button>
            </form>

            {/* Security note */}
            <div className="mt-5 flex items-center justify-center gap-1.5 text-gray-400">
              <Fingerprint className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="text-[12px] font-medium">MFA-protected enterprise access</span>
            </div>
          </div>

          {/* Demo credentials */}
          <div className="mt-5 rounded-xl border border-gray-200 bg-white px-4 py-3.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                Demo Access
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-gray-500 font-mono">admin@sungrow.com</p>
                <p className="text-[13px] text-gray-400 font-mono">Admin@12345678</p>
              </div>
              <span className="text-[11px] text-gray-400 bg-gray-100 rounded-md px-2 py-1 font-medium">
                Admin role
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 flex items-center justify-between text-[11px] text-gray-400">
            <span>IMS Gen2 v0.1.0</span>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
