'use client';
import { MoreHorizontal } from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCollection, useUser, useFirestore, useMemoFirebase, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, getDocs } from 'firebase/firestore';
import type { Appointment, Doctor } from '@/lib/types';
import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { PlusCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AppointmentsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isBooking, setIsBooking] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [appointmentReason, setAppointmentReason] = useState('');
  const [appointmentDateTime, setAppointmentDateTime] = useState('');

  const appointmentsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `patients/${user.uid}/appointments`));
  }, [firestore, user]);

  const { data: appointments, isLoading } = useCollection<Appointment>(appointmentsQuery);

  const doctorIds = useMemo(() => {
    if (!appointments) return [];
    return [...new Set(appointments.map(a => a.doctorId))];
  }, [appointments]);

  const { data: doctors } = useCollection<Doctor>(
    useMemoFirebase(() => {
      if (!firestore || doctorIds.length === 0) return null;
      return query(collection(firestore, 'doctors'), where('id', 'in', doctorIds));
    }, [firestore, doctorIds])
  );
  
  const { data: allDoctors } = useCollection<Doctor>(useMemoFirebase(() => firestore ? collection(firestore, 'doctors') : null, [firestore]));

  const getDoctor = (doctorId: string) => {
    return doctors?.find(d => d.id === doctorId) ?? allDoctors?.find(d => d.id === doctorId);
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
  
  const handleBookAppointment = async () => {
    if (!user || !selectedDoctorId || !appointmentDateTime || !appointmentReason) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Please fill in all the details for the appointment.",
        });
        return;
    }

    const selectedDoctor = getDoctor(selectedDoctorId);
    if (!selectedDoctor || selectedDoctor.patientsPerDay === undefined) {
         toast({
            variant: "destructive",
            title: "Doctor Info Missing",
            description: "Could not retrieve doctor's daily patient limit. Please try again later.",
        });
        return;
    }

    const requestedDate = new Date(appointmentDateTime);
    const startOfDay = new Date(requestedDate.getFullYear(), requestedDate.getMonth(), requestedDate.getDate()).toISOString();
    const endOfDay = new Date(requestedDate.getFullYear(), requestedDate.getMonth(), requestedDate.getDate() + 1).toISOString();

    const doctorAppointmentsQuery = query(
        collection(firestore, `doctors/${selectedDoctorId}/appointments`),
        where('appointmentDateTime', '>=', startOfDay),
        where('appointmentDateTime', '<', endOfDay)
    );

    const todaysAppointmentsSnapshot = await getDocs(doctorAppointmentsQuery);
    const appointmentsToday = todaysAppointmentsSnapshot.size;

    if (appointmentsToday >= selectedDoctor.patientsPerDay) {
        toast({
            variant: "destructive",
            title: "Doctor Unavailable",
            description: `Dr. ${selectedDoctor.lastName} is fully booked on this day. Please choose another date.`,
        });
        return;
    }

    const appointmentId = uuidv4();

    const appointmentData: Appointment = {
        id: appointmentId,
        patientId: user.uid,
        doctorId: selectedDoctorId,
        appointmentDateTime,
        reason: appointmentReason,
        notes: '',
        status: 'Pending',
    };
    
    // Create appointment in patient's subcollection
    const patientAppointmentRef = doc(firestore, `patients/${user.uid}/appointments`, appointmentId);
    setDocumentNonBlocking(patientAppointmentRef, appointmentData, { merge: false });

    // Denormalize appointment in doctor's subcollection
    const doctorAppointmentRef = doc(firestore, `doctors/${selectedDoctorId}/appointments`, appointmentId);
    setDocumentNonBlocking(doctorAppointmentRef, appointmentData, { merge: false });

    toast({
        title: "Appointment Request Sent!",
        description: `Your appointment request to ${selectedDoctor?.name} has been sent for confirmation.`,
    });

    setIsBooking(false);
    setAppointmentReason('');
    setAppointmentDateTime('');
    setSelectedDoctorId('');
};

const handleCancelAppointment = (appointment: Appointment) => {
    if (!user) return;
    const patientAppointmentRef = doc(firestore, `patients/${user.uid}/appointments`, appointment.id);
    const doctorAppointmentRef = doc(firestore, `doctors/${appointment.doctorId}/appointments`, appointment.id);

    updateDocumentNonBlocking(patientAppointmentRef, { status: 'Cancelled' });
    updateDocumentNonBlocking(doctorAppointmentRef, { status: 'Cancelled' });

    toast({
        title: 'Appointment Cancelled',
        description: 'Your appointment has been successfully cancelled.',
        variant: 'destructive',
    });
};

  if (isLoading) {
    return <div>Loading appointments...</div>
  }

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
            <CardTitle>Appointment History</CardTitle>
            <CardDescription>
            A log of your past and upcoming medical appointments.
            </CardDescription>
        </div>
        <Button onClick={() => setIsBooking(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Book Appointment
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Doctor</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="hidden md:table-cell">Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments && appointments.map((appointment) => {
              const doctor = getDoctor(appointment.doctorId);
              return (
                <TableRow key={appointment.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="hidden h-9 w-9 sm:flex">
                        <AvatarImage src={doctor?.avatarUrl} alt="Avatar" data-ai-hint="doctor professional" />
                        <AvatarFallback>{doctor?.name?.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="grid gap-0.5">
                        <span className='font-medium'>{doctor?.name}</span>
                        <span className='text-muted-foreground text-sm hidden md:inline'>{doctor?.specialty}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{appointment.reason}</TableCell>
                  <TableCell className="hidden md:table-cell">{new Date(appointment.appointmentDateTime).toLocaleDateString()}</TableCell>
                  <TableCell className="hidden md:table-cell">{new Date(appointment.appointmentDateTime).toLocaleTimeString()}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(appointment.status)}>
                      {appointment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        {appointment.status === 'Upcoming' && <DropdownMenuItem>Reschedule</DropdownMenuItem>}
                        {(appointment.status === 'Upcoming' || appointment.status === 'Pending') && <DropdownMenuItem className="text-destructive" onClick={() => handleCancelAppointment(appointment)}>Cancel</DropdownMenuItem>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <Dialog open={isBooking} onOpenChange={setIsBooking}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Book a New Appointment</DialogTitle>
                <DialogDescription>
                    Select a doctor and provide your details. The request will be sent for confirmation.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="doctor">Doctor</Label>
                    <Select onValueChange={setSelectedDoctorId}>
                        <SelectTrigger id="doctor">
                            <SelectValue placeholder="Select a doctor..." />
                        </SelectTrigger>
                        <SelectContent>
                            {allDoctors?.map((doc) => (
                                <SelectItem key={doc.id} value={doc.id}>
                                    {doc.name} - {doc.specialty}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="datetime">Date and Time</Label>
                    <Input id="datetime" type="datetime-local" value={appointmentDateTime} onChange={(e) => setAppointmentDateTime(e.target.value)} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="reason">Reason for Appointment</Label>
                    <Textarea id="reason" placeholder="e.g., Annual check-up, follow-up..." value={appointmentReason} onChange={(e) => setAppointmentReason(e.target.value)} />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsBooking(false)}>Cancel</Button>
                <Button onClick={handleBookAppointment}>Send Request</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
