'use client';

import React, { useMemo } from 'react';
import { Calendar, Users, CheckCircle, UserPlus, ArrowRight, Activity, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import type { Patient, Appointment } from '@/lib/types';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

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
    return query(collection(firestore, 'patients'), where('id', 'in', patientIds), limit(4));
  }, [firestore, patientIds]);
  const {data: recentPatients} = useCollection<Patient>(recentPatientsQuery);


  // --- Memoized Stats ---
  const totalPatients = useMemo(() => patients?.length || 0, [patients]);
  const upcomingAppointmentsCount = useMemo(() => appointments?.filter(a => new Date(a.appointmentDateTime) > new Date() && (a.status === 'Upcoming' || a.status === 'Pending')).length || 0, [appointments]);
  const completedAppointmentsCount = useMemo(() => appointments?.filter(a => a.status === 'Completed').length || 0, [appointments]);
  const newRequestsCount = useMemo(() => appointments?.filter(a => a.status === 'Pending').length || 0, [appointments]);

  const recentUpcomingAppointments = useMemo(() => {
    if (!appointments) return [];
    return appointments.filter(a => new Date(a.appointmentDateTime) > new Date() && (a.status === 'Upcoming' || a.status === 'Pending'))
      .sort((a,b) => new Date(a.appointmentDateTime).getTime() - new Date(b.appointmentDateTime).getTime())
      .slice(0, 3);
  }, [appointments]);

  const getPatientForAppointment = (patientId: string) => {
    return patients?.find(p => p.id === patientId);
  }
  
  const isLoading = appointmentsLoading || consentsLoading || patientsLoading;

  if (isLoading) {
      return <div>Loading Dashboard...</div>
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100 p-8">
            <CardTitle className="text-3xl font-black text-slate-900 flex items-center gap-3">Your Dashboard</CardTitle>
            <CardDescription>A summary of your practice activity.</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-12">
            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex items-center gap-5 p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Users className="w-6 h-6"/></div>
                    <div>
                        <div className="text-2xl font-black text-slate-800">{totalPatients}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Patients</div>
                    </div>
                </div>
                <div className="flex items-center gap-5 p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="p-3 bg-green-100 text-green-600 rounded-xl"><Calendar className="w-6 h-6"/></div>
                    <div>
                        <div className="text-2xl font-black text-slate-800">{upcomingAppointmentsCount}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upcoming</div>
                    </div>
                </div>
                 <div className="flex items-center gap-5 p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="p-3 bg-slate-200 text-slate-600 rounded-xl"><CheckCircle className="w-6 h-6"/></div>
                    <div>
                        <div className="text-2xl font-black text-slate-800">{completedAppointmentsCount}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed</div>
                    </div>
                </div>
                 <div className="flex items-center gap-5 p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="p-3 bg-yellow-100 text-yellow-600 rounded-xl"><UserPlus className="w-6 h-6"/></div>
                    <div>
                        <div className="text-2xl font-black text-slate-800">{newRequestsCount}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">New Requests</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upcoming Schedule */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-900">Upcoming Schedule</h3>
                         <Button asChild variant="ghost" size="sm" className="text-primary font-bold">
                            <Link href="/dashboard/doctor/appointments">
                                View All <ArrowRight className="h-4 w-4 ml-2" />
                            </Link>
                        </Button>
                    </div>
                    <div className="space-y-4">
                        {recentUpcomingAppointments.map(apt => {
                            const patient = getPatientForAppointment(apt.patientId);
                            return (
                                <div key={apt.id} className="flex items-center p-4 rounded-xl border border-slate-100 bg-white">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={patient?.avatarUrl} alt="Avatar" data-ai-hint="person portrait"/>
                                        <AvatarFallback>{patient?.firstName?.[0]}{patient?.lastName?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-bold leading-none text-slate-900">{patient?.firstName} {patient?.lastName}</p>
                                        <p className="text-xs text-muted-foreground font-medium truncate max-w-[180px]">{apt.reason}</p>
                                    </div>
                                    <div className="ml-auto text-sm text-right">
                                        <div className="font-bold text-slate-700">{new Date(apt.appointmentDateTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                                        <div className="text-xs text-muted-foreground font-semibold">{new Date(apt.appointmentDateTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                </div>
                            )
                        })}
                        {recentUpcomingAppointments.length === 0 && <p className="text-sm text-center text-muted-foreground py-8">No upcoming appointments.</p>}
                    </div>
                </div>

                {/* Recent Patients */}
                <div>
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-900">Recent Patient Activity</h3>
                         <Button asChild variant="ghost" size="sm" className="text-primary font-bold">
                            <Link href="/dashboard/doctor/patients">
                                View All <ArrowRight className="h-4 w-4 ml-2" />
                            </Link>
                        </Button>
                    </div>
                     <div className="space-y-4">
                        {recentPatients?.map(patient => (
                            <div key={patient.id} className="flex items-center p-4 rounded-xl border border-slate-100 bg-white">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={patient.avatarUrl} alt="Avatar" data-ai-hint="person portrait" />
                                    <AvatarFallback>{patient.firstName?.[0]}{patient.lastName?.[0]}</AvatarFallback>
                                </Avatar>
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-bold leading-none text-slate-900">{patient.firstName} {patient.lastName}</p>
                                    <p className="text-xs text-muted-foreground font-medium">{patient.email}</p>
                                </div>
                                <div className="ml-auto">
                                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">New Consent</Badge>
                                </div>
                            </div>
                        ))}
                        {(!recentPatients || recentPatients.length === 0) && <p className="text-sm text-center text-muted-foreground py-8">No new patient activity.</p>}
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
};
