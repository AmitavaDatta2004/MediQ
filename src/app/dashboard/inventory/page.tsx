'use client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDoc, useUser, useFirestore, useMemoFirebase, setDocumentNonBlocking, useCollection, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { doc, collection, addDoc, query, orderBy } from 'firebase/firestore';
import type { Patient, Allergy, ChronicCondition, ScanImage, MedicalReport } from '@/lib/types';
import { useState, useEffect } from 'react';
import { X, Plus, Upload, Loader2, FileText, Download, BrainCircuit, AlertTriangle, ArrowRight, Microscope, Stethoscope, Pill } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';
import { analyzeMedicalDocumentAction, processMedicalImageAction, summarizeMedicalReportAction } from '@/app/actions';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';

export default function HealthInventoryPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [newAllergy, setNewAllergy] = useState('');
    const [newCondition, setNewCondition] = useState('');
    const [isUploadingReport, setIsUploadingReport] = useState(false);
    const [isUploadingScan, setIsUploadingScan] = useState(false);

    const [selectedScan, setSelectedScan] = useState<ScanImage | null>(null);
    const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);

    const patientDocRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'patients', user.uid);
    }, [firestore, user]);
    const { data: patient, isLoading: isPatientLoading } = useDoc<Patient>(patientDocRef);

    const allergiesCollectionRef = useMemoFirebase(() => {
        if (!user) return null;
        return collection(firestore, `patients/${user.uid}/allergies`);
    }, [firestore, user]);
    const { data: allergies, isLoading: isAllergiesLoading } = useCollection<Allergy>(allergiesCollectionRef);

    const conditionsCollectionRef = useMemoFirebase(() => {
        if (!user) return null;
        return collection(firestore, `patients/${user.uid}/chronic_conditions`);
    }, [firestore, user]);
    const { data: chronicConditions, isLoading: isConditionsLoading } = useCollection<ChronicCondition>(conditionsCollectionRef);
    
    // Queries for saved data
    const reportsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, `patients/${user.uid}/medical_reports`), orderBy('uploadDate', 'desc'));
    }, [firestore, user]);
    const { data: medicalReports, isLoading: isReportsLoading } = useCollection<MedicalReport>(reportsQuery);

    const scansQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, `patients/${user.uid}/scan_images`), orderBy('uploadDate', 'desc'));
    }, [firestore, user]);
    const { data: scanImages, isLoading: isScansLoading } = useCollection<ScanImage>(scansQuery);
  
    const [patientData, setPatientData] = useState<Partial<Patient>>({});

    useEffect(() => {
        if (patient) {
            setPatientData(patient);
        }
    }, [patient]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setPatientData(prev => ({...prev, [id]: value}));
    }

    const handleSaveChanges = () => {
        if (patientDocRef && patientData) {
            setDocumentNonBlocking(patientDocRef, patientData, { merge: true });
            toast({ title: 'Success', description: 'Your information has been updated.' });
        }
    }
    
    const handleAddAllergy = () => {
        if (newAllergy && allergiesCollectionRef) {
            addDocumentNonBlocking(allergiesCollectionRef, { name: newAllergy });
            setNewAllergy('');
            toast({ title: 'Allergy Added', description: `${newAllergy} has been added to your records.` });
        }
    }
    
    const handleRemoveItem = (collectionName: 'allergies' | 'chronic_conditions', id: string) => {
        if (!user) return;
        const itemRef = doc(firestore, `patients/${user.uid}/${collectionName}`, id);
        deleteDocumentNonBlocking(itemRef);
        toast({ title: 'Item Removed', description: 'The item has been removed from your records.' });
    }
    
    const handleAddCondition = () => {
        if (newCondition && conditionsCollectionRef) {
            addDocumentNonBlocking(conditionsCollectionRef, { name: newCondition });
            setNewCondition('');
            toast({ title: 'Condition Added', description: `${newCondition} has been added to your records.` });
        }
    }

    const handleReportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUploadingReport(true);
        toast({
            title: 'Uploading Report...',
            description: 'Please wait while we process and analyze your document.'
        });

        const reader = new FileReader();
        reader.onload = async (event) => {
            const dataUri = event.target?.result as string;
            try {
                // Get AI summary
                const analysisResult = await summarizeMedicalReportAction({ reportDataUri: dataUri });

                // Upload file to Firebase Storage
                const storage = getStorage();
                const storageRef = ref(storage, `patients/${user.uid}/medical_reports_archive/${uuidv4()}_${file.name}`);
                const snapshot = await uploadString(storageRef, dataUri, 'data_url');
                const downloadURL = await getDownloadURL(snapshot.ref);

                // Save analysis and file URL to Firestore
                const reportId = uuidv4();
                const reportCollectionRef = collection(firestore, `patients/${user.uid}/medical_reports`);
                const reportData: MedicalReport = {
                    id: reportId,
                    patientId: user.uid,
                    uploadDate: new Date().toISOString(),
                    reportType: file.type.startsWith('image') ? 'Image' : 'PDF Document',
                    fileUrl: downloadURL,
                    aiSummary: analysisResult.summary,
                    aiPotentialIssues: analysisResult.potentialIssues,
                    aiNextSteps: analysisResult.nextSteps,
                };
                await addDoc(reportCollectionRef, reportData);

                toast({
                  title: "Report Archived Successfully",
                  description: "Your report has been analyzed and saved to your health history.",
                });

            } catch (error) {
                console.error("Report upload error:", error);
                toast({
                    variant: "destructive",
                    title: "Upload Failed",
                    description: "There was an error archiving your report. Please try again.",
                });
            } finally {
                setIsUploadingReport(false);
            }
        };
        reader.readAsDataURL(file);
    };
    
    const handleScanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUploadingScan(true);
        toast({
            title: 'Uploading Scan...',
            description: 'Please wait while we analyze your scan.'
        });

        const reader = new FileReader();
        reader.onload = async (event) => {
            const dataUri = event.target?.result as string;
            try {
                const storage = getStorage();
                
                // 1. Upload original image and get URL
                const originalImageRef = ref(storage, `patients/${user.uid}/scan_images/${uuidv4()}_original_${file.name}`);
                await uploadString(originalImageRef, dataUri, 'data_url');
                const originalImageUrl = await getDownloadURL(originalImageRef);

                // 2. Denoise and crop image
                const processedResult = await processMedicalImageAction({ imageUrl: originalImageUrl });
                
                // 3. Upload processed image and get URL
                const processedImageRef = ref(storage, `patients/${user.uid}/scan_images/${uuidv4()}_processed_${file.name}`);
                await uploadString(processedImageRef, processedResult.analyzedImageUrl, 'data_url');
                const analyzedImageUrl = await getDownloadURL(processedImageRef);

                // 4. Analyze image for text data
                const scanType = 'X-ray'; // Could be dynamic in future
                const textResult = await analyzeMedicalDocumentAction({ 
                  imageUrl: originalImageUrl, 
                  scanType,
                  patientDetails: `Age: ${patient?.dateOfBirth ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() : 'N/A'}`
                });

                // 5. Save everything to Firestore
                const scanId = uuidv4();
                const scanCollectionRef = collection(firestore, `patients/${user.uid}/scan_images`);
                const scanData: ScanImage = {
                    id: scanId,
                    patientId: user.uid,
                    uploadDate: new Date().toISOString(),
                    scanType,
                    imageUrl: originalImageUrl,
                    analyzedImageUrl: analyzedImageUrl,
                    aiAnalysis: textResult
                };
                await addDoc(scanCollectionRef, scanData);

                toast({
                  title: "Scan Archived Successfully",
                  description: "Your scan has been analyzed and saved to your health history.",
                });

            } catch (error) {
                console.error("Scan upload error:", error);
                toast({
                    variant: "destructive",
                    title: "Upload Failed",
                    description: "There was an error archiving your scan. Please try again.",
                });
            } finally {
                setIsUploadingScan(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const isLoading = isPatientLoading || isAllergiesLoading || isConditionsLoading || isReportsLoading || isScansLoading;

    if (isLoading) {
        return <div>Loading your health inventory...</div>
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">Health Inventory</h1>
                <p className="text-muted-foreground mt-1">
                    A centralized, optional repository for your complete medical history. The more you add, the smarter our AI gets.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Health Background</CardTitle>
                            <CardDescription>Establishes baseline risk factors for the AI to contextualize your health data.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="height">Height (cm)</Label>
                                    <Input id="height" type="number" value={patientData.height || ''} onChange={handleInputChange} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="weight">Weight (kg)</Label>
                                    <Input id="weight" type="number" value={patientData.weight || ''} onChange={handleInputChange} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="bloodGroup">Blood Group</Label>
                                    <Input id="bloodGroup" value={patientData.bloodGroup || ''} onChange={handleInputChange} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                    <Input id="dateOfBirth" type="date" value={patientData.dateOfBirth ? new Date(patientData.dateOfBirth).toISOString().split('T')[0] : ''} onChange={handleInputChange} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Allergy & Sensitivity Records</CardTitle>
                            <CardDescription>Prevents dangerous medicine suggestions and improves prescription analysis.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {allergies?.map(allergy => (
                                    <Badge variant="secondary" key={allergy.id} className="text-base py-1 pl-3 pr-1">
                                        {allergy.name}
                                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={() => handleRemoveItem('allergies', allergy.id)}>
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                ))}
                            </div>
                            <div className="flex gap-2 mt-4">
                                <Input placeholder="Add a new allergy (e.g., Penicillin)" value={newAllergy} onChange={(e) => setNewAllergy(e.target.value)} />
                                <Button onClick={handleAddAllergy}><Plus className="mr-2 h-4 w-4" /> Add</Button>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>Past & Current Medical Conditions</CardTitle>
                            <CardDescription>Improves chronic disease risk assessment and helps doctors understand your health history.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="flex flex-wrap gap-2">
                                {chronicConditions?.map(condition => (
                                    <Badge variant="secondary" key={condition.id} className="text-base py-1 pl-3 pr-1">
                                        {condition.name}
                                         <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={() => handleRemoveItem('chronic_conditions', condition.id)}>
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                ))}
                            </div>
                            <div className="flex gap-2 mt-4">
                                <Input placeholder="Add a new condition (e.g., Hypertension)" value={newCondition} onChange={(e) => setNewCondition(e.target.value)} />
                                <Button onClick={handleAddCondition}><Plus className="mr-2 h-4 w-4" /> Add</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Archived Medical Reports</CardTitle>
                            <CardDescription>Upload past blood tests, lab results, and other documents to build your health history.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <label htmlFor="report-archive-upload" className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                                {isUploadingReport ? (
                                    <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                                ) : (
                                    <Upload className="w-8 h-8 text-muted-foreground" />
                                )}
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {isUploadingReport ? 'Processing...' : 'Upload Report'}
                                </p>
                                 <Input id="report-archive-upload" type="file" className="hidden" onChange={handleReportUpload} accept="image/*,application/pdf" disabled={isUploadingReport} />
                              </label>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Archived Imaging & Scans</CardTitle>
                            <CardDescription>Upload past X-Rays, CT Scans, and MRIs to provide a complete picture of your health journey.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <label htmlFor="scan-archive-upload" className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                                {isUploadingScan ? (
                                     <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                                ) : (
                                    <Upload className="w-8 h-8 text-muted-foreground" />
                                )}
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {isUploadingScan ? 'Processing...' : 'Upload Scan'}
                                </p>
                                 <Input id="scan-archive-upload" type="file" className="hidden" onChange={handleScanUpload} accept="image/*" disabled={isUploadingScan} />
                              </label>
                        </CardContent>
                    </Card>
                    <div className="flex justify-end">
                        <Button size="lg" onClick={handleSaveChanges}>Save All Changes</Button>
                    </div>
                </div>
            </div>

            <Separator />
            
            <Card>
                <CardHeader>
                    <CardTitle>My Medical Reports</CardTitle>
                    <CardDescription>A log of your uploaded and analyzed documents.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                                <Button variant="outline" size="sm" onClick={() => setSelectedReport(report)}>
                                    <Download className="mr-2 h-4 w-4" />
                                    View Report
                                </Button>
                            </div>
                        </Card>
                    ))}
                    {medicalReports?.length === 0 && <p className="text-center text-muted-foreground py-8">No medical reports found.</p>}
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>My Scan Images</CardTitle>
                    <CardDescription>A gallery of your uploaded and analyzed scans.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {scanImages?.map(scan => (
                             <Card key={scan.id} className="flex flex-col cursor-pointer group" onClick={() => setSelectedScan(scan)}>
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
                            </Card>
                        ))}
                     </div>
                     {scanImages?.length === 0 && <p className="text-center text-muted-foreground py-8">No scan images found.</p>}
                </CardContent>
            </Card>

            {/* Scan Viewer Dialog */}
            <Dialog open={!!selectedScan} onOpenChange={(open) => !open && setSelectedScan(null)}>
                <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0">
                    <DialogHeader className="p-6 border-b bg-slate-50/50">
                        <DialogTitle className="text-2xl font-bold">{selectedScan?.scanType} Scan Analysis</DialogTitle>
                        <DialogDescription>
                            Uploaded: {selectedScan ? new Date(selectedScan.uploadDate).toLocaleDateString() : ''}
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
                        </div>
                    </div>
                    <DialogFooter className="p-6 border-t bg-slate-50/50">
                        <Button variant="outline" onClick={() => setSelectedScan(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            {/* Report Viewer Dialog */}
            <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
                <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0">
                    <DialogHeader className="p-6 border-b bg-slate-50/50">
                        <DialogTitle className="text-2xl font-bold">{selectedReport?.reportType} Analysis</DialogTitle>
                        <DialogDescription>
                            Uploaded: {selectedReport ? new Date(selectedReport.uploadDate).toLocaleDateString() : ''}
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
        </div>
    )
}

    