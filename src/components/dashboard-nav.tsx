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
  Users,
  Store,
  Notebook,
  ClipboardPlus,
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
import type { UserRole } from '@/lib/types';

const patientNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/inventory', icon: ClipboardPlus, label: 'Health Inventory'},
  { href: '/dashboard/report-analysis', icon: FileScan, label: 'Report Analysis' },
  { href: '/dashboard/scan-analysis', icon: HeartPulse, label: 'Scan Analysis' },
  { href: '/dashboard/doctors', icon: Stethoscope, label: 'Find a Doctor' },
  { href: '/dashboard/appointments', icon: Calendar, label: 'Appointments' },
  { href: '/dashboard/prescriptions', icon: Pill, label: 'Prescriptions' },
  { href: '/dashboard/orders', icon: Truck, label: 'Medicine Orders' },
];

const patientBottomNavItems = [
    { href: '/dashboard/profile', icon: User, label: 'Profile' },
    { href: '/dashboard/consent', icon: ShieldCheck, label: 'Data Consent' },
];

const doctorNavItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/doctor/appointments', icon: Calendar, label: 'Appointments' },
    { href: '/dashboard/doctor/patients', icon: Users, label: 'My Patients' },
];

const doctorBottomNavItems = [
    { href: '/dashboard/profile', icon: User, label: 'Profile' },
]

const storeNavItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/store/orders', icon: Notebook, label: 'Incoming Orders' },
    { href: '/dashboard/store/inventory', icon: Store, label: 'Inventory' },
]

const storeBottomNavItems = [
    { href: '/dashboard/profile', icon: User, label: 'Profile' },
]

export function DashboardNav({ userRole }: { userRole?: UserRole }) {
  const pathname = usePathname();

  let navItems = patientNavItems;
  let bottomNavItems = patientBottomNavItems;
  let title = "MediQuest AI";

  if (userRole === 'doctor') {
    navItems = doctorNavItems;
    bottomNavItems = doctorBottomNavItems;
    title = "Doctor Portal";
  } else if (userRole === 'medicine_store') {
    navItems = storeNavItems;
    bottomNavItems = storeBottomNavItems;
    title = "Pharmacy Portal";
  }


  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
          <Icons.logo className="w-8 h-8 text-primary" />
          <span className="text-lg font-semibold font-headline">{title}</span>
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
