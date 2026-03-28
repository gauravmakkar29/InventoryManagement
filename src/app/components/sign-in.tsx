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
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 p-6">
        <div className="space-y-1 text-center">
          <h1 className="text-lg font-bold text-foreground">
            IMS <span className="text-accent">Gen2</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Inventory Management System
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-xs font-medium text-foreground"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="admin@example.com"
              className={cn(
                "block w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground",
                "focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent",
                errors.email && "border-danger"
              )}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email address",
                },
              })}
            />
            {errors.email && (
              <p className="text-xs text-danger">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-xs font-medium text-foreground"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter password"
              className={cn(
                "block w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground",
                "focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent",
                errors.password && "border-danger"
              )}
              {...register("password", {
                required: "Password is required",
                minLength: { value: 1, message: "Password is required" },
              })}
            />
            {errors.password && (
              <p className="text-xs text-danger">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "w-full rounded-sm bg-accent px-4 py-2 text-sm font-medium text-accent-foreground",
              "hover:bg-accent/90 disabled:opacity-50"
            )}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-[10px] text-muted-foreground">
          Mock auth — any email/password accepted
        </p>
      </div>
    </div>
  );
}
