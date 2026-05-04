import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { EcoMetricsProvider, useEcoMetrics } from "@/context/EcoMetricsContext";
import Login from "./pages/Login";
import DataCapture from "./pages/DataCapture";
import Dashboard from "./pages/Dashboard";
import PublicDashboard from "./pages/PublicDashboard";
import AdminTokens from "./pages/AdminTokens";
import NotFound from "./pages/NotFound";
import Verificar from "./pages/Verificar";
import Registros from "./pages/Registros";
import TrackingDashboard from "./pages/TrackingDashboard";
import TrackingOperator from "./pages/TrackingOperator";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn } = useEcoMetrics();
  return isLoggedIn ? <>{children}</> : <Navigate to="/" replace />;
};

const AppRoutes = () => {
  const { isLoggedIn } = useEcoMetrics();
  return (
    <Routes>
      <Route path="/" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/capture" element={<ProtectedRoute><DataCapture /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/public-dashboard" element={<PublicDashboard />} />
      <Route path="/registros" element={<ProtectedRoute><Registros /></ProtectedRoute>} />
      <Route path="/admin/tokens" element={<ProtectedRoute><AdminTokens /></ProtectedRoute>} />
      <Route path="/verificar" element={<Verificar />} />
      <Route path="/tracking" element={<TrackingOperator />} />
      <Route path="/tracking-dashboard" element={<ProtectedRoute><TrackingDashboard /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <EcoMetricsProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </EcoMetricsProvider>
  </QueryClientProvider>
);

export default App;
