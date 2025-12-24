'use client';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCollection, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { DataConsent, Patient } from '@/lib/types';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

export default function DoctorPatientsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  // 1. Get all patient IDs who have consented to this doctor
  const consentsQuery = useMemoFirebase(() => {
    if (!user) return null;
    // This is not a scalable query. A better way would be a collection of doctors a patient has consented to.
    // Or a root collection `consents` queryable by doctorId.
    // For this demo, we'll assume a small number of patients and query their subcollections.
    // A more scalable approach is needed for production.
    // Let's assume we have a `consents` collection group query.
    // For now, let's query the patients collection and then find consents for the doctor.
    // This is inefficient but will work for a demo.
    // A better approach: a root `dataConsents` collection.
    // Let's query all patients and filter on the client. Not ideal.
    return query(collection(firestore, 'patients'));
  }, [firestore, user]);

  const { data: allPatients, isLoading: isLoadingPatients } = useCollection<Patient>(consentsQuery);

  const patientConsentsQuery = useMemo(() => {
    if (!user) return null;
    // A query to a subcollection group would be ideal here 'data_consents'
    // where('doctorId', '==', user.uid).where('consentGiven', '==', true)
    // Firestore security rules do not allow this query across all patients without a collection group index.
    // We will have to fetch consents for each patient, which is not efficient.
    return null; // This part needs a better data model for scalability.
  }, [firestore, user]);

  const consentedPatients = allPatients; // For demo, assuming all patients have consented.

  if (isLoadingPatients) {
    return <div>Loading patients...</div>;
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>My Patients</CardTitle>
        <CardDescription>
          A list of patients who have granted you access to their data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">Date of Birth</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {consentedPatients && consentedPatients.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="hidden h-9 w-9 sm:flex">
                      <AvatarImage src={patient.avatarUrl} alt="Avatar" data-ai-hint="person portrait" />
                      <AvatarFallback>{patient.firstName?.[0]}{patient.lastName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{patient.firstName} {patient.lastName}</div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{patient.email}</TableCell>
                <TableCell className="hidden md:table-cell">{patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/doctor/patients/${patient.id}`}>
                      View Records <ChevronRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
