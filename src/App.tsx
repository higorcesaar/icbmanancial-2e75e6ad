import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import Login from "./pages/Login";
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Members = lazy(() => import("./pages/Members"));
const Outfits = lazy(() => import("./pages/Outfits"));
const Accessories = lazy(() => import("./pages/Accessories"));
const Videos = lazy(() => import("./pages/Videos"));
const History = lazy(() => import("./pages/History"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 15_000 } },
});

function LoadingTab() {
  return (
    <div className="min-h-[30vh] flex flex-col items-center justify-center gap-3" role="status">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      <p className="text-sm text-muted-foreground">Carregando página...</p>
    </div>
  );
}


function ProtectedRoutes() {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <span className="text-4xl">🪷</span>
          <p className="text-muted-foreground text-sm">Preparando tudo com carinho...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <Suspense fallback={<LoadingTab />}>
      <Routes>
        <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="membros" element={isAdmin ? <Members /> : <Navigate to="/" replace />} />
        <Route path="roupas" element={<Outfits />} />
        <Route path="acessorios" element={<Accessories />} />
        <Route path="videos" element={<Videos />} />
        <Route path="historico" element={isAdmin ? <History /> : <Navigate to="/" replace />} />
        <Route path="usuarios" element={<UserManagement />} />
      </Route>
      <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster />
          <Sonner />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
