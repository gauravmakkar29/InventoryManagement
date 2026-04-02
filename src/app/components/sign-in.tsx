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

/* ─── Sun rays + solar grid on light background ───────────────────── */

function SolarCanvas() {
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

      // ─── Sun rays emanating from top-right corner ───
      const sunX = w * 0.85;
      const sunY = h * 0.08;
      const rayCount = 24;

      for (let i = 0; i < rayCount; i++) {
        const angle = (i / rayCount) * Math.PI * 2;
        const pulse = Math.sin(time * 0.5 + i * 0.5) * 0.3 + 0.7;
        const length = 300 + Math.sin(time * 0.3 + i * 0.8) * 80;

        ctx.strokeStyle = `rgba(255, 160, 40, ${0.04 * pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sunX, sunY);
        ctx.lineTo(
          sunX + Math.cos(angle) * length,
          sunY + Math.sin(angle) * length,
        );
        ctx.stroke();
      }

      // Sun glow
      const glowRadius = 60 + Math.sin(time * 0.6) * 10;
      const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, glowRadius);
      glow.addColorStop(0, "rgba(255, 160, 40, 0.12)");
      glow.addColorStop(0.5, "rgba(255, 121, 0, 0.04)");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // ─── Solar panel grid (bottom half) ───
      const gridStartY = h * 0.52;
      const gridH = h * 0.35;
      const cols = 16;
      const rows = 6;
      const cellW = (w * 0.7) / cols;
      const cellH = gridH / rows;
      const gridStartX = w * 0.08;

      // Perspective tilt effect
      for (let j = 0; j <= rows; j++) {
        const y = gridStartY + j * cellH;
        const perspective = 1 - j * 0.03;
        const offsetX = j * 8;
        ctx.strokeStyle = `rgba(255, 121, 0, ${0.08 * perspective})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(gridStartX + offsetX, y);
        ctx.lineTo(gridStartX + cols * cellW - offsetX, y);
        ctx.stroke();
      }

      for (let i = 0; i <= cols; i++) {
        const x = gridStartX + i * cellW;
        ctx.strokeStyle = "rgba(255, 121, 0, 0.06)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x + rows * 8, gridStartY);
        ctx.lineTo(x, gridStartY + gridH);
        ctx.stroke();
      }

      // Pulsing solar cells
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const wave = Math.sin(time * 0.8 + i * 0.4 + j * 0.6);
          if (wave > 0.3) {
            const alpha = (wave - 0.3) * 0.06;
            const offsetX = j * 8;
            const x = gridStartX + i * cellW + offsetX;
            const y = gridStartY + j * cellH;
            ctx.fillStyle = `rgba(255, 121, 0, ${alpha})`;
            ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
          }
        }
      }

      // ─── Floating energy particles (rising upward like solar energy) ───
      for (let i = 0; i < 12; i++) {
        const baseX = w * 0.1 + (i * w * 0.07);
        const px = baseX + Math.sin(time * 0.5 + i * 1.5) * 20;
        const py = h - ((time * 30 + i * 80) % (h + 40)) + 20;
        const size = 1.5 + Math.sin(time + i) * 0.8;
        const alpha = Math.max(0, 0.15 - (py < h * 0.2 ? (h * 0.2 - py) * 0.003 : 0));
        ctx.fillStyle = `rgba(255, 150, 30, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // ─── Solar inverter silhouettes ───
      const drawInverter = (x: number, y: number, scale: number, opacity: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.fillStyle = `rgba(255, 121, 0, ${opacity})`;
        // Box body
        ctx.fillRect(-15, -20, 30, 40);
        // Screen
        ctx.fillStyle = `rgba(255, 180, 60, ${opacity * 0.6})`;
        ctx.fillRect(-10, -14, 20, 12);
        // LED dots
        ctx.fillStyle = `rgba(100, 220, 100, ${opacity * 0.8})`;
        ctx.beginPath();
        ctx.arc(-5, 10, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 180, 60, ${opacity * 0.6})`;
        ctx.beginPath();
        ctx.arc(5, 10, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      drawInverter(w * 0.15, h * 0.42, 0.8, 0.06);
      drawInverter(w * 0.38, h * 0.38, 1.0, 0.08);
      drawInverter(w * 0.62, h * 0.44, 0.7, 0.05);

      time += 0.012;
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
          <p className="text-[22px] font-bold text-gray-900 tabular-nums tracking-tight">{m.value}</p>
          <p className="text-[12px] text-gray-400 uppercase tracking-wider font-medium">{m.label}</p>
          {i === activeIndex && (
            <p className="text-[11px] text-orange-500 mt-0.5 font-medium">{m.trend}</p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Brand mark with pulse ───────────────────────────────────────── */

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="4" fill="white" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <path d="M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          </svg>
        </div>
        <div className="absolute inset-0 rounded-xl bg-orange-500/20 animate-ping" style={{ animationDuration: "3s" }} />
      </div>
      <div>
        <h1 className="text-[20px] font-bold text-gray-900 tracking-tight leading-none">
          IMS Gen<span className="text-orange-500">2</span>
        </h1>
        <p className="text-[11px] text-gray-400 tracking-[0.15em] uppercase font-medium mt-0.5">
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
      {/* ─── Left panel: Light solar brand experience ─── */}
      <div className="hidden lg:flex lg:w-[55%] flex-col justify-between relative overflow-hidden bg-gradient-to-br from-orange-50/80 via-white to-amber-50/50">
        {/* Warm ambient glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(255,160,40,0.1)_0%,transparent_70%)]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(255,121,0,0.06)_0%,transparent_70%)]" />

        {/* Canvas: sun rays + solar grid + inverters + particles */}
        <SolarCanvas />

        {/* Top: Brand + compliance */}
        <div className="relative z-10 p-10 flex items-start justify-between">
          <BrandMark />
          <div className="flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-sm border border-orange-100 px-3.5 py-1.5 shadow-sm">
            <Shield className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
            <span className="text-[11px] font-medium text-gray-600 tracking-wide">
              Enterprise Compliant
            </span>
          </div>
        </div>

        {/* Center: Hero */}
        <div className="relative z-10 px-10 flex-1 flex flex-col justify-center max-w-xl">
          <div className="space-y-6">
            <div>
              <p className="text-[13px] font-semibold text-orange-500 uppercase tracking-[0.2em] mb-4">
                Enterprise Platform
              </p>
              <h2 className="text-[42px] font-bold text-gray-900 leading-[1.1] tracking-tight">
                Powering the
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
                  Solar Revolution
                </span>
              </h2>
              <p className="mt-5 text-[16px] leading-relaxed text-gray-500 max-w-md">
                Manage inverters, track firmware deployments, enforce compliance,
                and monitor fleet health — all from one unified command center.
              </p>
            </div>

            {/* Capability cards */}
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
                      ? "border-orange-200 bg-orange-50/80 shadow-sm"
                      : "border-gray-100 bg-white/60 hover:border-orange-100",
                  )}
                >
                  <span className={cn(
                    "text-[11px] font-bold tabular-nums",
                    cap.active ? "text-orange-500" : "text-gray-300",
                  )}>
                    {cap.num}
                  </span>
                  <span className={cn(
                    "text-[13px] font-medium",
                    cap.active ? "text-gray-800" : "text-gray-400",
                  )}>
                    {cap.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom: Live metrics ticker */}
        <div className="relative z-10 p-10 pt-0">
          <div className="border-t border-orange-100/60 pt-8">
            <MetricsTicker />
          </div>
        </div>
      </div>

      {/* ─── Right panel: Light sign-in form ─── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 lg:w-[45%] bg-[#f7f8fa]">
        <div className="w-full max-w-[400px]">
          {/* Mobile brand */}
          <div className="mb-10 lg:hidden">
            <BrandMark />
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
                <label htmlFor="signin-email" className="block text-[13px] font-medium text-gray-700">
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
                  <label htmlFor="signin-password" className="block text-[13px] font-medium text-gray-700">
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
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  <span className="flex items-center gap-1.5">
                    Sign in to Console
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
              <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Demo Access</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-gray-500 font-mono">admin@sungrow.com</p>
                <p className="text-[13px] text-gray-400 font-mono">Admin@12345678</p>
              </div>
              <span className="text-[11px] text-gray-400 bg-gray-100 rounded-md px-2 py-1 font-medium">Admin role</span>
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
