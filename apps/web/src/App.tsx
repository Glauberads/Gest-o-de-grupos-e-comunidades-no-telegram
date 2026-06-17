import { LoaderCircle } from "lucide-react";
import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./features/auth/use-auth";
import { AuthPage } from "./pages/auth-page";
import { AdminDashboardPage } from "./pages/admin-dashboard-page";
import { PublicCheckoutPage } from "./pages/public-checkout-page";

export function App() {
  const { loading, session } = useAuth();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-50">
        <LoaderCircle className="h-6 w-6 animate-spin" />
      </main>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/"
        element={session ? <AdminDashboardPage /> : <Navigate to="/auth" replace />}
      />
      <Route path="/c/:slug" element={<PublicCheckoutPage />} />
    </Routes>
  );
}
