import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { Eye, EyeOff, AlertCircle, Sun, Zap, Shield, BarChart3, Activity } from "lucide-react";
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
      {/* Left 50%: Solar energy branding panel with photo background */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-end justify-between relative overflow-hidden">
        {/* Background image — solar panels at golden hour */}
        <img
          src="https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200&q=80&auto=format"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Gradient overlay — bottom-heavy for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/70 to-[#0f172a]/30" />

        {/* Top: Logo badge */}
        <div className="relative z-10 w-full p-8">
          <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md px-4 py-2.5 border border-white/10">
            <Sun className="h-5 w-5 text-[#FF7900]" />
            <span className="text-[14px] font-bold text-white tracking-tight">
              IMS <span className="text-[#FF7900]">Gen2</span>
            </span>
          </div>
        </div>

        {/* Bottom: Branding content */}
        <div className="relative z-10 w-full p-8 pb-10">
          {/* Stats bar */}
          <div className="mb-6 flex items-center gap-4">
            {[
              { value: "2,847", label: "Devices" },
              { value: "96.4%", label: "Compliance" },
              { value: "94.2%", label: "Fleet Health" },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-2.5"
              >
                <p className="text-[18px] font-bold text-white tabular-nums">{value}</p>
                <p className="text-[11px] text-white/60">{label}</p>
              </div>
            ))}
          </div>

          <h1 className="text-[28px] font-bold tracking-tight text-white leading-tight">
            Hardware Lifecycle
            <br />
            Management Platform
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-white/70 max-w-sm">
            Enterprise device inventory, firmware deployment, compliance tracking & operational
            analytics — powered by solar intelligence.
          </p>

          {/* Feature pills */}
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { icon: Sun, label: "Solar Fleet" },
              { icon: Zap, label: "Firmware OTA" },
              { icon: Shield, label: "NIST 800-53" },
              { icon: BarChart3, label: "Analytics" },
              { icon: Activity, label: "Real-time" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 px-3 py-1.5"
              >
                <Icon className="h-3.5 w-3.5 text-[#FF7900]" />
                <span className="text-[11px] font-medium text-white/80">{label}</span>
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
