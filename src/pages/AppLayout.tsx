import { Link, Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";

const AppLayout = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  }

  return (
    <>
      <Helmet>
        <title>Dashboard | Border Pay</title>
      </Helmet>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-16 border-b flex items-center px-4 gap-3">
              <SidebarTrigger />
              <Link to="/" className="flex items-center gap-2">
                <img src={logo} alt="Border Pay" className="h-8" />
                <span className="font-semibold hidden sm:inline">Border Pay</span>
              </Link>
              <div className="ml-auto flex items-center gap-3">
                {isAdmin && (
                  <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground">
                    Admin
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={signOut}>
                  Sign out
                </Button>
              </div>
            </header>
            <main className="flex-1 p-6 overflow-x-hidden">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
};

export default AppLayout;
