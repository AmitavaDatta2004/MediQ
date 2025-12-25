
'use client';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Patient, MedicineStore, User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import PatientProfileForm from '@/components/forms/patient-profile-form';
import MedicineStoreProfileForm from '@/components/forms/medicine-store-profile-form';


export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userRoleDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  
  const { data: userRole, isLoading: isRoleLoading } = useDoc<User>(userRoleDocRef);

  const patientDocRef = useMemoFirebase(() => {
    if (!user || userRole?.role !== 'patient') return null;
    return doc(firestore, 'patients', user.uid);
  }, [firestore, user, userRole]);
  const { data: patient, isLoading: isPatientLoading } = useDoc<Patient>(patientDocRef);

  const storeDocRef = useMemoFirebase(() => {
      if (!user || userRole?.role !== 'medicine_store') return null;
      return doc(firestore, 'medicine_stores', user.uid);
  }, [firestore, user, userRole]);
  const { data: store, isLoading: isStoreLoading } = useDoc<MedicineStore>(storeDocRef);


  const isLoading = isUserLoading || isRoleLoading || isPatientLoading || isStoreLoading;

  if (isLoading) {
    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-20 w-20 rounded-full" />
                        <Skeleton className="h-10 w-28" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Skeleton className="h-10 w-24" />
                </CardFooter>
            </Card>
        </div>
    )
  }

  if (userRole?.role === 'patient' && patient) {
      return <PatientProfileForm patient={patient} />;
  }

  if (userRole?.role === 'medicine_store' && store) {
      return <MedicineStoreProfileForm store={store} />;
  }
  
  if (userRole?.role === 'doctor') {
    // TODO: Build doctor profile form
    return <div>Doctor Profile Page - Coming Soon</div>
  }

  return <div>Could not load profile.</div>;
}
