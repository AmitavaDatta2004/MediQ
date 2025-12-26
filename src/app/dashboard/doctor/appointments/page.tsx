'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { useCollection, useUser, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import type { Appointment, Patient } from '@/lib/types';
import { useMemo } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function DoctorAppointmentsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const appointmentsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `doctors/${user.uid}/appointments`), orderBy('appointmentDateTime', 'desc'));
  }, [firestore, user]);

  const { data: appointments, isLoading } = useCollection<Appointment>(appointmentsQuery);

  const patientIds = useMemo(() => {
    if (!appointments) return [];
    return [...new Set(appointments.map(a => a.patientId))];
  }, [appointments]);

  const { data: patients } = useCollection<Patient>(
    useMemoFirebase(() => {
      if (!firestore || patientIds.length === 0) return null;
      return query(collection(firestore, 'patients'), where('id', 'in', patientIds));
    }, [firestore, patientIds])
  );

  const getPatient = (patientId: string) => {
    return patients?.find(p => p.id === patientId);
  }
  
  const handleUpdateStatus = (appointment: Appointment, status: Appointment['status']) => {
    if (!user) return;
    const patientAppointmentRef = doc(firestore, `patients/${appointment.patientId}/appointments`, appointment.id);
    const doctorAppointmentRef = doc(firestore, `doctors/${user.uid}/appointments`, appointment.id);
    
    updateDocumentNonBlocking(patientAppointmentRef, { status });
    updateDocumentNonBlocking(doctorAppointmentRef, { status });

    toast({
        title: "Appointment Updated",
        description: `Appointment with ${getPatient(appointment.patientId)?.firstName} marked as ${status}.`
    });
  }

  const getStatusVariant = (status: Appointment['status']) => {
    switch (status) {
        case 'Upcoming':
            return 'default';
        case 'Completed':
            return 'secondary';
        case 'Cancelled':
            return 'destructive';
        case 'Pending':
            return 'outline';
        default:
            return 'outline';
    }
  }

  if (isLoading) {
    return <div>Loading appointments...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Appointments</CardTitle>
        <CardDescription>
          A log of your past and upcoming consultations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="hidden md:table-cell">Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments && appointments.map((appointment) => {
              const patient = getPatient(appointment.patientId);
              return (
                <TableRow key={appointment.id}>
                  <TableCell className="font-medium">
                    <Link href={`/dashboard/doctor/patients/${patient?.id}`}>
                      <div className="flex items-center gap-3 hover:underline">
                        <Avatar className="hidden h-9 w-9 sm:flex">
                          <AvatarImage src={patient?.avatarUrl} alt="Avatar" data-ai-hint="person portrait" />
                          <AvatarFallback>{patient?.firstName?.[0]}{patient?.lastName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-0.5">
                          <span className='font-medium'>{patient?.firstName} {patient?.lastName}</span>
                        </div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>{appointment.reason}</TableCell>
                  <TableCell className="hidden md:table-cell">{new Date(appointment.appointmentDateTime).toLocaleDateString()}</TableCell>

                  <TableCell className="hidden md:table-cell">{new Date(appointment.appointmentDateTime).toLocaleTimeString()}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(appointment.status)}>
                      {appointment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {appointment.status === 'Pending' && (
                        <div className="flex gap-2 justify-end">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleUpdateStatus(appointment, 'Upcoming')}>Accept</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(appointment, 'Cancelled')}>Decline</Button>
                        </div>
                    )}
                    {appointment.status === 'Upcoming' && (
                        <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(appointment, 'Completed')}>Mark as Completed</Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {(!appointments || appointments.length === 0) && (
            <div className="text-center p-8 text-muted-foreground">
                No appointments found.
            </div>
        )}
      </CardContent>
    </Card>
  );
}
