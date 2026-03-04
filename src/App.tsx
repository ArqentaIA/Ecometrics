import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { EcoMetricsProvider, useEcoMetrics } from "@/context/EcoMetricsContext";
import Login from "./pages/Login";
import DataCapture from "./pages/DataCapture";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

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
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <EcoMetricsProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </EcoMetricsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
