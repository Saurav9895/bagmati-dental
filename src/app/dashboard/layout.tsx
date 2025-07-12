'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/dashboard/logo';
import { LayoutDashboard, Calendar, Users, Settings, HeartPulse, CreditCard, Landmark, ChevronDown, LogOut } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/context/auth-context';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/schedule', label: 'Schedule', icon: Calendar },
  { href: '/dashboard/patients', label: 'Patients', icon: Users },
  { href: '/dashboard/treatments', label: 'Treatments', icon: HeartPulse },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
];

const accountingNavItems = [
    { href: '/dashboard/accounting/total-revenue', label: 'Total Revenue' },
    { href: '/dashboard/accounting/income', label: 'Income' },
    { href: '/dashboard/accounting/expenses', label: 'Expenses' },
];

const getTitleFromPathname = (pathname: string) => {
  if (pathname.startsWith('/dashboard/patients/') && pathname.split('/').length > 3) {
    return 'Patient Detail';
  }
  
  if(pathname === '/dashboard/settings') return 'Site Settings';
  if(pathname === '/dashboard/profile') return 'Profile';

  const mainNavItem = navItems.find((item) => item.href === pathname);
  if (mainNavItem) return mainNavItem.label;

  const accountingNavItem = accountingNavItems.find((item) => item.href === pathname);
  if (accountingNavItem) return accountingNavItem.label;
  
  if (pathname.startsWith('/dashboard/accounting')) return 'Accounting';

  return 'Dashboard';
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const pageTitle = getTitleFromPathname(pathname);
  const [isAccountingOpen, setIsAccountingOpen] = React.useState(pathname.startsWith('/dashboard/accounting'));

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };


  return (
    <AuthProvider>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader className="p-4">
            <Logo />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <a href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <Collapsible open={isAccountingOpen} onOpenChange={setIsAccountingOpen} className="w-full">
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                            isActive={pathname.startsWith('/dashboard/accounting')}
                            tooltip="Accounting"
                            className="!justify-between w-full"
                        >
                            <div className="flex items-center gap-2">
                                <Landmark />
                                <span>Accounting</span>
                            </div>
                            <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isAccountingOpen && "rotate-180")} />
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenuSub>
                            {accountingNavItems.map((item) => (
                                <SidebarMenuSubItem key={item.href}>
                                    <SidebarMenuSubButton asChild isActive={pathname === item.href}>
                                        <a href={item.href}>{item.label}</a>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            ))}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <SidebarMenu>
               <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
                    <LogOut/>
                    <span>Logout</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Site Settings" isActive={pathname === '/dashboard/settings'}>
                    <a href="/dashboard/settings">
                      <Settings/>
                      <span>Site Settings</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <DashboardHeader title={pageTitle} />
          <main className="flex-1 p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthProvider>
  );
}
