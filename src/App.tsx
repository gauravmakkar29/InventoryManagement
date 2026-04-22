import { lazy, Suspense, type ReactNode } from "react";
import { Routes, Route, Navigate } from "react-router";
import { ErrorBoundary } from "./components/error-boundary";
import { RouteErrorBoundary } from "./components/route-error-boundary";
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
const DeviceDetailPage = lazy(() =>
  import("./app/components/inventory/device-detail-page").then((m) => ({
    default: m.DeviceDetailPage,
  })),
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
const FirmwareDetailPage = lazy(() =>
  import("./app/components/firmware/firmware-detail-page").then((m) => ({
    default: m.FirmwareDetailPage,
  })),
);
const FirmwareFamiliesTab = lazy(() =>
  import("./app/components/firmware/firmware-families").then((m) => ({
    default: m.FirmwareFamiliesTab,
  })),
);
const CustomerListPage = lazy(() =>
  import("./app/components/customers/customer-list-page").then((m) => ({
    default: m.CustomerListPage,
  })),
);
const CustomerDetailPage = lazy(() =>
  import("./app/components/customers/customer-detail-page").then((m) => ({
    default: m.CustomerDetailPage,
  })),
);

// ---------------------------------------------------------------------------
// Story 21.3: Route wrapper with per-route error boundary
// ---------------------------------------------------------------------------
function RouteElement({ name, children }: { name: string; children: ReactNode }) {
  return (
    <RouteErrorBoundary routeName={name}>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </RouteErrorBoundary>
  );
}

// ---------------------------------------------------------------------------
// App Router
// ---------------------------------------------------------------------------
export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<SignIn />} />
          <Route
            path="/download/:tokenGuid"
            element={
              <RouteElement name="secure-download">
                <SecureDownloadPage />
              </RouteElement>
            }
          />
          <Route element={<ProtectedLayout />}>
            <Route
              path="/"
              element={
                <RouteElement name="dashboard">
                  <Dashboard />
                </RouteElement>
              }
            />
            <Route
              path="/inventory"
              element={
                <RouteElement name="inventory">
                  <Inventory />
                </RouteElement>
              }
            />
            <Route
              path="/inventory/:deviceId"
              element={
                <RouteElement name="device-detail">
                  <DeviceDetailPage />
                </RouteElement>
              }
            />
            <Route
              path="/account-service"
              element={
                <RouteElement name="account-service">
                  <AccountService />
                </RouteElement>
              }
            />
            <Route
              path="/deployment"
              element={
                <RouteElement name="deployment">
                  <Deployment />
                </RouteElement>
              }
            />
            <Route
              path="/deployment/firmware/:firmwareId"
              element={
                <RouteElement name="firmware-detail">
                  <FirmwareDetailPage />
                </RouteElement>
              }
            />
            <Route
              path="/firmware"
              element={
                <RouteElement name="firmware-catalog">
                  <FirmwareFamiliesTab />
                </RouteElement>
              }
            />
            <Route
              path="/customers"
              element={
                <RouteElement name="customers">
                  <CustomerListPage />
                </RouteElement>
              }
            />
            <Route
              path="/customers/:customerId"
              element={
                <RouteElement name="customer-detail">
                  <CustomerDetailPage />
                </RouteElement>
              }
            />
            <Route
              path="/compliance"
              element={
                <RouteElement name="compliance">
                  <CompliancePage />
                </RouteElement>
              }
            />
            <Route
              path="/sbom"
              element={
                <RouteElement name="sbom">
                  <SBOMPage />
                </RouteElement>
              }
            />
            <Route
              path="/analytics"
              element={
                <RouteElement name="analytics">
                  <Analytics />
                </RouteElement>
              }
            />
            <Route
              path="/telemetry"
              element={
                <RouteElement name="telemetry">
                  <TelemetryHeatmapPage />
                </RouteElement>
              }
            />
            <Route
              path="/incidents"
              element={
                <RouteElement name="incidents">
                  <IncidentResponsePage />
                </RouteElement>
              }
            />
            <Route
              path="/digital-twin"
              element={
                <RouteElement name="digital-twin">
                  <DigitalTwinPage />
                </RouteElement>
              }
            />
            <Route
              path="/executive-summary"
              element={
                <RouteElement name="executive-summary">
                  <ExecutiveSummaryPage />
                </RouteElement>
              }
            />
            <Route
              path="/user-management"
              element={
                <RouteElement name="user-management">
                  <UserManagement />
                </RouteElement>
              }
            />
            <Route
              path="/access-denied"
              element={
                <RouteElement name="access-denied">
                  <AccessDenied />
                </RouteElement>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
