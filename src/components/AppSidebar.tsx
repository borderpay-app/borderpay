import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Truck, Receipt, Users, UsersRound, ShieldAlert, FileText, History } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Overview", url: "/app", icon: LayoutDashboard, end: true },
  { title: "Transactions", url: "/app/transactions", icon: History, end: false },
  { title: "Suppliers", url: "/app/suppliers", icon: Truck, end: false },
  { title: "Taxes", url: "/app/taxes", icon: Receipt, end: false },
  { title: "Payroll", url: "/app/payroll", icon: Users, end: false },
  { title: "Team", url: "/app/team", icon: UsersRound, end: false },
  { title: "Monitoring", url: "/app/monitoring", icon: ShieldAlert, end: false },
  { title: "Website Content", url: "/app/website", icon: FileText, end: false },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = item.end ? pathname === item.url : pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink to={item.url} end={item.end} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
