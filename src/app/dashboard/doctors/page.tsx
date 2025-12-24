'use client';
import { Star, MapPin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { Doctor } from '@/lib/types';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

export default function DoctorsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [appointmentReason, setAppointmentReason] = useState('');
  const [appointmentDateTime, setAppointmentDateTime] = useState('');


  const doctorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'doctors');
  }, [firestore]);

  const { data: doctors, isLoading } = useCollection<Doctor>(doctorsQuery);

  const handleBookAppointment = async () => {
    if (!user || !selectedDoctor || !appointmentDateTime || !appointmentReason) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Please fill in all the details for the appointment.",
        });
        return;
    }

    const appointmentId = uuidv4();

    // Create appointment in patient's subcollection
    const patientAppointmentRef = collection(firestore, `patients/${user.uid}/appointments`);
    const appointmentData = {
        id: appointmentId,
        patientId: user.uid,
        doctorId: selectedDoctor.id,
        appointmentDateTime,
        reason: appointmentReason,
        notes: '',
    };
    await addDocumentNonBlocking(patientAppointmentRef, appointmentData);

    // Denormalize appointment in doctor's subcollection
    const doctorAppointmentRef = collection(firestore, `doctors/${selectedDoctor.id}/appointments`);
    await addDocumentNonBlocking(doctorAppointmentRef, appointmentData);

    toast({
        title: "Appointment Booked!",
        description: `Your appointment with ${selectedDoctor.name} has been scheduled.`,
    });

    setIsBooking(false);
    setSelectedDoctor(null);
    setAppointmentReason('');
    setAppointmentDateTime('');
};


  if (isLoading) {
    return <div>Loading doctors...</div>
  }

  return (
    <>
    <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Find a Doctor</h1>
            <p className="text-muted-foreground">Search for specialists near you and book an appointment.</p>
        </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {doctors && doctors.map((doctor) => (
          <Card key={doctor.id} className="flex flex-col">
            <CardHeader className="flex-row items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={doctor.avatarUrl} alt={doctor.name} data-ai-hint="doctor professional" />
                <AvatarFallback>{doctor.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{doctor.name}</CardTitle>
                <CardDescription>{doctor.specialty}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{doctor.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{doctor.rating}</span>
                    <span className="text-muted-foreground">({doctor.reviews} reviews)</span>
                </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => { setSelectedDoctor(doctor); setIsBooking(true); }}>Book Appointment</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
    <Dialog open={isBooking} onOpenChange={setIsBooking}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Book Appointment with {selectedDoctor?.name}</DialogTitle>
                <DialogDescription>
                    Please provide the details for your appointment.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="datetime">Date and Time</Label>
                    <Input id="datetime" type="datetime-local" value={appointmentDateTime} onChange={(e) => setAppointmentDateTime(e.target.value)} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="reason">Reason for Appointment</Label>
                    <Textarea id="reason" placeholder="e.g., Annual check-up, follow-up..." value={appointmentReason} onChange={(e) => setAppointmentReason(e.target.value)} />
                </div>
            </div>
            <Button onClick={handleBookAppointment}>Confirm Booking</Button>
        </DialogContent>
    </Dialog>
    </>
  );
}
