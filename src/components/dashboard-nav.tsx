'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HeartPulse,
  LayoutDashboard,
  FileScan,
  Stethoscope,
  Calendar,
  Pill,
  Truck,
  User,
  ShieldCheck,
  FolderKanban,
} from 'lucide-react';

import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Icons } from '@/components/icons';
import { Separator } from './ui/separator';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/records', icon: FolderKanban, label: 'My Records'},
  { href: '/dashboard/report-analysis', icon: FileScan, label: 'Report Analysis' },
  { href: '/dashboard/scan-analysis', icon: HeartPulse, label: 'Scan Analysis' },
  { href: '/dashboard/doctors', icon: Stethoscope, label: 'Find a Doctor' },
  { href: '/dashboard/appointments', icon: Calendar, label: 'Appointments' },
  { href: '/dashboard/prescriptions', icon: Pill, label: 'Prescriptions' },
  { href: '/dashboard/orders', icon: Truck, label: 'Medicine Orders' },
];

const bottomNavItems = [
    { href: '/dashboard/profile', icon: User, label: 'Profile' },
    { href: '/dashboard/consent', icon: ShieldCheck, label: 'Data Consent' },
]

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
          <Icons.logo className="w-8 h-8 text-primary" />
          <span className="text-lg font-semibold font-headline">MediQuest AI</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 mt-auto">
        <Separator className="my-2" />
         <SidebarMenu>
          {bottomNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
