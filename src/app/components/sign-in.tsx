import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../lib/use-auth";
import { cn } from "../../lib/utils";

interface SignInForm {
  email: string;
  password: string;
  remember: boolean;
}

export function SignIn() {
  const { signIn, isAuthenticated } = useAuth();
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
    await signIn(data.email, data.password);
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen">
      {/* Left 50%: Branding — white with geometric pattern */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center relative bg-white overflow-hidden">
        {/* Geometric dot pattern — subtle gray */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, #e5e7eb 0.8px, transparent 0)",
            backgroundSize: "28px 28px",
            opacity: 0.5,
          }}
        />

        {/* Content centered */}
        <div className="relative z-10 text-center px-12 max-w-md">
          <h1 className="text-[32px] font-bold tracking-tight text-gray-900">
            IMS <span className="text-[#FF7900]">Gen2</span>
          </h1>
          <p className="mt-3 text-[16px] leading-relaxed text-gray-500">
            Hardware Lifecycle Management Platform
          </p>

          {/* Decorative line accent */}
          <div className="mt-8 flex items-center justify-center gap-2">
            <div className="h-px w-12 bg-gray-200" />
            <div className="h-1.5 w-1.5 rounded-full bg-[#FF7900]" />
            <div className="h-px w-12 bg-gray-200" />
          </div>

          <p className="mt-8 text-[13px] text-gray-400 max-w-xs mx-auto leading-relaxed">
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
            {/* Heading */}
            <div className="mb-7">
              <h2 className="text-[24px] font-semibold text-gray-900">Sign in</h2>
              <p className="mt-1.5 text-[14px] text-gray-500">Enter your credentials to continue</p>
            </div>

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
                      minLength: { value: 1, message: "Password is required" },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
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
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-[11px] text-gray-400">IMS Gen2 Platform v0.1.0</p>
        </div>
      </div>
    </div>
  );
}
