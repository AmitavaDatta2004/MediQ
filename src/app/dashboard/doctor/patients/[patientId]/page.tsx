'use client';
import { useState, useMemo } from 'react';
import { useDoc, useCollection, useUser, useFirestore, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import type { MedicalReport, ScanImage, Patient, Prescription, Allergy, ChronicCondition } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { FileText, Download, Stethoscope, PlusCircle, X, ArrowRight, AlertTriangle, BrainCircuit, Microscope, Pill, Heart, Droplets, Ruler, Weight, ShieldAlert } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { useParams } from 'next/navigation';
import { addDoc } from 'firebase/firestore';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

export default function PatientRecordPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const params = useParams();
    const patientId = params.patientId as string;

    const [isPrescribing, setIsPrescribing] = useState(false);
    const [medicines, setMedicines] = useState([{ name: '', dosage: '', frequency: '' }]);
    const [prescriptionNotes, setPrescriptionNotes] = useState('');
    
    const [selectedScan, setSelectedScan] = useState<ScanImage | null>(null);
    const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);
    const [scanNotes, setScanNotes] = useState('');

    const patientDocRef = useMemoFirebase(() => doc(firestore, 'patients', patientId), [firestore, patientId]);
    const { data: patient, isLoading: patientLoading } = useDoc<Patient>(patientDocRef);

    const reportsQuery = useMemoFirebase(() => {
        if (!patientId) return null;
        return query(collection(firestore, `patients/${patientId}/medical_reports`), orderBy('uploadDate', 'desc'));
    }, [firestore, patientId]);

    const scansQuery = useMemoFirebase(() => {
        if (!patientId) return null;
        return query(collection(firestore, `patients/${patientId}/scan_images`), orderBy('uploadDate', 'desc'));
    }, [firestore, patientId]);

    const prescriptionsQuery = useMemoFirebase(() => {
        if (!patientId) return null;
        return query(collection(firestore, `patients/${patientId}/prescriptions`), orderBy('date', 'desc'));
    }, [firestore, patientId]);
    
    const allergiesQuery = useMemoFirebase(() => {
        if (!patientId) return null;
        return query(collection(firestore, `patients/${patientId}/allergies`));
    }, [firestore, patientId]);

    const conditionsQuery = useMemoFirebase(() => {
        if (!patientId) return null;
        return query(collection(firestore, `patients/${patientId}/chronic_conditions`));
    }, [firestore, patientId]);

    const { data: medicalReports, isLoading: reportsLoading } = useCollection<MedicalReport>(reportsQuery);
    const { data: scanImages, isLoading: scansLoading } = useCollection<ScanImage>(scansQuery);
    const { data: prescriptions, isLoading: prescriptionsLoading } = useCollection<Prescription>(prescriptionsQuery);
    const { data: allergies, isLoading: allergiesLoading } = useCollection<Allergy>(allergiesQuery);
    const { data: chronicConditions, isLoading: conditionsLoading } = useCollection<ChronicCondition>(conditionsQuery);
    
    const isLoading = reportsLoading || scansLoading || patientLoading || prescriptionsLoading || allergiesLoading || conditionsLoading;

    const handleAddMedicine = () => {
        setMedicines([...medicines, { name: '', dosage: '', frequency: '' }]);
    };

    const handleMedicineChange = (index: number, field: string, value: string) => {
        const newMedicines = [...medicines];
        newMedicines[index] = { ...newMedicines[index], [field]: value };
        setMedicines(newMedicines);
    };
    
    const handleRemoveMedicine = (index: number) => {
        const newMedicines = medicines.filter((_, i) => i !== index);
        setMedicines(newMedicines);
    };

    const handleCreatePrescription = async () => {
        if (!user || !patientId || medicines.some(m => !m.name || !m.dosage || !m.frequency)) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Please fill in all medicine details.'
            });
            return;
        }

        const prescriptionId = uuidv4();
        const prescriptionData: Prescription = {
            id: prescriptionId,
            patientId,
            doctorId: user.uid,
            date: new Date().toISOString(),
            medicines,
            notes: prescriptionNotes,
        };

        const prescriptionRef = collection(firestore, `patients/${patientId}/prescriptions`);
        await addDoc(prescriptionRef, prescriptionData);

        toast({
            title: 'Prescription Created',
            description: `The new prescription has been saved for ${patient?.firstName}.`
        });

        setIsPrescribing(false);
        setMedicines([{ name: '', dosage: '', frequency: '' }]);
        setPrescriptionNotes('');
    }
    
    const handleOpenScanViewer = (scan: ScanImage) => {
        setSelectedScan(scan);
        setScanNotes(''); // Reset notes when opening
    };

    const handleOpenReportViewer = (report: MedicalReport) => {
        setSelectedReport(report);
    };

    const handleSaveScanNotes = () => {
        if (!selectedScan) return;
        // In a real app, you would save `scanNotes` to the Firestore document for the scan.
        console.log('Saving notes for scan:', selectedScan.id, 'Notes:', scanNotes);
        toast({
            title: 'Notes Saved',
            description: 'Your notes for the scan have been saved.',
        });
        setSelectedScan(null);
    };

    if (isLoading) {
        return <div>Loading patient records...</div>
    }

    return (
        <>
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
                <CardHeader className="bg-white border-b border-slate-100 p-8 flex-row items-center gap-6 space-y-0">
                     <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                        <AvatarImage src={patient?.avatarUrl} alt={patient?.firstName} data-ai-hint="person portrait" />
                        <AvatarFallback className="text-3xl">{patient?.firstName?.[0]}{patient?.lastName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-1">
                        <CardTitle className="text-4xl font-black text-slate-900 tracking-tight">{patient?.firstName} {patient?.lastName}</CardTitle>
                        <CardDescription className="text-base">
                            DOB: {patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'} | Email: {patient?.email}
                        </CardDescription>
                    </div>
                    <div className="ml-auto">
                        <Button onClick={() => setIsPrescribing(true)} className="rounded-lg h-11 px-6 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Prescription
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                     <div className="mb-8">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Patient Vitals & Profile</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                             <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="p-3 bg-red-100 rounded-lg text-red-600"><Heart className="w-5 h-5"/></div>
                                <div>
                                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Blood Group</div>
                                    <div className="text-lg font-black text-slate-800">{patient?.bloodGroup || 'N/A'}</div>
                                </div>
                            </div>
                             <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="p-3 bg-blue-100 rounded-lg text-blue-600"><Ruler className="w-5 h-5"/></div>
                                <div>
                                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Height</div>
                                    <div className="text-lg font-black text-slate-800">{patient?.height ? `${patient.height} cm` : 'N/A'}</div>
                                </div>
                            </div>
                             <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="p-3 bg-green-100 rounded-lg text-green-600"><Weight className="w-5 h-5"/></div>
                                <div>
                                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Weight</div>
                                    <div className="text-lg font-black text-slate-800">{patient?.weight ? `${patient.weight} kg` : 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <Card className="shadow-none border-slate-100 bg-slate-50/50">
                                <CardHeader className="p-4">
                                    <CardTitle className="text-base flex items-center gap-2 text-slate-800"><ShieldAlert className="w-5 h-5 text-yellow-600" /> Known Allergies</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    {allergies && allergies.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {allergies.map(allergy => <Badge key={allergy.id} variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">{allergy.name}</Badge>)}
                                        </div>
                                    ) : <p className="text-sm text-muted-foreground">No known allergies recorded.</p>}
                                </CardContent>
                            </Card>
                             <Card className="shadow-none border-slate-100 bg-slate-50/50">
                                <CardHeader className="p-4">
                                    <CardTitle className="text-base flex items-center gap-2 text-slate-800"><Heart className="w-5 h-5 text-red-600" /> Chronic Conditions</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    {chronicConditions && chronicConditions.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {chronicConditions.map(condition => <Badge key={condition.id} variant="outline" className="bg-red-100 text-red-800 border-red-200">{condition.name}</Badge>)}
                                        </div>
                                    ) : <p className="text-sm text-muted-foreground">No chronic conditions recorded.</p>}
                                </CardContent>
                            </Card>
                         </div>
                    </div>
                     <Tabs defaultValue="reports">
                        <TabsList className="bg-slate-100">
                            <TabsTrigger value="reports">Medical Reports</TabsTrigger>
                            <TabsTrigger value="scans">Scan Images</TabsTrigger>
                            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
                        </TabsList>
                        <Separator className="my-6"/>
                        <TabsContent value="reports">
                           <div className="space-y-4">
                            {medicalReports?.map(report => (
                               <Card key={report.id} className="border border-slate-100 rounded-lg hover:bg-slate-50/50 transition-colors p-4 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <FileText className="h-6 w-6 text-primary" />
                                        <div>
                                            <div className="font-bold text-slate-800">{report.reportType}</div>
                                            <div className="text-sm text-muted-foreground">Uploaded on {new Date(report.uploadDate).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className="text-sm text-muted-foreground max-w-md truncate">{report.aiSummary}</p>
                                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenReportViewer(report); }}>
                                            <Download className="mr-2 h-4 w-4" />
                                            View Report
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                           </div>
                           {medicalReports?.length === 0 && <p className="text-center text-muted-foreground py-8">No medical reports found.</p>}
                        </TabsContent>
                        <TabsContent value="scans">
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {scanImages?.map(scan => (
                                     <Collapsible key={scan.id} asChild>
                                        <Card className="flex flex-col">
                                            <CardHeader className="p-0">
                                                <div className="relative aspect-video w-full rounded-t-lg overflow-hidden">
                                                    <Image src={scan.imageUrl} alt={`Scan from ${new Date(scan.uploadDate).toLocaleDateString()}`} fill className='object-cover group-hover:scale-105 transition-transform duration-300' data-ai-hint="medical scan" />
                                                    <div className="absolute top-2 right-2">
                                                        <Badge variant={scan.aiAnalysis.urgencyClassification === 'Emergency' || scan.aiAnalysis.urgencyClassification === 'Urgent' ? 'destructive' : 'secondary'}>{scan.aiAnalysis.urgencyClassification}</Badge>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-4 flex-grow">
                                                <CardTitle className="text-base">{scan.scanType}</CardTitle>
                                                <CardDescription>Uploaded on {new Date(scan.uploadDate).toLocaleDateString()}</CardDescription>
                                                 <p className="text-sm text-muted-foreground mt-2 line-clamp-2 text-ellipsis">{scan.aiAnalysis.summary}</p>
                                            </CardContent>
                                            <CardFooter className="p-4 pt-0 flex justify-between">
                                                <Button variant="default" size="sm" onClick={() => handleOpenScanViewer(scan)}>View Full Analysis</Button>
                                                <CollapsibleTrigger asChild>
                                                    <Button variant="ghost" size="sm">Details <ChevronDown className="ml-1 h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" /></Button>
                                                </CollapsibleTrigger>
                                            </CardFooter>
                                             <CollapsibleContent asChild>
                                                <div className="p-4 pt-0">
                                                    <Separator className="mb-4" />
                                                    <div className="space-y-2 text-xs">
                                                        {scan.aiAnalysis.criticalFindings && <div><strong className="text-destructive">Critical:</strong> {scan.aiAnalysis.criticalFindings}</div>}
                                                        {scan.aiAnalysis.keyFindings && <div><strong>Key Findings:</strong> {scan.aiAnalysis.keyFindings}</div>}
                                                    </div>
                                                </div>
                                             </CollapsibleContent>
                                        </Card>
                                     </Collapsible>
                                ))}
                             </div>
                             {scanImages?.length === 0 && <p className="text-center text-muted-foreground py-8">No scan images found.</p>}
                        </TabsContent>
                         <TabsContent value="prescriptions">
                           {prescriptions?.map((prescription) => (
                                <Card key={prescription.id} className="mb-4 bg-slate-50 border-slate-100 shadow-sm">
                                    <CardHeader className="p-4">
                                        <CardTitle className="text-base flex justify-between">
                                            <span className="font-bold text-slate-800">Prescription - {new Date(prescription.date).toLocaleDateString()}</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <ul className="space-y-3">
                                        {prescription.medicines.map((med, i) => (
                                            <li key={i} className="text-sm flex justify-between border-b border-slate-100 pb-2">
                                                <span className="font-semibold text-slate-700">{med.name}</span>
                                                <span className="text-muted-foreground">{med.dosage} ({med.frequency})</span>
                                            </li>
                                        ))}
                                        </ul>
                                        {prescription.notes && <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-slate-100"><strong>Notes:</strong> {prescription.notes}</p>}
                                    </CardContent>
                                </Card>
                            ))}
                            {prescriptions?.length === 0 && <p className="text-center text-muted-foreground py-8">No prescriptions found.</p>}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>

        {/* Prescription Dialog */}
        <Dialog open={isPrescribing} onOpenChange={setIsPrescribing}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Create New Prescription for {patient?.firstName}</DialogTitle>
                    <DialogDescription>
                        Add medicines and notes for this prescription.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {medicines.map((med, index) => (
                        <div key={index} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end p-3 bg-slate-50 rounded-lg">
                            <div className="grid gap-1.5">
                                <Label htmlFor={`name-${index}`}>Medicine Name</Label>
                                <Input id={`name-${index}`} value={med.name} onChange={(e) => handleMedicineChange(index, 'name', e.target.value)} placeholder="e.g., Paracetamol" />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor={`dosage-${index}`}>Dosage</Label>
                                <Input id={`dosage-${index}`} value={med.dosage} onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)} placeholder="e.g., 500mg" />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor={`frequency-${index}`}>Frequency</Label>
                                <Input id={`frequency-${index}`} value={med.frequency} onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)} placeholder="e.g., Twice a day" />
                            </div>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveMedicine(index)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={handleAddMedicine} className="mt-2 w-full">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Another Medicine
                    </Button>
                    <div className="grid gap-2 mt-4">
                        <Label htmlFor="notes">Additional Notes</Label>
                        <Textarea id="notes" value={prescriptionNotes} onChange={(e) => setPrescriptionNotes(e.target.value)} placeholder="e.g., Take after meals" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsPrescribing(false)}>Cancel</Button>
                    <Button onClick={handleCreatePrescription}>Save Prescription</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
         {/* Scan Viewer Dialog */}
        <Dialog open={!!selectedScan} onOpenChange={(open) => !open && setSelectedScan(null)}>
            <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 border-b bg-slate-50/50">
                    <DialogTitle className="text-2xl font-bold">{selectedScan?.scanType} Scan Analysis</DialogTitle>
                    <DialogDescription>
                        Patient: {patient?.firstName} {patient?.lastName} | Uploaded: {selectedScan ? new Date(selectedScan.uploadDate).toLocaleDateString() : ''}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 flex-1 min-h-0">
                    {/* Image Column */}
                    <div className="relative bg-slate-900 flex items-center justify-center overflow-hidden border-r border-slate-200">
                       {selectedScan && <Image src={selectedScan.imageUrl} alt="Medical Scan" fill className="object-contain" />}
                       <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none"></div>
                    </div>
                    {/* Analysis & Notes Column */}
                    <div className="flex flex-col gap-4 overflow-y-auto p-6">
                        <div>
                            <h3 className="font-semibold text-lg flex items-center gap-2 mb-3"><BrainCircuit className="w-5 h-5 text-primary" /> AI-Powered Analysis</h3>
                            <div className="space-y-5 text-sm">
                                <div className="space-y-1 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <h4 className="font-semibold text-slate-800">Summary</h4>
                                    <p className="text-slate-600 leading-relaxed">{selectedScan?.aiAnalysis.summary}</p>
                                </div>
                                {selectedScan?.aiAnalysis.criticalFindings && (<div className="space-y-1 bg-red-50 p-4 rounded-lg border border-red-100">
                                    <h4 className="font-semibold text-red-700 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Critical Findings</h4>
                                    <p className="text-red-900 leading-relaxed">{selectedScan?.aiAnalysis.criticalFindings}</p>
                                </div>)}
                                {selectedScan?.aiAnalysis.keyFindings && (<div className="space-y-1 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <h4 className="font-semibold text-blue-700 flex items-center gap-2"><Microscope className="w-4 h-4"/> Key Findings</h4>
                                    <p className="text-blue-900 leading-relaxed">{selectedScan?.aiAnalysis.keyFindings}</p>
                                </div>)}
                                 {selectedScan?.aiAnalysis.healthIssues && (<div className="space-y-1">
                                    <h4 className="font-semibold text-slate-800">Potential Health Issues</h4>
                                    <p className="text-slate-600 leading-relaxed">{selectedScan?.aiAnalysis.healthIssues}</p>
                                </div>)}
                                 <div className="grid grid-cols-2 gap-4 pt-2">
                                    {selectedScan?.aiAnalysis.recommendedSpecialists && (<div className="space-y-1">
                                        <h4 className="font-semibold text-slate-800 flex items-center gap-2"><Stethoscope className="w-4 h-4"/> Specialists</h4>
                                        <p className="text-slate-600 leading-relaxed">{selectedScan?.aiAnalysis.recommendedSpecialists}</p>
                                    </div>)}
                                    {selectedScan?.aiAnalysis.recommendedMedications && (<div className="space-y-1">
                                        <h4 className="font-semibold text-slate-800 flex items-center gap-2"><Pill className="w-4 h-4"/> Medications</h4>
                                        <p className="text-slate-600 leading-relaxed">{selectedScan?.aiAnalysis.recommendedMedications}</p>
                                    </div>)}
                                 </div>
                                  <div className="flex justify-between items-center bg-slate-100 p-3 rounded-lg mt-2">
                                    <h4 className="font-semibold text-slate-800">Urgency Classification</h4>
                                    <Badge variant={selectedScan?.aiAnalysis.urgencyClassification === 'Emergency' ? 'destructive' : 'secondary'}>{selectedScan?.aiAnalysis.urgencyClassification}</Badge>
                                  </div>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col gap-2 pt-4 border-t">
                            <h3 className="font-semibold text-lg">Doctor's Notes</h3>
                            <Textarea 
                                className="flex-1 resize-none bg-slate-50" 
                                placeholder="Add your observations and treatment plan here..."
                                value={scanNotes}
                                onChange={(e) => setScanNotes(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                 <DialogFooter className="p-6 border-t bg-slate-50/50">
                    <Button variant="outline" onClick={() => setSelectedScan(null)}>Close</Button>
                    <Button onClick={handleSaveScanNotes}>Save Notes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        {/* Report Viewer Dialog */}
        <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
            <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 border-b bg-slate-50/50">
                    <DialogTitle className="text-2xl font-bold">{selectedReport?.reportType} Analysis</DialogTitle>
                    <DialogDescription>
                        Patient: {patient?.firstName} {patient?.lastName} | Uploaded: {selectedReport ? new Date(selectedReport.uploadDate).toLocaleDateString() : ''}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 flex-1 min-h-0">
                    {/* Report Content Column */}
                    <div className="relative bg-slate-100 flex items-center justify-center overflow-hidden border-r border-slate-200">
                       {selectedReport && selectedReport.fileUrl.includes('image') ? (
                           <Image src={selectedReport.fileUrl} alt="Medical Report" fill className="object-contain" />
                       ) : (
                           <iframe src={selectedReport?.fileUrl} className="w-full h-full" title={selectedReport?.reportType}></iframe>
                       )}
                    </div>
                    {/* Analysis Column */}
                    <div className="flex flex-col gap-4 overflow-y-auto p-6">
                        <div>
                           <h3 className="font-semibold text-lg flex items-center gap-2 mb-3"><BrainCircuit className="w-5 h-5 text-primary" /> AI-Powered Analysis</h3>
                            <div className="space-y-5 text-sm">
                                <div className="space-y-1 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <h4 className="font-semibold text-slate-800">Summary</h4>
                                    <p className="text-slate-600 leading-relaxed">{selectedReport?.aiSummary}</p>
                                </div>
                                <div className="space-y-1 bg-red-50 p-4 rounded-lg border border-red-100">
                                    <h4 className="font-semibold text-red-700 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Potential Issues</h4>
                                    <p className="text-red-900 leading-relaxed">{selectedReport?.aiPotentialIssues}</p>
                                </div>
                                <div className="space-y-1 bg-green-50 p-4 rounded-lg border border-green-100">
                                    <h4 className="font-semibold text-green-700 flex items-center gap-2"><ArrowRight className="w-4 h-4"/> Next Steps</h4>
                                    <p className="text-green-900 leading-relaxed">{selectedReport?.aiNextSteps}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                 <DialogFooter className="p-6 border-t bg-slate-50/50">
                    <Button variant="outline" onClick={() => setSelectedReport(null)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    )
}
