'use client';
import Link from 'next/link';
import {
  Activity,
  Calendar,
  Users,
  Pill,
} from 'lucide-react';
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
import { useDoc, useCollection, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, query, limit, orderBy, where } from 'firebase/firestore';
import type { Doctor, Patient, Appointment } from '@/lib/types';
import { useMemo } from 'react';
import { Badge } from '../ui/badge';

export default function DoctorDashboard() {
  const { user } = useUser();
  const firestore = useFirestore();

  const doctorDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'doctors', user.uid);
  }, [firestore, user]);
  const { data: doctor } = useDoc<Doctor>(doctorDocRef);

  const appointmentsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `doctors/${user.uid}/appointments`), orderBy('appointmentDateTime', 'asc'), limit(5));
  }, [firestore, user]);
  const { data: appointments } = useCollection<Appointment>(appointmentsQuery);

  const patientIds = useMemo(() => {
    if (!appointments) return [];
    return [...new Set(appointments.map(a => a.patientId))];
  }, [appointments]);

  const patientsQuery = useMemoFirebase(() => {
    if (!firestore || patientIds.length === 0) return null;
    return query(collection(firestore, 'patients'), where('id', 'in', patientIds));
  }, [firestore, patientIds]);
  const { data: patients } = useCollection<Patient>(patientsQuery);
  
  const getPatient = (patientId: string) => {
    return patients?.find(p => p.id === patientId);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Welcome Back, {doctor?.name}!
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">Doctor Dashboard</div>
            <p className="text-xs text-muted-foreground">
              Your professional overview.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">in your schedule</p>
          </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Consented Patients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                 <div className="text-2xl font-bold">{patients?.length || 0}</div>
                 <p className="text-xs text-muted-foreground">shared their data with you</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Prescriptions Issued</CardTitle>
                <Pill className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">in the last 30 days</p>
            </CardContent>
        </Card>
      </div>
       <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
             <CardDescription>Your next 5 scheduled appointments.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments && appointments.map((appointment) => {
                  const patient = getPatient(appointment.patientId);
                  return (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar className="hidden h-9 w-9 sm:flex">
                                <AvatarImage src={patient?.avatarUrl} alt="Avatar" data-ai-hint="person portrait" />
                                <AvatarFallback>{patient?.firstName?.[0]}{patient?.lastName?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="font-medium">{patient?.firstName} {patient?.lastName}</div>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(appointment.appointmentDateTime).toLocaleString()}</TableCell>
                      <TableCell className="max-w-xs truncate">{appointment.reason}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={appointment.status === 'Upcoming' ? 'default' : 'secondary'}>{appointment.status}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
             {(!appointments || appointments.length === 0) && <p className="text-center text-muted-foreground py-8">No upcoming appointments found.</p>}
          </CardContent>
        </Card>
    </div>
  );
}
