import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";

import PublicLayout from "@/components/public/PublicLayout";
import Index from "./pages/Index";
import About from "./pages/About";
import AvailableCorners from "./pages/AvailableCorners";
import PublicCompanies from "./pages/PublicCompanies";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import CompanyLogin from "./pages/companies/CompanyLogin";
import CompanyRegister from "./pages/companies/CompanyRegister";
import CompanyDashboard from "./pages/companies/CompanyDashboard";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public pages with shared layout */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/available-corners" element={<AvailableCorners />} />
              <Route path="/public-companies" element={<PublicCompanies />} />
            </Route>

            {/* Auth pages */}
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Company portal */}
            <Route path="/companies" element={<CompanyDashboard />} />
            <Route path="/companies/" element={<CompanyDashboard />} />
            <Route path="/companies/login" element={<CompanyLogin />} />
            <Route path="/companies/register" element={<CompanyRegister />} />
            <Route path="/companies/dashboard" element={<CompanyDashboard />} />

            {/* Admin portal */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
