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
import { Calendar } from 'lucide-react';

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
        case 'Upcoming': return 'default';
        case 'Completed': return 'secondary';
        case 'Cancelled': return 'destructive';
        case 'Pending': return 'outline';
        default: return 'outline';
    }
  }

  if (isLoading) {
    return <div>Loading appointments...</div>
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-100 px-8 py-6">
            <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-3"><Calendar className="w-6 h-6 text-primary" /> Patient Schedule</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</TableHead>
                    <TableHead className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Slot</TableHead>
                    <TableHead className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason</TableHead>
                    <TableHead className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</TableHead>
                    <TableHead className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments?.map((apt) => {
                    const p = getPatient(apt.patientId);
                    return (
                      <TableRow key={apt.id} className="hover:bg-primary/5 transition-colors">
                        <TableCell className="px-8 py-6">
                            <Link href={`/dashboard/doctor/patients/${p?.id}`}>
                                <div className="flex items-center gap-4 hover:underline">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={p?.avatarUrl} alt="Avatar" data-ai-hint="person portrait" />
                                        <AvatarFallback>{p?.firstName?.[0]}{p?.lastName?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                    <p className="font-black text-slate-900 text-sm tracking-tight">{p?.firstName} {p?.lastName}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: #{p?.id.substring(0,8)}</p>
                                    </div>
                                </div>
                            </Link>
                        </TableCell>
                        <TableCell className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-800">{new Date(apt.appointmentDateTime).toLocaleDateString()}</span>
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-tighter">{new Date(apt.appointmentDateTime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-8 py-6 text-xs font-medium text-slate-600 max-w-xs truncate">{apt.reason}</TableCell>
                        <TableCell className="px-8 py-6">
                            <Badge className={`${
                                  apt.status === 'Upcoming' ? 'bg-green-100 text-green-700' :
                                  apt.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                  apt.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-slate-100 text-slate-600'
                                  } border-none font-black text-[9px] uppercase px-3 py-1 rounded-lg`}>{apt.status}</Badge>
                        </TableCell>
                        <TableCell className="px-8 py-6 text-right">
                            {apt.status === 'Pending' && (
                                <div className="flex gap-2 justify-end">
                                    <Button size="sm" className="rounded-lg bg-green-600 hover:bg-green-700" onClick={() => handleUpdateStatus(apt, 'Upcoming')}>Accept</Button>
                                    <Button size="sm" variant="destructive" className="rounded-lg" onClick={() => handleUpdateStatus(apt, 'Cancelled')}>Decline</Button>
                                </div>
                            )}
                            {apt.status === 'Upcoming' && (
                                <Button size="sm" variant="secondary" className="rounded-lg" onClick={() => handleUpdateStatus(apt, 'Completed')}>Mark as Complete</Button>
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
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
