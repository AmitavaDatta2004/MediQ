'use client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useDoc, useUser, useFirestore, useMemoFirebase, setDocumentNonBlocking, useCollection, addDocumentNonBlocking } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import type { Patient, Allergy, ChronicCondition } from '@/lib/types';
import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
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
    const { data: allergies } = useCollection<Allergy>(allergiesCollectionRef);

    const conditionsCollectionRef = useMemoFirebase(() => {
        if (!user) return null;
        return collection(firestore, `patients/${user.uid}/chronic_conditions`);
    }, [firestore, user]);
    const { data: chronicConditions } = useCollection<ChronicCondition>(conditionsCollectionRef);
  
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
    
    const handleAddCondition = () => {
        if (newCondition && conditionsCollectionRef) {
            addDocumentNonBlocking(conditionsCollectionRef, { name: newCondition });
            setNewCondition('');
        }
    }

    if (isPatientLoading) {
        return <div>Loading your health inventory...</div>
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">My Health Inventory</h1>
                <p className="text-muted-foreground">
                    A centralized repository for your complete medical history. The more you add, the smarter our AI gets.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Personal Health Background</CardTitle>
                    <CardDescription>Establishes baseline risk factors for the AI.</CardDescription>
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
                                <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
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
                                 <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
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
    )
}
