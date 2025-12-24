'use client';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import { DashboardNav } from '@/components/dashboard-nav';
import { Header } from '@/components/header';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userRoleDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  
  const { data: userRole, isLoading: isRoleLoading } = useDoc<User>(userRoleDocRef);

  const isLoading = isUserLoading || isRoleLoading;

  if (isLoading) {
    return (
        <div className="flex min-h-screen">
            <div className="w-64 border-r p-4 space-y-4">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
            <div className="flex-1 p-8">
                <Skeleton className="h-12 w-1/3 mb-8" />
                <Skeleton className="w-full h-[400px]" />
            </div>
        </div>
    )
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <DashboardNav userRole={userRole?.role} />
      </Sidebar>
      <SidebarInset className="bg-background min-h-screen">
        <div className="flex flex-col h-screen">
            <Header userRole={userRole?.role} />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                {children}
            </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
