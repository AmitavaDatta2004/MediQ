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
import { doc, collection, addDoc } from 'firebase/firestore';
import type { Patient, Allergy, ChronicCondition } from '@/lib/types';
import { useState, useEffect } from 'react';
import { X, Plus, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';
import { analyzeScanForAnomaliesAction, summarizeMedicalReportAction } from '@/app/actions';

export default function HealthInventoryPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [newAllergy, setNewAllergy] = useState('');
    const [newCondition, setNewCondition] = useState('');
    const [isUploadingReport, setIsUploadingReport] = useState(false);
    const [isUploadingScan, setIsUploadingScan] = useState(false);

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
                await addDoc(reportCollectionRef, {
                    id: reportId,
                    patientId: user.uid,
                    uploadDate: new Date().toISOString(),
                    reportType: file.type.startsWith('image') ? 'Image' : 'PDF Document',
                    fileUrl: downloadURL,
                    aiSummary: analysisResult.summary,
                    aiPotentialIssues: analysisResult.potentialIssues,
                    aiNextSteps: analysisResult.nextSteps,
                });

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
                // Defaulting to X-ray for now, could add a select later
                const scanType = 'X-ray'; 
                const analysisResult = await analyzeScanForAnomaliesAction({ scanDataUri: dataUri, scanType });

                // Upload scan to Firebase Storage
                const storage = getStorage();
                const storageRef = ref(storage, `patients/${user.uid}/scan_images_archive/${uuidv4()}_${file.name}`);
                const snapshot = await uploadString(storageRef, dataUri, 'data_url');
                const downloadURL = await getDownloadURL(snapshot.ref);

                // Save analysis and file URL to Firestore
                const scanId = uuidv4();
                const scanCollectionRef = collection(firestore, `patients/${user.uid}/scan_images`);
                await addDoc(scanCollectionRef, {
                    id: scanId,
                    patientId: user.uid,
                    uploadDate: new Date().toISOString(),
                    scanType,
                    imageUrl: downloadURL,
                    aiAnalysis: {
                        anomaliesDetected: analysisResult.anomaliesDetected,
                        anomalyReport: analysisResult.anomalyReport,
                        heatmapDataUri: analysisResult.heatmapDataUri,
                        urgencyClassification: analysisResult.urgencyClassification
                    }
                });

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

    const isLoading = isPatientLoading || isAllergiesLoading || isConditionsLoading;

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
                    
                    <div className="flex justify-end">
                        <Button size="lg" onClick={handleSaveChanges}>Save All Changes</Button>
                    </div>
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
                </div>
            </div>
        </div>
    )
}
