'use client';
import { useState, useMemo } from 'react';
import { useDoc, useCollection, useUser, useFirestore, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import type { MedicalReport, ScanImage, Patient, Prescription, Doctor } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileText, Image as ImageIcon, Download, Stethoscope, PlusCircle, X } from 'lucide-react';
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

    const { data: medicalReports, isLoading: reportsLoading } = useCollection<MedicalReport>(reportsQuery);
    const { data: scanImages, isLoading: scansLoading } = useCollection<ScanImage>(scansQuery);
    const { data: prescriptions, isLoading: prescriptionsLoading } = useCollection<Prescription>(prescriptionsQuery);
    
    const isLoading = reportsLoading || scansLoading || patientLoading || prescriptionsLoading;

    const handleAddMedicine = () => {
        setMedicines([...medicines, { name: '', dosage: '', frequency: '' }]);
    };

    const handleMedicineChange = (index: number, field: string, value: string) => {
        const newMedicines = [...medicines];
        newMedicines[index] = { ...newMedicines[index], [field]: value };
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

        const prescriptionRef = doc(firestore, `patients/${patientId}/prescriptions`, prescriptionId);
        await addDoc(collection(firestore, `patients/${patientId}/prescriptions`), prescriptionData);

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
                     <Tabs defaultValue="reports">
                        <TabsList className="bg-slate-100">
                            <TabsTrigger value="reports">Medical Reports</TabsTrigger>
                            <TabsTrigger value="scans">Scan Images</TabsTrigger>
                            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
                        </TabsList>
                        <Separator className="my-6"/>
                        <TabsContent value="reports">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Report</TableHead>
                                        <TableHead>Uploaded On</TableHead>
                                        <TableHead>Summary</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {medicalReports?.map(report => (
                                        <TableRow key={report.id}>
                                            <TableCell className="font-medium flex items-center gap-2">
                                                <FileText className="h-5 w-5 text-primary" />
                                                <span>{report.reportType}</span>
                                            </TableCell>
                                            <TableCell>{new Date(report.uploadDate).toLocaleDateString()}</TableCell>
                                            <TableCell className="max-w-xs truncate">{report.aiSummary}</TableCell>
                                            <TableCell className="text-right">
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={report.fileUrl} target="_blank" rel="noopener noreferrer">
                                                        <Download className="mr-2 h-4 w-4" />
                                                        View
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {medicalReports?.length === 0 && <p className="text-center text-muted-foreground py-8">No medical reports found.</p>}
                        </TabsContent>
                        <TabsContent value="scans">
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {scanImages?.map(scan => (
                                    <Card key={scan.id} className="cursor-pointer hover:shadow-lg transition-shadow group" onClick={() => handleOpenScanViewer(scan)}>
                                        <CardHeader className="p-0">
                                            <div className="relative aspect-video w-full rounded-t-lg overflow-hidden">
                                                <Image src={scan.imageUrl} alt={`Scan from ${new Date(scan.uploadDate).toLocaleDateString()}`} fill className='object-cover group-hover:scale-105 transition-transform duration-300' data-ai-hint="medical scan" />
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4">
                                            <CardTitle className="text-base">{scan.scanType}</CardTitle>
                                            <CardDescription>Uploaded on {new Date(scan.uploadDate).toLocaleDateString()}</CardDescription>
                                            <div className="flex items-center justify-between mt-3">
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Urgency:</span>
                                                <Badge variant={scan.aiAnalysis.urgencyClassification === 'Emergency' || scan.aiAnalysis.urgencyClassification === 'Urgent' ? 'destructive' : 'secondary'}>{scan.aiAnalysis.urgencyClassification}</Badge>
                                            </div>
                                             <p className="text-sm text-muted-foreground mt-2 line-clamp-2 text-ellipsis">{scan.aiAnalysis.summary}</p>
                                        </CardContent>
                                    </Card>
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
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Create New Prescription for {patient?.firstName}</DialogTitle>
                    <DialogDescription>
                        Add medicines and notes for this prescription.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {medicines.map((med, index) => (
                        <div key={index} className="grid grid-cols-3 gap-4 items-end">
                            <div className="grid gap-2">
                                <Label htmlFor={`name-${index}`}>Medicine Name</Label>
                                <Input id={`name-${index}`} value={med.name} onChange={(e) => handleMedicineChange(index, 'name', e.target.value)} placeholder="e.g., Paracetamol" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor={`dosage-${index}`}>Dosage</Label>
                                <Input id={`dosage-${index}`} value={med.dosage} onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)} placeholder="e.g., 500mg" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor={`frequency-${index}`}>Frequency</Label>
                                <Input id={`frequency-${index}`} value={med.frequency} onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)} placeholder="e.g., Twice a day" />
                            </div>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={handleAddMedicine} className="mt-2">
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
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Scan Viewer: {selectedScan?.scanType}</DialogTitle>
                    <DialogDescription>
                        Uploaded on {selectedScan ? new Date(selectedScan.uploadDate).toLocaleDateString() : ''}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
                    <div className="relative bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                       {selectedScan && <Image src={selectedScan.imageUrl} alt="Medical Scan" layout="fill" objectFit="contain" />}
                    </div>
                    <div className="flex flex-col gap-4">
                        <h3 className="font-semibold">Doctor's Notes</h3>
                        <Textarea 
                            className="flex-1 resize-none" 
                            placeholder="Add your observations here..."
                            value={scanNotes}
                            onChange={(e) => setScanNotes(e.target.value)}
                        />
                         <Button onClick={handleSaveScanNotes}>Save Notes</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        </>
    )
}
