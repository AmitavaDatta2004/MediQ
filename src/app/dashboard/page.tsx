'use client';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import PatientDashboard from '@/components/dashboards/patient-dashboard';
import DoctorDashboard from '@/components/dashboards/doctor-dashboard';
import MedicineStoreDashboard from '@/components/dashboards/medicine-store-dashboard';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
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
        <div className="flex flex-col gap-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-[125px] w-full" />
                <Skeleton className="h-[125px] w-full" />
                <Skeleton className="h-[125px] w-full" />
                <Skeleton className="h-[125px] w-full" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Skeleton className="lg:col-span-4 h-[350px]" />
                <Skeleton className="lg:col-span-3 h-[350px]" />
            </div>
        </div>
    );
  }

  switch (userRole?.role) {
    case 'patient':
      return <PatientDashboard />;
    case 'doctor':
      return <DoctorDashboard />;
    case 'medicine_store':
      return <MedicineStoreDashboard />;
    default:
      return <div>Invalid user role or not logged in.</div>;
  }
}
