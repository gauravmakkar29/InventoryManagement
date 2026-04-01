import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { Eye, EyeOff, AlertCircle, Sun, Zap, Shield, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../lib/use-auth";
import { cn } from "../../lib/utils";
import { MfaChallenge } from "./mfa-challenge";

interface SignInForm {
  email: string;
  password: string;
}

export function SignIn() {
  const { signIn, isAuthenticated, signInError, mfaRequired } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
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
      {/* Left 50%: Solar-themed branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center relative bg-[#0f172a] overflow-hidden">
        {/* Animated gradient background */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse at 30% 20%, #FF7900 0%, transparent 50%), " +
              "radial-gradient(ellipse at 70% 80%, #2563eb 0%, transparent 50%)",
          }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), " +
              "linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Solar panel illustration (SVG) */}
        <div className="relative z-10 mb-10">
          <svg
            width="200"
            height="200"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Sun */}
            <circle cx="160" cy="40" r="24" fill="#FF7900" opacity="0.9" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <line
                key={angle}
                x1={160 + Math.cos((angle * Math.PI) / 180) * 30}
                y1={40 + Math.sin((angle * Math.PI) / 180) * 30}
                x2={160 + Math.cos((angle * Math.PI) / 180) * 38}
                y2={40 + Math.sin((angle * Math.PI) / 180) * 38}
                stroke="#FF7900"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.7"
              />
            ))}
            {/* Solar panel - angled rectangle */}
            <g transform="translate(30, 70) rotate(-15, 70, 60)">
              <rect
                x="10"
                y="20"
                width="120"
                height="80"
                rx="4"
                fill="#1e293b"
                stroke="#334155"
                strokeWidth="2"
              />
              {/* Panel grid cells */}
              {[0, 1, 2, 3].map((row) =>
                [0, 1, 2].map((col) => (
                  <rect
                    key={`${row}-${col}`}
                    x={16 + col * 38}
                    y={26 + row * 18}
                    width="34"
                    height="14"
                    rx="1"
                    fill="#2563eb"
                    opacity={0.6 + row * 0.1}
                  />
                )),
              )}
              {/* Panel stand */}
              <line x1="70" y1="100" x2="70" y2="130" stroke="#475569" strokeWidth="3" />
              <line
                x1="50"
                y1="130"
                x2="90"
                y2="130"
                stroke="#475569"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>
            {/* Energy flow dots */}
            {[0, 1, 2].map((i) => (
              <circle
                key={i}
                cx={140 - i * 15}
                cy={75 + i * 15}
                r="3"
                fill="#FF7900"
                opacity={0.9 - i * 0.25}
              >
                <animate
                  attributeName="opacity"
                  values="0.3;0.9;0.3"
                  dur="2s"
                  begin={`${i * 0.3}s`}
                  repeatCount="indefinite"
                />
              </circle>
            ))}
          </svg>
        </div>

        {/* Branding text */}
        <div className="relative z-10 text-center px-12 max-w-md">
          <h1 className="text-[32px] font-bold tracking-tight text-white">
            IMS <span className="text-[#FF7900]">Gen2</span>
          </h1>
          <p className="mt-3 text-[16px] leading-relaxed text-gray-400">
            Hardware Lifecycle Management Platform
          </p>

          <div className="mt-8 flex items-center justify-center gap-2">
            <div className="h-px w-12 bg-gray-700" />
            <div className="h-1.5 w-1.5 rounded-full bg-[#FF7900]" />
            <div className="h-px w-12 bg-gray-700" />
          </div>

          {/* Feature highlights */}
          <div className="mt-8 grid grid-cols-2 gap-4 text-left">
            {[
              { icon: Sun, label: "Solar Fleet Monitoring" },
              { icon: Zap, label: "Firmware Deployment" },
              { icon: Shield, label: "NIST 800-53 Compliance" },
              { icon: BarChart3, label: "Operational Analytics" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                  <Icon className="h-4 w-4 text-[#FF7900]" />
                </div>
                <span className="text-[12px] text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right 50%: Sign-in form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[#f9fafb] px-6 lg:w-1/2">
        <div className="w-full max-w-[400px]">
          {/* Mobile-only logo */}
          <div className="mb-8 lg:hidden text-center">
            <span className="text-[18px] font-bold text-gray-900">
              IMS <span className="text-[#FF7900]">Gen2</span>
            </span>
          </div>

          {/* Form card */}
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="mb-7">
              <h2 className="text-[24px] font-semibold text-gray-900">Sign in</h2>
              <p className="mt-1.5 text-[14px] text-gray-500">Enter your credentials to continue</p>
            </div>

            {/* Auth error banner */}
            {signInError && (
              <div
                className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
                role="alert"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
                <p className="text-[13px] leading-snug text-red-700">{signInError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* Email field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="signin-email"
                  className="block text-[13px] font-medium text-gray-700"
                >
                  Email address
                </label>
                <input
                  id="signin-email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@company.com"
                  className={cn(
                    "block h-11 w-full rounded-lg border border-gray-200 bg-white px-3.5 text-[14px] text-gray-900 placeholder:text-gray-400",
                    "focus:border-[#FF7900] focus:outline-none focus:ring-2 focus:ring-[#FF7900]/20",
                    errors.email && "border-red-400 focus:border-red-500 focus:ring-red-500/20",
                  )}
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Enter a valid email address",
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-[11px] text-red-500" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="signin-password"
                  className="block text-[13px] font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="signin-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className={cn(
                      "block h-11 w-full rounded-lg border border-gray-200 bg-white px-3.5 pr-10 text-[14px] text-gray-900 placeholder:text-gray-400",
                      "focus:border-[#FF7900] focus:outline-none focus:ring-2 focus:ring-[#FF7900]/20",
                      errors.password &&
                        "border-red-400 focus:border-red-500 focus:ring-red-500/20",
                    )}
                    {...register("password", {
                      required: "Password is required",
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600 cursor-pointer"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11px] text-red-500" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Forgot password */}
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  className="text-[13px] font-medium text-[#FF7900] hover:text-[#e66d00] cursor-pointer"
                  tabIndex={-1}
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "flex h-11 w-full cursor-pointer items-center justify-center rounded-lg bg-[#FF7900] text-[14px] font-semibold text-white",
                  "shadow-sm",
                  "hover:bg-[#e66d00]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7900] focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
            </form>

            {/* Demo credentials hint */}
            <div className="mt-5 rounded-lg bg-gray-50 px-4 py-3">
              <p className="text-[11px] font-medium text-gray-500 mb-1.5">Demo credentials</p>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                admin@company.com / Admin@12345678
              </p>
            </div>
          </div>

          <p className="mt-8 text-center text-[11px] text-gray-500">IMS Gen2 Platform v0.1.0</p>
        </div>
      </div>
    </div>
  );
}
