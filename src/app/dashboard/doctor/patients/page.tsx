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

  // 1. Get all consent documents directly from the doctor's subcollection.
  const consentsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, `doctors/${user.uid}/consented_patients`),
      where('consentGiven', '==', true)
    );
  }, [firestore, user]);

  const { data: consents, isLoading: isLoadingConsents } = useCollection<DataConsent>(consentsQuery);

  // 2. Extract unique patient IDs from the consents.
  const consentedPatientIds = useMemo(() => {
    if (!consents) return [];
    return [...new Set(consents.map(c => c.patientId))];
  }, [consents]);

  // 3. Fetch the profiles for only the consented patients.
  const patientsQuery = useMemoFirebase(() => {
    if (!firestore || consentedPatientIds.length === 0) return null;
    return query(collection(firestore, 'patients'), where('id', 'in', consentedPatientIds));
  }, [firestore, consentedPatientIds]);

  const { data: consentedPatients, isLoading: isLoadingPatients } = useCollection<Patient>(patientsQuery);

  const isLoading = isLoadingConsents || isLoadingPatients;

  if (isLoading) {
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
            {consentedPatients && consentedPatients.length > 0 ? (
              consentedPatients.map((patient) => (
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
              ))
            ) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        No patients have granted you access yet.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
