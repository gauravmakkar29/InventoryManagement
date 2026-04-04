import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router";
import { ErrorBoundary } from "./components/error-boundary";
import { ProtectedLayout } from "./app/components/layouts/protected-layout";
import { PageLoader } from "./app/components/page-loader";

// ---------------------------------------------------------------------------
// Lazy-loaded page components — each becomes its own chunk
// ---------------------------------------------------------------------------
const SignIn = lazy(() => import("./app/components/sign-in").then((m) => ({ default: m.SignIn })));
const Dashboard = lazy(() =>
  import("./app/components/dashboard/dashboard").then((m) => ({ default: m.Dashboard })),
);
const Inventory = lazy(() =>
  import("./app/components/inventory").then((m) => ({ default: m.Inventory })),
);
const AccountService = lazy(() =>
  import("./app/components/account-service").then((m) => ({ default: m.AccountService })),
);
const Deployment = lazy(() =>
  import("./app/components/deployment").then((m) => ({ default: m.Deployment })),
);
const CompliancePage = lazy(() =>
  import("./app/components/compliance").then((m) => ({ default: m.CompliancePage })),
);
const SBOMPage = lazy(() => import("./app/components/sbom").then((m) => ({ default: m.SBOMPage })));
const Analytics = lazy(() =>
  import("./app/components/analytics").then((m) => ({ default: m.Analytics })),
);
const TelemetryHeatmapPage = lazy(() =>
  import("./app/components/telemetry/telemetry-heatmap-page").then((m) => ({
    default: m.TelemetryHeatmapPage,
  })),
);
const IncidentResponsePage = lazy(() =>
  import("./app/components/incidents/incident-response-page").then((m) => ({
    default: m.IncidentResponsePage,
  })),
);
const DigitalTwinPage = lazy(() =>
  import("./app/components/digital-twin/digital-twin-page").then((m) => ({
    default: m.DigitalTwinPage,
  })),
);
const ExecutiveSummaryPage = lazy(() =>
  import("./app/components/executive/executive-summary-page").then((m) => ({
    default: m.ExecutiveSummaryPage,
  })),
);
const UserManagement = lazy(() =>
  import("./app/components/user-management").then((m) => ({ default: m.UserManagement })),
);
const AccessDenied = lazy(() =>
  import("./app/components/access-denied").then((m) => ({ default: m.AccessDenied })),
);
const SecureDownloadPage = lazy(() =>
  import("./app/components/firmware/secure-download-page").then((m) => ({
    default: m.SecureDownloadPage,
  })),
);

// ---------------------------------------------------------------------------
// App Router
// ---------------------------------------------------------------------------
export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<SignIn />} />
          {/* Secure download — outside ProtectedLayout; has own auth check (#358) */}
          <Route
            path="/download/:tokenGuid"
            element={
              <Suspense fallback={<PageLoader />}>
                <SecureDownloadPage />
              </Suspense>
            }
          />
          <Route element={<ProtectedLayout />}>
            <Route
              path="/"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Dashboard />
                </Suspense>
              }
            />
            <Route
              path="/inventory"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Inventory />
                </Suspense>
              }
            />
            <Route
              path="/account-service"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AccountService />
                </Suspense>
              }
            />
            <Route
              path="/deployment"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Deployment />
                </Suspense>
              }
            />
            <Route
              path="/compliance"
              element={
                <Suspense fallback={<PageLoader />}>
                  <CompliancePage />
                </Suspense>
              }
            />
            <Route
              path="/sbom"
              element={
                <Suspense fallback={<PageLoader />}>
                  <SBOMPage />
                </Suspense>
              }
            />
            <Route
              path="/analytics"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Analytics />
                </Suspense>
              }
            />
            <Route
              path="/telemetry"
              element={
                <Suspense fallback={<PageLoader />}>
                  <TelemetryHeatmapPage />
                </Suspense>
              }
            />
            <Route
              path="/incidents"
              element={
                <Suspense fallback={<PageLoader />}>
                  <IncidentResponsePage />
                </Suspense>
              }
            />
            <Route
              path="/digital-twin"
              element={
                <Suspense fallback={<PageLoader />}>
                  <DigitalTwinPage />
                </Suspense>
              }
            />
            <Route
              path="/executive-summary"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ExecutiveSummaryPage />
                </Suspense>
              }
            />
            <Route
              path="/user-management"
              element={
                <Suspense fallback={<PageLoader />}>
                  <UserManagement />
                </Suspense>
              }
            />
            <Route
              path="/access-denied"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AccessDenied />
                </Suspense>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
