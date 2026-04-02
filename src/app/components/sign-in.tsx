import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { Eye, EyeOff, AlertCircle, Shield, Fingerprint } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/use-auth";
import { cn } from "@/lib/utils";
import { MfaChallenge } from "./mfa-challenge";

interface SignInForm {
  email: string;
  password: string;
}

/* ─── Animated solar grid background ──────────────────────────────── */

function SolarGrid() {
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

      // Perspective grid lines
      const cols = 24;
      const rows = 16;
      const cellW = w / cols;
      const cellH = h / rows;

      for (let i = 0; i <= cols; i++) {
        const x = i * cellW;
        const pulse = Math.sin(time * 0.8 + i * 0.3) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(255, 121, 0, ${0.06 * pulse})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      for (let j = 0; j <= rows; j++) {
        const y = j * cellH;
        const pulse = Math.sin(time * 0.6 + j * 0.4) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(255, 121, 0, ${0.06 * pulse})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Glowing intersection nodes
      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const wave = Math.sin(time + i * 0.5 + j * 0.7);
          if (wave > 0.6) {
            const x = i * cellW;
            const y = j * cellH;
            const alpha = (wave - 0.6) * 1.2;
            const radius = 1.5 + alpha * 1.5;
            ctx.fillStyle = `rgba(255, 121, 0, ${alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Floating energy particles
      for (let i = 0; i < 8; i++) {
        const px = ((time * 20 + i * 200) % (w + 100)) - 50;
        const py = h * 0.3 + Math.sin(time * 0.5 + i * 2) * h * 0.25;
        const size = 2 + Math.sin(time + i) * 1;
        ctx.fillStyle = `rgba(255, 121, 0, ${0.15 + Math.sin(time + i) * 0.1})`;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }

      time += 0.012;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    />
  );
}

/* ─── Live metrics ticker ─────────────────────────────────────────── */

function MetricsTicker() {
  const [activeIndex, setActiveIndex] = useState(0);
  const metrics = [
    { value: "2,847", label: "Active Devices", trend: "+12 today" },
    { value: "99.7%", label: "System Uptime", trend: "Last 30 days" },
    { value: "96.4%", label: "Fleet Compliance", trend: "NIST 800-53" },
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
          <p className="text-[12px] text-white/50 uppercase tracking-wider font-medium">{m.label}</p>
          {i === activeIndex && (
            <p className="text-[11px] text-orange-400/80 mt-0.5 font-medium">{m.trend}</p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Sungrow-style brand mark ────────────────────────────────────── */

function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Solar cell icon — represents photovoltaic technology */}
      <div className="relative">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="4" fill="white" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <path d="M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          </svg>
        </div>
        {/* Pulse ring */}
        <div className="absolute inset-0 rounded-xl bg-orange-500/20 animate-ping" style={{ animationDuration: "3s" }} />
      </div>
      <div>
        <h1 className="text-[20px] font-bold text-white tracking-tight leading-none">
          IMS Gen<span className="text-orange-400">2</span>
        </h1>
        <p className="text-[11px] text-white/40 tracking-[0.15em] uppercase font-medium mt-0.5">
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
    <div className="flex min-h-screen bg-[#060b18]">
      {/* ─── Left panel: Immersive brand experience ─── */}
      <div className="hidden lg:flex lg:w-[55%] flex-col justify-between relative overflow-hidden">
        {/* Deep space background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_40%,rgba(255,121,0,0.08),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_80%,rgba(255,121,0,0.04),transparent_60%)]" />

        {/* Animated solar grid */}
        <SolarGrid />

        {/* Top: Brand mark + security badge */}
        <div className="relative z-10 p-10 flex items-start justify-between">
          <BrandMark />
          <div className="flex items-center gap-2 rounded-full bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] px-3.5 py-1.5">
            <Shield className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            <span className="text-[11px] font-medium text-emerald-400/90 tracking-wide">
              NIST 800-53 COMPLIANT
            </span>
          </div>
        </div>

        {/* Center: Hero messaging */}
        <div className="relative z-10 px-10 flex-1 flex flex-col justify-center max-w-xl">
          <div className="space-y-6">
            <div>
              <p className="text-[13px] font-semibold text-orange-400/90 uppercase tracking-[0.2em] mb-4">
                Enterprise Platform
              </p>
              <h2 className="text-[42px] font-bold text-white leading-[1.1] tracking-tight">
                Powering the
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-300">
                  Solar Revolution
                </span>
              </h2>
              <p className="mt-5 text-[16px] leading-relaxed text-white/50 max-w-md">
                Manage inverters, track firmware deployments, enforce compliance,
                and monitor fleet health — all from one unified command center.
              </p>
            </div>

            {/* Capability indicators */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                { num: "01", label: "Device Inventory & Tracking", active: true },
                { num: "02", label: "Firmware OTA Deployment" },
                { num: "03", label: "Compliance & SBOM Audit" },
                { num: "04", label: "Real-time Fleet Analytics" },
              ].map((cap) => (
                <div
                  key={cap.num}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 border transition-colors duration-300",
                    cap.active
                      ? "border-orange-500/30 bg-orange-500/[0.06]"
                      : "border-white/[0.04] bg-white/[0.02] hover:border-white/[0.08]",
                  )}
                >
                  <span className={cn(
                    "text-[11px] font-bold tabular-nums",
                    cap.active ? "text-orange-400" : "text-white/20",
                  )}>
                    {cap.num}
                  </span>
                  <span className={cn(
                    "text-[13px] font-medium",
                    cap.active ? "text-white/90" : "text-white/40",
                  )}>
                    {cap.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom: Live metrics */}
        <div className="relative z-10 p-10 pt-0">
          <div className="border-t border-white/[0.06] pt-8">
            <MetricsTicker />
          </div>
        </div>
      </div>

      {/* ─── Right panel: Sign-in form ─── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 lg:w-[45%] relative">
        {/* Subtle radial glow behind form */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,rgba(255,121,0,0.03),transparent_70%)]" />

        <div className="w-full max-w-[420px] relative z-10">
          {/* Mobile-only brand */}
          <div className="mb-10 lg:hidden">
            <BrandMark />
          </div>

          {/* Form container */}
          <div className="space-y-8">
            {/* Welcome text */}
            <div>
              <h2 className="text-[28px] font-bold text-white tracking-tight">
                Welcome back
              </h2>
              <p className="mt-2 text-[15px] text-white/40">
                Sign in to your management console
              </p>
            </div>

            {/* Auth error banner */}
            {signInError && (
              <div
                className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3.5"
                role="alert"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
                <p className="text-[14px] leading-snug text-red-300">{signInError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* Email */}
              <div className="space-y-2">
                <label
                  htmlFor="signin-email"
                  className="block text-[13px] font-medium text-white/60 uppercase tracking-wider"
                >
                  Email
                </label>
                <div className={cn(
                  "relative rounded-xl border transition-all duration-200",
                  focusedField === "email"
                    ? "border-orange-500/50 shadow-[0_0_0_3px_rgba(255,121,0,0.08)]"
                    : "border-white/[0.08] hover:border-white/[0.15]",
                  errors.email && "border-red-500/50",
                )}>
                  <input
                    id="signin-email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@sungrow.com"
                    aria-describedby={errors.email ? "signin-email-error" : undefined}
                    aria-invalid={errors.email ? true : undefined}
                    className="block h-12 w-full rounded-xl bg-white/[0.03] px-4 text-[15px] text-white placeholder:text-white/20 focus:outline-none"
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
                  <p id="signin-email-error" className="text-[13px] text-red-400 mt-1" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="signin-password"
                    className="block text-[13px] font-medium text-white/60 uppercase tracking-wider"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-[13px] font-medium text-orange-400/80 hover:text-orange-400 transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className={cn(
                  "relative rounded-xl border transition-all duration-200",
                  focusedField === "password"
                    ? "border-orange-500/50 shadow-[0_0_0_3px_rgba(255,121,0,0.08)]"
                    : "border-white/[0.08] hover:border-white/[0.15]",
                  errors.password && "border-red-500/50",
                )}>
                  <input
                    id="signin-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    aria-describedby={errors.password ? "signin-password-error" : undefined}
                    aria-invalid={errors.password ? true : undefined}
                    className="block h-12 w-full rounded-xl bg-white/[0.03] px-4 pr-11 text-[15px] text-white placeholder:text-white/20 focus:outline-none"
                    {...register("password", {
                      required: "Password is required",
                      onBlur: () => setFocusedField(null),
                    })}
                    onFocus={() => setFocusedField("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4.5 w-4.5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4.5 w-4.5" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p id="signin-password-error" className="text-[13px] text-red-400 mt-1" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Sign in button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "relative flex h-12 w-full items-center justify-center rounded-xl text-[15px] font-semibold text-white cursor-pointer",
                  "bg-gradient-to-r from-orange-600 to-orange-500",
                  "shadow-lg shadow-orange-500/20",
                  "hover:shadow-xl hover:shadow-orange-500/30 hover:from-orange-500 hover:to-orange-400",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060b18]",
                  "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
                  "transition-all duration-200",
                )}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  "Sign in to Console"
                )}
              </button>
            </form>

            {/* MFA indicator */}
            <div className="flex items-center justify-center gap-2 text-white/25">
              <Fingerprint className="h-4 w-4" aria-hidden="true" />
              <span className="text-[12px] font-medium">MFA-protected access</span>
            </div>

            {/* Demo credentials */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="h-1 w-1 rounded-full bg-emerald-400" />
                <p className="text-[12px] font-semibold text-white/50 uppercase tracking-wider">
                  Demo Access
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[13px] text-white/30 font-mono">
                  admin@sungrow.com
                </p>
                <p className="text-[13px] text-white/30 font-mono">
                  Admin@12345678
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 flex items-center justify-between text-[11px] text-white/20">
            <span>IMS Gen2 Platform v0.1.0</span>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
