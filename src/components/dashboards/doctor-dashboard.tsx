'use client';

import React, { useMemo } from 'react';
import { Calendar, Users, CheckCircle, UserPlus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import type { Patient, Appointment } from '@/lib/types';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export default function DoctorDashboard() {
  const { user } = useUser();
  const firestore = useFirestore();

  // --- Data Fetching ---
  const appointmentsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `doctors/${user.uid}/appointments`));
  }, [user, firestore]);
  const { data: appointments, isLoading: appointmentsLoading } = useCollection<Appointment>(appointmentsQuery);

  const consentedPatientsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `doctors/${user.uid}/consented_patients`), where('consentGiven', '==', true));
  }, [firestore, user]);
  const { data: consents, isLoading: consentsLoading } = useCollection(consentedPatientsQuery);
  
  const patientIds = useMemo(() => {
    if (!consents) return [];
    return [...new Set(consents.map(c => c.patientId))];
  }, [consents]);

  const patientsQuery = useMemoFirebase(() => {
    if (!firestore || patientIds.length === 0) return null;
    return query(collection(firestore, 'patients'), where('id', 'in', patientIds));
  }, [firestore, patientIds]);
  const { data: patients, isLoading: patientsLoading } = useCollection<Patient>(patientsQuery);
  
  const recentPatientsQuery = useMemoFirebase(() => {
    if (!firestore || patientIds.length === 0) return null;
    // This is a simplification. Real-world might need a 'consentGrantedDate' in the consent doc to order by.
    return query(collection(firestore, 'patients'), where('id', 'in', patientIds), limit(5));
  }, [firestore, patientIds]);
  const {data: recentPatients} = useCollection<Patient>(recentPatientsQuery);


  // --- Memoized Stats ---
  const totalPatients = useMemo(() => patients?.length || 0, [patients]);
  const upcomingAppointmentsCount = useMemo(() => appointments?.filter(a => a.status === 'Upcoming' || a.status === 'Pending').length || 0, [appointments]);
  const completedAppointmentsCount = useMemo(() => appointments?.filter(a => a.status === 'Completed').length || 0, [appointments]);

  const recentUpcomingAppointments = useMemo(() => {
    if (!appointments) return [];
    return appointments.filter(a => new Date(a.appointmentDateTime) > new Date() && (a.status === 'Upcoming' || a.status === 'Pending'))
      .sort((a,b) => new Date(a.appointmentDateTime).getTime() - new Date(b.appointmentDateTime).getTime())
      .slice(0, 5);
  }, [appointments]);

  const getPatientForAppointment = (patientId: string) => {
    return patients?.find(p => p.id === patientId);
  }
  
  const isLoading = appointmentsLoading || consentsLoading || patientsLoading;

  if (isLoading) {
      return <div>Loading Dashboard...</div>
  }

  return (
    <div className="space-y-6">
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPatients}</div>
            <p className="text-xs text-muted-foreground">under your care</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAppointmentsCount}</div>
            <p className="text-xs text-muted-foreground">scheduled or pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultations This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedAppointmentsCount}</div>
            <p className="text-xs text-muted-foreground">completed appointments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Patient Requests</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consents?.length || 0}</div>
            <p className="text-xs text-muted-foreground">total consent grants</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                <CardTitle>Upcoming Schedule</CardTitle>
                <CardDescription>
                    Your next few appointments at a glance.
                </CardDescription>
                </div>
                <Button asChild size="sm" className="ml-auto gap-1">
                <Link href="/dashboard/doctor/appointments">
                    View All
                    <ArrowRight className="h-4 w-4" />
                </Link>
                </Button>
            </CardHeader>
            <CardContent>
                 <div className="space-y-4">
                    {recentUpcomingAppointments.map(apt => {
                        const patient = getPatientForAppointment(apt.patientId);
                        return (
                            <div key={apt.id} className="flex items-center">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={patient?.avatarUrl} alt="Avatar" />
                                    <AvatarFallback>{patient?.firstName?.[0]}{patient?.lastName?.[0]}</AvatarFallback>
                                </Avatar>
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">{patient?.firstName} {patient?.lastName}</p>
                                    <p className="text-sm text-muted-foreground truncate max-w-[180px]">{apt.reason}</p>
                                </div>
                                <div className="ml-auto font-medium text-sm text-right">
                                    <div>{new Date(apt.appointmentDateTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                                    <div className="text-xs text-muted-foreground">{new Date(apt.appointmentDateTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                            </div>
                        )
                    })}
                     {recentUpcomingAppointments.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">No upcoming appointments.</p>}
                 </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                <CardTitle>Recent Patient Activity</CardTitle>
                <CardDescription>
                    New patients who have granted you access.
                </CardDescription>
                </div>
                 <Button asChild size="sm" className="ml-auto gap-1">
                <Link href="/dashboard/doctor/patients">
                    View All
                    <ArrowRight className="h-4 w-4" />
                </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {recentPatients?.map(patient => (
                        <div key={patient.id} className="flex items-center">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={patient.avatarUrl} alt="Avatar" />
                                <AvatarFallback>{patient.firstName?.[0]}{patient.lastName?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">{patient.firstName} {patient.lastName}</p>
                                <p className="text-sm text-muted-foreground">{patient.email}</p>
                            </div>
                            <div className="ml-auto">
                                <Badge variant="secondary" className="bg-green-100 text-green-800">New Consent</Badge>
                            </div>
                        </div>
                    ))}
                    {(!recentPatients || recentPatients.length === 0) && <p className="text-sm text-center text-muted-foreground py-4">No new patient activity.</p>}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};
