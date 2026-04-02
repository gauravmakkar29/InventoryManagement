import { ShieldX } from "lucide-react";
import { Link } from "react-router";

export function AccessDenied() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
        <ShieldX className="h-8 w-8 text-red-500" />
      </div>
      <h1 className="text-[20px] font-semibold text-foreground">Access Denied</h1>
      <p className="max-w-sm text-center text-[15px] text-muted-foreground">
        You don't have permission to view this page. Contact your administrator if you believe this
        is an error.
      </p>
      <Link
        to="/"
        className="mt-2 rounded-lg bg-accent px-5 py-2.5 text-[15px] font-medium text-white hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
