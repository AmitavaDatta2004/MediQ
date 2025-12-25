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
import { doc, collection } from 'firebase/firestore';
import type { Patient, Allergy, ChronicCondition } from '@/lib/types';
import { useState, useEffect } from 'react';
import { X, Plus, FileScan, HeartPulse, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function HealthInventoryPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [newAllergy, setNewAllergy] = useState('');
    const [newCondition, setNewCondition] = useState('');

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
        }
    }
    
    const handleRemoveItem = (collectionName: 'allergies' | 'chronic_conditions', id: string) => {
        if (!user) return;
        const itemRef = doc(firestore, `patients/${user.uid}/${collectionName}`, id);
        deleteDocumentNonBlocking(itemRef);
    }
    
    const handleAddCondition = () => {
        if (newCondition && conditionsCollectionRef) {
            addDocumentNonBlocking(conditionsCollectionRef, { name: newCondition });
            setNewCondition('');
        }
    }

    const handleFileUpload = (fileType: string) => {
        toast({
            title: `Uploading ${fileType}...`,
            description: "This feature is coming soon!"
        })
    }

    const isLoading = isPatientLoading || isAllergiesLoading || isConditionsLoading;

    if (isLoading) {
        return <div>Loading your health inventory...</div>
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">My Health Inventory</h1>
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
                                <Upload className="w-8 h-8 text-muted-foreground" />
                                <p className="mt-2 text-sm text-muted-foreground">Upload Report</p>
                                 <Input id="report-archive-upload" type="file" className="hidden" onChange={() => handleFileUpload('report')} accept="image/*,application/pdf" />
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
                                <Upload className="w-8 h-8 text-muted-foreground" />
                                <p className="mt-2 text-sm text-muted-foreground">Upload Scan</p>
                                 <Input id="scan-archive-upload" type="file" className="hidden" onChange={() => handleFileUpload('scan')} accept="image/*" />
                              </label>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
