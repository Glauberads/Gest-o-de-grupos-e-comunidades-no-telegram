import { LoaderCircle } from "lucide-react";
import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./features/auth/use-auth";
import { useOrganizations } from "./features/organizations/use-organizations";
import { AuthPage } from "./pages/auth-page";
import { CommunitiesPage } from "./pages/communities-page";
import { AdminDashboardPage } from "./pages/admin-dashboard-page";
import { ConnectBotPage } from "./pages/connect-bot-page";
import { PublicCheckoutPage } from "./pages/public-checkout-page";
import { SubscriptionPage } from "./pages/subscription-page";

export function App() {
  const { loading, session } = useAuth();
  const { organizations, loading: organizationsLoading } = useOrganizations();

  if (loading || (session && organizationsLoading)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-50">
        <LoaderCircle className="h-6 w-6 animate-spin" />
      </main>
    );
  }

  const organization = organizations[0];
  const organizationNeedsBilling =
    organization &&
    ["pending_payment", "overdue", "suspended", "cancelled"].includes(organization.status);

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/subscription"
        element={session ? <SubscriptionPage /> : <Navigate to="/auth" replace />}
      />
      <Route
        path="/"
        element={
          session ? (
            organizationNeedsBilling ? <Navigate to="/subscription" replace /> : <AdminDashboardPage />
          ) : (
            <Navigate to="/auth" replace />
          )
        }
      />
      <Route
        path="/telegram/connect"
        element={
          session ? (
            organizationNeedsBilling ? <Navigate to="/subscription" replace /> : <ConnectBotPage />
          ) : (
            <Navigate to="/auth" replace />
          )
        }
      />
      <Route
        path="/communities"
        element={
          session ? (
            organizationNeedsBilling ? <Navigate to="/subscription" replace /> : <CommunitiesPage />
          ) : (
            <Navigate to="/auth" replace />
          )
        }
      />
      <Route path="/c/:slug" element={<PublicCheckoutPage />} />
    </Routes>
  );
}
