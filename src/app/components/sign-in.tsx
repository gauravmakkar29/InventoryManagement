import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { useAuth } from "../../lib/use-auth";
import { cn } from "../../lib/utils";

interface SignInForm {
  email: string;
  password: string;
}

export function SignIn() {
  const { signIn, isAuthenticated } = useAuth();
  const navigate = useNavigate();
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
    <div className="flex min-h-screen items-center justify-center bg-[#0f172a]">
      <div className="w-full max-w-[400px] px-4">
        <div className="rounded-lg bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.12)]" role="main">
          {/* Logo */}
          <div className="mb-8 text-center">
            <h1 className="text-lg font-bold text-slate-900">
              IMS <span className="text-blue-600">Gen2</span>
            </h1>
            <p className="mt-1 text-[11px] text-slate-400">Hardware Lifecycle Management</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Email field */}
            <div className="space-y-1.5">
              <label
                htmlFor="signin-email"
                className="block text-[11px] font-medium text-slate-700"
              >
                Email address
              </label>
              <input
                id="signin-email"
                type="email"
                autoComplete="email"
                placeholder="admin@company.com"
                className={cn(
                  "block h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-400",
                  "transition-colors duration-150",
                  "focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
                  errors.email && "border-red-400 focus:border-red-500 focus:ring-red-500",
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
                className="block text-[11px] font-medium text-slate-700"
              >
                Password
              </label>
              <input
                id="signin-password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                className={cn(
                  "block h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-400",
                  "transition-colors duration-150",
                  "focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
                  errors.password && "border-red-400 focus:border-red-500 focus:ring-red-500",
                )}
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 1, message: "Password is required" },
                })}
              />
              {errors.password && (
                <p className="text-[11px] text-red-500" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "flex h-10 w-full cursor-pointer items-center justify-center rounded-md bg-blue-600 text-[13px] font-medium text-white",
                "transition-colors duration-150",
                "hover:bg-blue-700",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-[11px] text-slate-500">Powered by IMS Gen2 Platform</p>
      </div>
    </div>
  );
}
