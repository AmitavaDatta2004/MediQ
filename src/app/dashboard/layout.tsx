import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import { DashboardNav } from '@/components/dashboard-nav';
import { Header } from '@/components/header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <DashboardNav />
      </Sidebar>
      <SidebarInset className="bg-background min-h-screen">
        <div className="flex flex-col h-screen">
            <Header />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                {children}
            </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
