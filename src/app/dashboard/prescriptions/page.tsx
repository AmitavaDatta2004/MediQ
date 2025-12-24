'use client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { useCollection, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Prescription, Doctor } from '@/lib/types';
import { useMemo } from 'react';

export default function PrescriptionsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const prescriptionsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/prescriptions`));
  }, [firestore, user]);

  const { data: prescriptions, isLoading } = useCollection<Prescription>(prescriptionsQuery);
  
  const doctorIds = useMemo(() => {
    if (!prescriptions) return [];
    return [...new Set(prescriptions.map(p => p.doctorId))];
  }, [prescriptions]);

  const doctorsQuery = useMemoFirebase(() => {
    if (!firestore || doctorIds.length === 0) return null;
    return query(collection(firestore, 'doctors'), where('id', 'in', doctorIds));
  }, [firestore, doctorIds]);

  const { data: doctors } = useCollection<Doctor>(doctorsQuery);

  const getDoctor = (doctorId: string) => {
    return doctors?.find(d => d.id === doctorId);
  }

  if (isLoading) {
    return <div>Loading prescriptions...</div>;
  }

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Your Prescriptions</h1>
            <p className="text-muted-foreground">Review your prescribed medications and place new orders.</p>
        </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {prescriptions && prescriptions.map((prescription) => {
          const doctor = getDoctor(prescription.doctorId);
          return (
            <Card key={prescription.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Prescription from Dr. {doctor?.lastName}</span>
                    <span className="text-sm font-normal text-muted-foreground">{new Date(prescription.date).toLocaleDateString()}</span>
                </CardTitle>
                <CardDescription>Prescribed by {doctor?.firstName} {doctor?.lastName}, {doctor?.specialty}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {prescription.medicines?.map((medicine, index) => (
                    <li key={index}>
                      <div className="font-semibold">{medicine.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {medicine.dosage} - {medicine.frequency}
                      </div>
                    </li>
                  ))}
                </ul>
                {prescription.notes && <div className="text-sm text-muted-foreground mt-4">Notes: {prescription.notes}</div>}
              </CardContent>
              <CardFooter className="flex justify-between">
                 <Button variant="ghost"><FileText className="mr-2 h-4 w-4" /> View Details</Button>
                <Button>Order Medicines</Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
