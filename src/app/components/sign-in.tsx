import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { Eye, EyeOff, Check, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../lib/use-auth";
import { cn } from "../../lib/utils";
import { MfaChallenge } from "./mfa-challenge";

interface SignInForm {
  email: string;
  password: string;
  remember: boolean;
}

interface PasswordRule {
  label: string;
  test: (pw: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: "At least 12 characters", test: (pw) => pw.length >= 12 },
  { label: "One uppercase letter (A-Z)", test: (pw) => /[A-Z]/.test(pw) },
  { label: "One lowercase letter (a-z)", test: (pw) => /[a-z]/.test(pw) },
  { label: "One digit (0-9)", test: (pw) => /\d/.test(pw) },
  {
    label: "One symbol (!@#$%^&*)",
    test: (pw) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(pw),
  },
];

export function SignIn() {
  const { signIn, isAuthenticated, signInError, mfaRequired } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showPolicyHints, setShowPolicyHints] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignInForm>();

  const watchedPassword = watch("password", "");

  const policyResults = useMemo(
    () => PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(watchedPassword) })),
    [watchedPassword],
  );

  const allPoliciesMet = policyResults.every((r) => r.passed);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: SignInForm) => {
    try {
      await signIn(data.email, data.password);
      // If MFA is required, signIn won't throw but mfaRequired will be set
      // Navigation happens after MFA verification
      if (!mfaRequired) {
        navigate("/", { replace: true });
      }
    } catch (err) {
      // Check if it's a network error vs auth error
      if (err instanceof TypeError && err.message.includes("fetch")) {
        toast.error("Unable to connect. Check your network and try again.");
      }
      // Auth errors are shown inline via signInError state
    }
  };

  // Show MFA challenge screen
  if (mfaRequired) {
    return <MfaChallenge onSuccess={() => navigate("/", { replace: true })} />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Left 50%: Branding — white with geometric pattern */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center relative bg-white overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, #e5e7eb 0.8px, transparent 0)",
            backgroundSize: "28px 28px",
            opacity: 0.5,
          }}
        />
        <div className="relative z-10 text-center px-12 max-w-md">
          <h1 className="text-[32px] font-bold tracking-tight text-gray-900">
            IMS <span className="text-[#FF7900]">Gen2</span>
          </h1>
          <p className="mt-3 text-[16px] leading-relaxed text-gray-500">
            Hardware Lifecycle Management Platform
          </p>
          <div className="mt-8 flex items-center justify-center gap-2">
            <div className="h-px w-12 bg-gray-200" />
            <div className="h-1.5 w-1.5 rounded-full bg-[#FF7900]" />
            <div className="h-px w-12 bg-gray-200" />
          </div>
          <p className="mt-8 text-[13px] text-gray-500 max-w-xs mx-auto leading-relaxed">
            Enterprise device inventory, firmware deployment, compliance tracking & operational
            analytics.
          </p>
        </div>
      </div>

      {/* Right 50%: Form — light gray bg */}
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
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
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
                    onFocus={() => setShowPolicyHints(true)}
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

                {/* Password policy hints */}
                {showPolicyHints && watchedPassword.length > 0 && (
                  <ul className="mt-2 space-y-1" aria-label="Password requirements">
                    {policyResults.map((rule) => (
                      <li
                        key={rule.label}
                        className={cn(
                          "flex items-center gap-1.5 text-[11px]",
                          rule.passed ? "text-emerald-600" : "text-gray-500",
                        )}
                      >
                        {rule.passed ? (
                          <Check className="h-3 w-3 shrink-0" />
                        ) : (
                          <X className="h-3 w-3 shrink-0" />
                        )}
                        {rule.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-[#FF7900] accent-[#FF7900]"
                    {...register("remember")}
                  />
                  <span className="text-[13px] text-gray-600">Remember me</span>
                </label>
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
                disabled={isSubmitting || (watchedPassword.length > 0 && !allPoliciesMet)}
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
