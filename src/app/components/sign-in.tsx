import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { Eye, EyeOff, AlertCircle, Shield, Fingerprint, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/use-auth";
import { cn } from "@/lib/utils";
import { MfaChallenge } from "./mfa-challenge";

interface SignInForm {
  email: string;
  password: string;
}

/* ─── Sun rays + energy particles overlay on photo ────────────────── */

function SolarOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;
    let lastFrameTime = 0;
    const FRAME_INTERVAL = 33; // ~30fps throttle (#317)

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

      // ─── Sun rays from top-right ───
      const sunX = w * 0.82;
      const sunY = h * 0.12;
      const rayCount = 32;

      for (let i = 0; i < rayCount; i++) {
        const angle = (i / rayCount) * Math.PI * 2;
        const pulse = Math.sin(time * 0.4 + i * 0.4) * 0.4 + 0.6;
        const length = 400 + Math.sin(time * 0.25 + i * 0.7) * 120;

        ctx.strokeStyle = `rgba(255, 200, 60, ${0.07 * pulse})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(sunX, sunY);
        ctx.lineTo(sunX + Math.cos(angle) * length, sunY + Math.sin(angle) * length);
        ctx.stroke();
      }

      // Sun glow
      const glowR = 80 + Math.sin(time * 0.5) * 15;
      const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, glowR);
      glow.addColorStop(0, "rgba(255, 200, 60, 0.2)");
      glow.addColorStop(0.4, "rgba(255, 160, 40, 0.08)");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, glowR, 0, Math.PI * 2);
      ctx.fill();

      // ─── Rising energy particles ───
      for (let i = 0; i < 16; i++) {
        const baseX = w * 0.05 + i * w * 0.06;
        const px = baseX + Math.sin(time * 0.4 + i * 1.3) * 15;
        const py = h - ((time * 25 + i * 70) % (h + 60)) + 30;
        const size = 2 + Math.sin(time * 0.8 + i) * 1;
        const fadeTop = py < h * 0.15 ? py / (h * 0.15) : 1;
        const fadeBottom = py > h * 0.85 ? (h - py) / (h * 0.15) : 1;
        const alpha = 0.25 * fadeTop * fadeBottom;

        if (alpha > 0.01) {
          ctx.fillStyle = `rgba(255, 180, 40, ${alpha})`;
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fill();

          // Tiny glow around each particle
          ctx.fillStyle = `rgba(255, 180, 40, ${alpha * 0.3})`;
          ctx.beginPath();
          ctx.arc(px, py, size * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ─── Subtle horizontal scan line (like energy flowing) ───
      const scanY = (time * 40) % h;
      const scanGrad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
      scanGrad.addColorStop(0, "transparent");
      scanGrad.addColorStop(0.5, "rgba(255, 160, 40, 0.04)");
      scanGrad.addColorStop(1, "transparent");
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 30, w, 60);

      time += 0.016; // adjusted for 30fps (#317)
    };

    const tick = (timestamp: number) => {
      if (timestamp - lastFrameTime >= FRAME_INTERVAL) {
        lastFrameTime = timestamp;
        draw();
      }
      animationId = requestAnimationFrame(tick);
    };

    animationId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-[2]" aria-hidden="true" />
  );
}

/* ─── Live metrics ticker ─────────────────────────────────────────── */

function MetricsTicker() {
  const [activeIndex, setActiveIndex] = useState(0);
  const metrics = [
    { value: "2,847", label: "Active Devices", trend: "+12 today" },
    { value: "99.7%", label: "System Uptime", trend: "Last 30 days" },
    { value: "96.4%", label: "Fleet Compliance", trend: "Across standards" },
    { value: "1.2 GW", label: "Power Managed", trend: "Real-time" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((i) => (i + 1) % metrics.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [metrics.length]);

  return (
    <div className="flex items-center gap-6">
      {metrics.map((m, i) => (
        <div
          key={m.label}
          className={cn(
            "transition-all duration-500 ease-out",
            i === activeIndex ? "opacity-100 scale-100" : "opacity-40 scale-[0.97]",
          )}
        >
          <p className="text-[22px] font-bold text-white tabular-nums tracking-tight">{m.value}</p>
          <p className="text-[12px] text-white/60 uppercase tracking-wider font-medium">
            {m.label}
          </p>
          {i === activeIndex && (
            <p className="text-[11px] text-orange-300 mt-0.5 font-medium">{m.trend}</p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Brand mark with pulse ───────────────────────────────────────── */

function BrandMark({ variant = "light" }: { variant?: "light" | "dark" }) {
  const isDark = variant === "dark";
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="4" fill="white" />
            <path
              d="M12 2v3M12 19v3M2 12h3M19 12h3"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.7"
            />
          </svg>
        </div>
        <div className="absolute inset-0 rounded-xl bg-orange-500/20 animate-ping [animation-duration:3s]" />
      </div>
      <div>
        <h1
          className={cn(
            "text-[20px] font-bold tracking-tight leading-none",
            isDark ? "text-gray-900" : "text-white",
          )}
        >
          IMS Gen<span className={isDark ? "text-orange-500" : "text-orange-300"}>2</span>
        </h1>
        <p
          className={cn(
            "text-[11px] tracking-[0.15em] uppercase font-medium mt-0.5",
            isDark ? "text-gray-400" : "text-white/50",
          )}
        >
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
    <div className="flex min-h-screen bg-white">
      {/* ─── Left panel: Solar farm photo + animated overlay ─── */}
      <div className="hidden lg:flex lg:w-[55%] flex-col justify-between relative overflow-hidden">
        {/* Background — solar energy gradient (no external image dependency) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-600"
        />

        {/* Light warm overlay — keeps it bright, not dark */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-orange-50/30 to-amber-900/40 z-[1]" />

        {/* Bottom gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/30 to-transparent z-[1]" />

        {/* Animated sun rays + energy particles */}
        <SolarOverlay />

        {/* Top: Brand + compliance */}
        <div className="relative z-10 p-10 flex items-start justify-between">
          <BrandMark />
          <div className="flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md border border-white/20 px-3.5 py-1.5">
            <Shield className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            <span className="text-[11px] font-medium text-white/90 tracking-wide">
              Enterprise Compliant
            </span>
          </div>
        </div>

        {/* Center: Hero */}
        <div className="relative z-10 px-10 flex-1 flex flex-col justify-end pb-6 max-w-xl">
          <div className="space-y-5">
            <div>
              <p className="text-[13px] font-semibold text-orange-300 uppercase tracking-[0.2em] mb-4">
                Enterprise Platform
              </p>
              <h2 className="text-[42px] font-bold text-white leading-[1.1] tracking-tight drop-shadow-sm">
                Powering the
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-amber-200">
                  Solar Revolution
                </span>
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-white/70 max-w-md">
                Manage inverters, track firmware deployments, enforce compliance, and monitor fleet
                health — all from one unified command center.
              </p>
            </div>

            {/* Capability pills */}
            <div className="flex flex-wrap gap-2">
              {["Device Inventory", "Firmware OTA", "Compliance Audit", "Fleet Analytics"].map(
                (label) => (
                  <div
                    key={label}
                    className="rounded-full bg-white/10 backdrop-blur-sm border border-white/15 px-3.5 py-1.5"
                  >
                    <span className="text-[12px] font-medium text-white/80">{label}</span>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>

        {/* Bottom: Live metrics */}
        <div className="relative z-10 p-10 pt-4">
          <div className="border-t border-white/10 pt-6">
            <MetricsTicker />
          </div>
        </div>
      </div>

      {/* ─── Right panel: Light sign-in form ─── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 lg:w-[45%] bg-[#f7f8fa]">
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
              <p className="mt-1.5 text-[15px] text-gray-500">Sign in to your management console</p>
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
                <div
                  className={cn(
                    "rounded-lg border transition-all duration-150",
                    focusedField === "email"
                      ? "border-orange-400 ring-[3px] ring-orange-500/10"
                      : "border-gray-200 hover:border-gray-300",
                    errors.email && "border-red-400 ring-[3px] ring-red-500/10",
                  )}
                >
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
                <div
                  className={cn(
                    "relative rounded-lg border transition-all duration-150",
                    focusedField === "password"
                      ? "border-orange-400 ring-[3px] ring-orange-500/10"
                      : "border-gray-200 hover:border-gray-300",
                    errors.password && "border-red-400 ring-[3px] ring-red-500/10",
                  )}
                >
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
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  <span className="flex items-center gap-1.5">
                    Sign in to Console
                    <ChevronRight
                      className="h-4 w-4 opacity-60 group-hover:translate-x-0.5 transition-transform"
                      aria-hidden="true"
                    />
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
