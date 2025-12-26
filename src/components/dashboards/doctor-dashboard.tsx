'use client';

import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Search, Calendar, Users, Activity, FileText, 
  AlertCircle, MoreVertical, Clock, 
  Bot, Droplets, ChevronRight, Download, Sparkles, User,
  Bell, X as CloseIcon, Send, AlertTriangle, CheckCircle, CalendarDays, ArrowRight,
  Eye, ChevronDown, ChevronUp,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import type { Patient, Doctor, Appointment, MedicalReport, ScanImage } from '@/lib/types';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

// --- Sub-Components ---

const DoctorAvatar = ({ name, url, className = "" }: { name: string, url?: string, className?: string }) => {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  return (
    <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-sm ${className}`}>
      {url ? (
        <img src={url} alt={name} className="aspect-square h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">
          {initials}
        </div>
      )}
    </div>
  );
};

export default function DoctorDashboard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<MedicalReport | ScanImage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'directory' | 'appointments'>('directory');

  // --- Data Fetching ---
  const appointmentsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `doctors/${user.uid}/appointments`));
  }, [user, firestore]);
  const { data: appointments, isLoading: appointmentsLoading } = useCollection<Appointment>(appointmentsQuery);

  const patientIds = useMemo(() => {
    if (!appointments) return [];
    return [...new Set(appointments.map(a => a.patientId))];
  }, [appointments]);

  const patientsQuery = useMemoFirebase(() => {
    if (!firestore || patientIds.length === 0) return null;
    return query(collection(firestore, 'patients'), where('id', 'in', patientIds));
  }, [firestore, patientIds]);
  const { data: patients, isLoading: patientsLoading } = useCollection<Patient>(patientsQuery);

  // --- Patient Detail Data ---
  const patientMedicalReportsQuery = useMemoFirebase(() => {
      if (!selectedPatient) return null;
      return query(collection(firestore, `patients/${selectedPatient.id}/medical_reports`));
  }, [firestore, selectedPatient]);
  const { data: medicalReports } = useCollection<MedicalReport>(patientMedicalReportsQuery);

  const patientScanImagesQuery = useMemoFirebase(() => {
      if (!selectedPatient) return null;
      return query(collection(firestore, `patients/${selectedPatient.id}/scan_images`));
  }, [firestore, selectedPatient]);
  const { data: scanImages } = useCollection<ScanImage>(patientScanImagesQuery);


  const filteredPatients = useMemo(() => {
      if (!patients) return [];
      return patients.filter(p => 
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [patients, searchQuery]);

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setSelectedRecord(null);
  };
  
  const handleUpdateAppointmentStatus = (appointmentId: string, patientId: string, status: 'Confirmed' | 'Cancelled' | 'Completed') => {
    if (!user) return;
    
    const doctorAppointmentRef = doc(firestore, `doctors/${user.uid}/appointments`, appointmentId);
    const patientAppointmentRef = doc(firestore, `patients/${patientId}/appointments`, appointmentId);
    
    updateDocumentNonBlocking(doctorAppointmentRef, { status });
    updateDocumentNonBlocking(patientAppointmentRef, { status });

    toast({
        title: "Appointment Updated",
        description: `The appointment has been marked as ${status}.`
    });
  }


  if (appointmentsLoading || patientsLoading) {
      return <div>Loading Clinical Hub...</div>
  }
  
  // --- RECORD DETAIL VIEW ---
  if (selectedRecord && selectedPatient) {
      const isScan = 'scanType' in selectedRecord;
      return (
        <div className="min-h-screen bg-[#F8FAFC] pt-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex items-center justify-between gap-6 mb-8">
                    <button onClick={() => setSelectedRecord(null)} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors group">
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to Patient Chart
                    </button>
                    <div className="flex items-center gap-3">
                         <a href={selectedRecord.fileUrl || selectedRecord.imageUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="rounded-xl h-10 gap-2 font-bold text-slate-600"><Download className="w-4 h-4" /> View Original</Button>
                         </a>
                    </div>
                </div>
                <Card className="border-none shadow-xl shadow-slate-200/40">
                    <CardHeader className="border-b border-slate-50 pb-6">
                        <Badge className="bg-indigo-600 text-white border-none uppercase text-[10px] font-bold tracking-widest px-3 mb-4 w-fit">AI Report Interpretation</Badge>
                        <CardTitle className="text-3xl font-black text-slate-900 leading-tight">{isScan ? `${selectedRecord.scanType} Scan` : selectedRecord.reportType}</CardTitle>
                        <CardDescription>Uploaded on {new Date(selectedRecord.uploadDate).toLocaleDateString()}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8 grid lg:grid-cols-2 gap-8">
                        <div className="p-8 rounded-3xl bg-slate-900 text-white relative overflow-hidden shadow-2xl">
                           <h3 className="font-bold text-indigo-300 text-sm mb-2 uppercase tracking-widest">AI Summary</h3>
                           <p className="text-slate-100 text-base leading-relaxed font-medium">{isScan ? selectedRecord.aiAnalysis.summary : selectedRecord.aiSummary}</p>
                        </div>
                         <div className="p-8 rounded-3xl bg-amber-50/50 border border-amber-200/50 relative overflow-hidden">
                           <h3 className="font-bold text-amber-600 text-sm mb-2 uppercase tracking-widest flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Key Findings & Next Steps</h3>
                           <p className="text-slate-700 text-base leading-relaxed font-medium">{isScan ? selectedRecord.aiAnalysis.keyFindings || selectedRecord.aiAnalysis.criticalFindings : selectedRecord.aiPotentialIssues}</p>
                           <p className="text-slate-500 text-sm mt-4">{isScan ? `Recommended specialist: ${selectedRecord.aiAnalysis.recommendedSpecialists}` : `Next steps: ${selectedRecord.aiNextSteps}`}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      );
  }

  // --- PATIENT DETAIL VIEW (CHART) ---
  if (selectedPatient) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pt-10 pb-20 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="container mx-auto px-4 md:px-6">
          <button onClick={() => setSelectedPatient(null)} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium transition-colors mb-8 group">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to Patient List
          </button>
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 space-y-6 lg:sticky top-10">
              <Card className="overflow-hidden border-none shadow-2xl shadow-indigo-100/50 rounded-3xl">
                <div className="bg-slate-900 p-8 text-white relative">
                  <div className="flex flex-col items-center text-center space-y-6">
                    <DoctorAvatar name={`${selectedPatient.firstName} ${selectedPatient.lastName}`} url={selectedPatient.avatarUrl} className="h-32 w-32 text-4xl border-4" />
                    <div>
                      <h2 className="text-3xl font-black tracking-tight">{selectedPatient.firstName} {selectedPatient.lastName}</h2>
                      <div className="flex items-center justify-center gap-2 mt-1">
                        <Badge className="bg-indigo-600 text-white border-none text-[10px] font-bold">ACTIVE FILE</Badge>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">ID: #{selectedPatient.id.substring(0,8)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                 <CardContent className="p-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center"><p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">DOB</p><p className="font-black text-slate-900 text-lg">{selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : 'N/A'}</p></div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center"><p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Blood Group</p><p className="font-black text-slate-900 text-lg">{selectedPatient.bloodGroup || 'N/A'}</p></div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-8 space-y-6">
              <Card className="border-none shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                  <CardTitle className="text-xl font-black text-slate-900">Clinical History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                    {medicalReports?.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-6 hover:bg-indigo-50/30 transition-all group cursor-pointer" onClick={() => setSelectedRecord(record)}>
                        <div className="flex items-center gap-6"><div className="p-4 bg-white rounded-2xl text-slate-400 group-hover:text-indigo-600 border border-slate-100 shadow-sm transition-all"><FileText className="w-8 h-8" /></div>
                          <div>
                            <p className="font-black text-slate-900 text-lg leading-tight group-hover:text-indigo-600 transition-colors">{record.reportType}</p>
                            <div className="flex items-center gap-4 mt-1.5"><span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(record.uploadDate).toLocaleDateString()}</span></div>
                          </div>
                        </div>
                        <ChevronRight className="w-7 h-7 text-slate-200 group-hover:text-indigo-600 transition-colors" />
                      </div>
                    ))}
                    {scanImages?.map((scan) => (
                         <div key={scan.id} className="flex items-center justify-between p-6 hover:bg-indigo-50/30 transition-all group cursor-pointer" onClick={() => setSelectedRecord(scan)}>
                            <div className="flex items-center gap-6">
                               <div className="p-4 bg-white rounded-2xl text-slate-400 group-hover:text-indigo-600 border border-slate-100 shadow-sm transition-all"><Eye className="w-8 h-8" /></div>
                               <div>
                                  <p className="font-black text-slate-900 text-lg leading-tight group-hover:text-indigo-600 transition-colors">{scan.scanType} Scan</p>
                                  <div className="flex items-center gap-4 mt-1.5"><span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(scan.uploadDate).toLocaleDateString()}</span></div>
                               </div>
                            </div>
                            <ChevronRight className="w-7 h-7 text-slate-200 group-hover:text-indigo-600 transition-colors" />
                         </div>
                    ))}
                  </div>
                   {(!medicalReports || medicalReports.length === 0) && (!scanImages || scanImages.length === 0) && (
                      <p className="text-center text-muted-foreground p-8">No medical records found for this patient.</p>
                   )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- DASHBOARD MAIN VIEW ---
  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-10 pb-20 animate-in fade-in duration-500">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 font-bold mb-3 uppercase tracking-widest text-[10px] px-3 py-1">PRACTITIONER CORE</Badge>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">Clinical Hub</h1>
            <p className="text-slate-500 mt-3 font-medium text-lg">Manage patient records and coordinate personalized care.</p>
          </div>
          <div className="flex bg-slate-100 p-2 rounded-3xl border border-slate-200/50 shadow-inner self-start md:self-end">
            <button onClick={() => setActiveTab('directory')} className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all ${activeTab === 'directory' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}>
              <Users className="w-4 h-4" /> Patients
            </button>
            <button onClick={() => setActiveTab('appointments')} className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all ${activeTab === 'appointments' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}>
              <CalendarDays className="w-4 h-4" /> Bookings
            </button>
          </div>
        </div>

        {activeTab === 'directory' ? (
          <div className="space-y-8">
            <div className="relative max-w-xl">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="text" placeholder="Search by patient name or ID..." className="w-full pl-14 pr-6 py-4 rounded-3xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-xl shadow-slate-200/20 text-base font-medium transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
                <CardContent className="p-0">
                   <div className="overflow-x-auto">
                      <table className="w-full text-left">
                         <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                               <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Details</th>
                               <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Contact</th>
                               <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right"></th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                            {filteredPatients?.map((p) => (
                               <tr key={p.id} className="hover:bg-indigo-50/20 transition-all cursor-pointer group" onClick={() => handleSelectPatient(p)}>
                                  <td className="px-8 py-7">
                                     <div className="flex items-center gap-5">
                                        <DoctorAvatar name={`${p.firstName} ${p.lastName}`} url={p.avatarUrl} className="h-12 w-12 border-2" />
                                        <div>
                                           <p className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors text-lg tracking-tight flex items-center gap-2">
                                              {p.firstName} {p.lastName}
                                           </p>
                                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: #{p.id.substring(0,8)}</p>
                                        </div>
                                     </div>
                                  </td>
                                  <td className="px-8 py-7 text-sm text-slate-500 font-medium">
                                      {appointments?.find(a => a.patientId === p.id) ? new Date(appointments.find(a => a.patientId === p.id)!.appointmentDateTime).toLocaleDateString() : 'No appointments'}
                                  </td>
                                  <td className="px-8 py-7 text-right">
                                     <div className="flex items-center justify-end gap-4">
                                        <ChevronRight className="w-7 h-7 text-slate-200 group-hover:text-indigo-600 transition-colors" />
                                     </div>
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-white border-b border-slate-100 px-8 py-6">
                <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-3"><Calendar className="w-6 h-6 text-indigo-600" /> Patient Schedule</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Slot</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {appointments?.map((apt) => {
                        const p = patients?.find(p => p.id === apt.patientId);
                        return (
                          <tr key={apt.id} className="hover:bg-indigo-50/10 transition-colors">
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                <DoctorAvatar name={`${p?.firstName} ${p?.lastName}`} url={p?.avatarUrl} className="h-10 w-10" />
                                <div>
                                  <p className="font-black text-slate-900 text-sm tracking-tight">{p?.firstName} {p?.lastName}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: #{p?.id.substring(0,8)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-slate-800">{new Date(apt.appointmentDateTime).toLocaleDateString()}</span>
                                <span className="text-xs text-slate-500 font-bold uppercase tracking-tighter">{new Date(apt.appointmentDateTime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-xs font-medium text-slate-600 max-w-xs truncate">{apt.reason}</td>
                            <td className="px-8 py-6">
                              <Badge className={`${
                                  apt.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600' :
                                  apt.status === 'Cancelled' ? 'bg-red-50 text-red-600' :
                                  apt.status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                                  'bg-slate-100 text-slate-600'
                                  } border font-black text-[9px] uppercase px-3 py-1 rounded-lg`}>{apt.status}</Badge>
                            </td>
                            <td className="px-8 py-6 text-right">
                                {apt.status === 'Pending' && (
                                    <div className="flex gap-2 justify-end">
                                        <Button size="sm" className="rounded-lg bg-emerald-500 hover:bg-emerald-600" onClick={() => handleUpdateAppointmentStatus(apt.id, apt.patientId, 'Confirmed')}>Accept</Button>
                                        <Button size="sm" variant="destructive" className="rounded-lg" onClick={() => handleUpdateAppointmentStatus(apt.id, apt.patientId, 'Cancelled')}>Decline</Button>
                                    </div>
                                )}
                                {apt.status === 'Confirmed' && (
                                    <Button size="sm" variant="secondary" className="rounded-lg" onClick={() => handleUpdateAppointmentStatus(apt.id, apt.patientId, 'Completed')}>Mark as Complete</Button>
                                )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
