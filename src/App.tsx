import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import TermsAndConditions from "./pages/TermsAndConditions.tsx";
import Unsubscribe from "./pages/Unsubscribe.tsx";
import Contact from "./pages/Contact.tsx";
import Investors from "./pages/Investors.tsx";
import Blog from "./pages/Blog.tsx";
import BlogPost from "./pages/BlogPost.tsx";
import Auth from "./pages/Auth.tsx";
import AppDashboard from "./pages/AppDashboard.tsx";
import AppLayout from "./pages/AppLayout.tsx";
import Suppliers from "./pages/Suppliers.tsx";
import Taxes from "./pages/Taxes.tsx";
import Payroll from "./pages/Payroll.tsx";
import Team from "./pages/Team.tsx";
import Monitoring from "./pages/Monitoring.tsx";
import Admin from "./pages/Admin.tsx";
import MfaRecovery from "./pages/MfaRecovery.tsx";
import { AuthProvider } from "@/hooks/useAuth";
import { SolanaProvider } from "@/components/SolanaProvider";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <SolanaProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsAndConditions />} />
                <Route path="/unsubscribe" element={<Unsubscribe />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/investors" element={<Investors />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/mfa-recovery" element={<MfaRecovery />} />
                <Route path="/app" element={<AppLayout />}>
                  <Route index element={<AppDashboard />} />
                  <Route path="suppliers" element={<Suppliers />} />
                  <Route path="taxes" element={<Taxes />} />
                  <Route path="payroll" element={<Payroll />} />
                  <Route path="team" element={<Team />} />
                  <Route path="monitoring" element={<Monitoring />} />
                </Route>
                <Route path="/admin" element={<Admin />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SolanaProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
