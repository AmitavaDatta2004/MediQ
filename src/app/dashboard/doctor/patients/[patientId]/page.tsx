'use client';
import { useState } from 'react';
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
import { FileText, Image as ImageIcon, Download, Stethoscope, PlusCircle } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { useParams } from 'next/navigation';
import { addDoc } from 'firebase/firestore';

export default function PatientRecordPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const params = useParams();
    const patientId = params.patientId as string;

    const [isPrescribing, setIsPrescribing] = useState(false);
    const [medicines, setMedicines] = useState([{ name: '', dosage: '', frequency: '' }]);
    const [prescriptionNotes, setPrescriptionNotes] = useState('');

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

    if (isLoading) {
        return <div>Loading patient records...</div>
    }

    return (
        <>
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                     <Avatar className="h-20 w-20">
                        <AvatarImage src={patient?.avatarUrl} alt={patient?.firstName} data-ai-hint="person portrait" />
                        <AvatarFallback>{patient?.firstName?.[0]}{patient?.lastName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-3xl">{patient?.firstName} {patient?.lastName}</CardTitle>
                        <CardDescription>
                            DOB: {patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'} | Email: {patient?.email}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardFooter>
                    <Button onClick={() => setIsPrescribing(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Prescription
                    </Button>
                </CardFooter>
            </Card>

            <Tabs defaultValue="reports">
                <TabsList>
                    <TabsTrigger value="reports">Medical Reports</TabsTrigger>
                    <TabsTrigger value="scans">Scan Images</TabsTrigger>
                    <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
                </TabsList>
                <TabsContent value="reports">
                    <Card>
                        <CardHeader>
                            <CardTitle>Medical Reports</CardTitle>
                            <CardDescription>All uploaded and analyzed documents for {patient?.firstName}.</CardDescription>
                        </CardHeader>
                        <CardContent>
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
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="scans">
                    <Card>
                        <CardHeader>
                            <CardTitle>Scan Images</CardTitle>
                            <CardDescription>All uploaded and analyzed scans for {patient?.firstName}.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {scanImages?.map(scan => (
                                    <Card key={scan.id}>
                                        <CardHeader>
                                            <div className="relative aspect-video w-full rounded-md overflow-hidden">
                                                <Image src={scan.imageUrl} alt={`Scan from ${new Date(scan.uploadDate).toLocaleDateString()}`} fill className='object-cover' data-ai-hint="medical scan" />
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <CardTitle className="text-lg">{scan.scanType}</CardTitle>
                                            <CardDescription>Uploaded on {new Date(scan.uploadDate).toLocaleDateString()}</CardDescription>
                                            <div className="flex items-center justify-between mt-4">
                                                <span className="text-sm font-medium">Urgency:</span>
                                                <Badge variant={scan.aiAnalysis.urgencyClassification === 'Emergency' || scan.aiAnalysis.urgencyClassification === 'Urgent' ? 'destructive' : 'secondary'}>{scan.aiAnalysis.urgencyClassification}</Badge>
                                            </div>
                                             <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{scan.aiAnalysis.summary}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                             </div>
                             {scanImages?.length === 0 && <p className="text-center text-muted-foreground py-8">No scan images found.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="prescriptions">
                    <Card>
                        <CardHeader>
                            <CardTitle>Prescription History</CardTitle>
                            <CardDescription>All prescriptions issued to {patient?.firstName}.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           {prescriptions?.map((prescription) => (
                                <Card key={prescription.id} className="mb-4">
                                    <CardHeader>
                                        <CardTitle className="text-base flex justify-between">
                                            <span>Prescription - {new Date(prescription.date).toLocaleDateString()}</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                        {prescription.medicines.map((med, i) => (
                                            <li key={i} className="text-sm">
                                                <span className="font-semibold">{med.name}</span> - {med.dosage} ({med.frequency})
                                            </li>
                                        ))}
                                        </ul>
                                        {prescription.notes && <p className="text-xs text-muted-foreground mt-2">Notes: {prescription.notes}</p>}
                                    </CardContent>
                                </Card>
                            ))}
                            {prescriptions?.length === 0 && <p className="text-center text-muted-foreground py-8">No prescriptions found.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>

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
        </>
    )
}
