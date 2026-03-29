import { Routes, Route, Navigate } from "react-router";
import { ProtectedLayout } from "./app/components/layouts/protected-layout";
import { SignIn } from "./app/components/sign-in";
import { Dashboard } from "./app/components/dashboard";
import { Inventory } from "./app/components/inventory";
import { AccountService } from "./app/components/account-service";
import { Deployment } from "./app/components/deployment";
import { CompliancePage } from "./app/components/compliance";
import { Analytics } from "./app/components/analytics";
import { AccessDenied } from "./app/components/access-denied";
import { UserManagement } from "./app/components/user-management";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<SignIn />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/account-service" element={<AccountService />} />
        <Route path="/deployment" element={<Deployment />} />
        <Route path="/compliance" element={<CompliancePage />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/access-denied" element={<AccessDenied />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
