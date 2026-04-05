/**
 * IMS Gen 2 — Route-level Error Boundary (Story 21.3)
 *
 * Wraps individual page routes so a crash in one page doesn't
 * take down the entire app (sidebar, nav, header stay intact).
 * Users can retry or navigate away without losing context.
 */

import { Component, type ErrorInfo, type ReactNode } from "react";
import { logger } from "../lib/logger";

interface Props {
  children: ReactNode;
  routeName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(`Route crash [${this.props.routeName ?? "unknown"}]: ${error.message}`, {
      action: "route_crash",
      resourceType: "route",
      resourceId: this.props.routeName,
      error: {
        code: "ROUTE_ERROR_BOUNDARY",
        stack: error.stack,
      },
    });
    logger.addBreadcrumb(
      "route-error-boundary",
      `componentStack: ${errorInfo.componentStack?.slice(0, 200) ?? "unknown"}`,
      "error",
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              This page encountered an error
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {this.state.error?.message ?? "An unexpected error occurred"}
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 cursor-pointer"
              >
                Try again
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = "/";
                }}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted cursor-pointer"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
