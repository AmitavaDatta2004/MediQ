
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
import { ChevronRight, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';


export default function DoctorPatientsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  // 1. Get all consent documents directly from the doctor's subcollection.
  const consentsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    // This query assumes denormalization of consent records into the doctor's collection.
    // path: /doctors/{doctorId}/consented_patients/{patientId}
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
  
  // Mock data for new UI elements, will be replaced with real data later
  const getPatientHealthData = (patientId: string) => {
    // In a real app, this would come from the patient object or another collection
    const mockData: any = {
        'riskScore': Math.floor(Math.random() * 80) + 5, // random score 5-85
        'conditions': [['Hypertension'], ['Diabetes'], ['Asthma'], []][Math.floor(Math.random() * 4)],
    };
    return mockData;
  }

  if (isLoading) {
    return <div>Loading patients...</div>;
  }

  return (
    <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
        <CardHeader className="p-0">
           <div className="overflow-x-auto">
              <Table>
                 <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                    <TableRow>
                       <TableHead className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Details</TableHead>
                       <TableHead className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Health Index</TableHead>
                       <TableHead className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Chronic Conditions</TableHead>
                       <TableHead className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Coordination</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody className="divide-y divide-slate-100">
                    {consentedPatients && consentedPatients.length > 0 ? (
                      consentedPatients.map((patient) => {
                          const healthData = getPatientHealthData(patient.id);
                          const riskScore = healthData.riskScore;
                          const riskColor = riskScore > 50 ? 'bg-red-500' : riskScore > 20 ? 'bg-amber-500' : 'bg-emerald-500';
                          const riskTextColor = riskScore > 50 ? 'text-red-600' : riskScore > 20 ? 'text-amber-600' : 'text-emerald-600';

                          return (
                           <TableRow key={patient.id} className="hover:bg-primary/5 transition-all cursor-pointer group">
                              <TableCell className="px-8 py-7">
                                 <Link href={`/dashboard/doctor/patients/${patient.id}`}>
                                     <div className="flex items-center gap-5">
                                        <Avatar className="h-12 w-12 border-2">
                                            <AvatarImage src={patient.avatarUrl} alt="Avatar" data-ai-hint="person portrait" />
                                            <AvatarFallback>{patient.firstName?.[0]}{patient.lastName?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                           <p className="font-black text-slate-900 group-hover:text-primary transition-colors text-lg tracking-tight flex items-center gap-2">
                                              {patient.firstName} {patient.lastName}
                                              <span className={`w-2.5 h-2.5 rounded-full ${riskColor} shadow-sm`} />
                                           </p>
                                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: #{patient.id.substring(0,8)}</p>
                                        </div>
                                     </div>
                                 </Link>
                              </TableCell>
                              <TableCell className="px-8 py-7">
                                 <div className="flex flex-col items-center gap-2">
                                    <div className={`text-base font-black ${riskTextColor}`}>
                                       {riskScore}% <span className="text-[10px] uppercase font-bold text-slate-400 ml-1">Criticality</span>
                                    </div>
                                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner"><div className={`h-full ${riskColor}`} style={{ width: `${riskScore}%` }} /></div>
                                 </div>
                              </TableCell>
                              <TableCell className="px-8 py-7">
                                 <div className="flex flex-wrap gap-2">
                                    {healthData.conditions.map((c: string, i: number) => <Badge key={i} variant="outline" className="text-[10px] font-bold uppercase border-slate-200 text-slate-500 px-2 py-0.5 rounded-lg">{c}</Badge>)}
                                    {healthData.conditions.length === 0 && <Badge variant="outline" className="text-[10px] font-bold uppercase border-slate-200 text-slate-500 px-2 py-0.5 rounded-lg">None</Badge>}
                                 </div>
                              </TableCell>
                              <TableCell className="px-8 py-7 text-right">
                                 <div className="flex items-center justify-end gap-4">
                                    <Button variant="ghost" size="sm" className="rounded-2xl text-primary hover:bg-white hover:shadow-xl h-11 px-6 border border-transparent hover:border-primary/10 transition-all font-black text-xs uppercase tracking-widest">
                                      <Bell className="w-4 h-4 mr-2" /> Alert
                                    </Button>
                                    <Link href={`/dashboard/doctor/patients/${patient.id}`}>
                                        <ChevronRight className="w-7 h-7 text-slate-200 group-hover:text-primary transition-colors" />
                                    </Link>
                                 </div>
                              </TableCell>
                           </TableRow>
                          )
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                No patients have granted you access yet.
                            </TableCell>
                        </TableRow>
                    )}
                 </TableBody>
              </Table>
           </div>
        </CardHeader>
    </Card>
  );
}
