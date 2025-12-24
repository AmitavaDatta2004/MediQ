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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useDoc, useUser, useFirestore, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import type { Patient, Allergy, ChronicCondition } from '@/lib/types';
import { useCollection } from '@/firebase';
import { useState, useEffect } from 'react';

export default function ProfilePage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const patientDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: patient, isLoading: isPatientLoading } = useDoc<Patient>(patientDocRef);

  const allergiesCollectionRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/allergies`);
  }, [firestore, user]);
  const { data: allergies, isLoading: isAllergiesLoading } = useCollection<Allergy>(allergiesCollectionRef);

  const conditionsCollectionRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/chronic_conditions`);
  }, [firestore, user]);
  const { data: chronicConditions, isLoading: isConditionsLoading } = useCollection<ChronicCondition>(conditionsCollectionRef);
  
  const [patientData, setPatientData] = useState<Partial<Patient>>({});

  useEffect(() => {
    if (patient) {
      setPatientData({
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        dateOfBirth: patient.dateOfBirth,
      });
    }
  }, [patient]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setPatientData(prev => ({...prev, [id]: value}));
  }

  const handleSaveChanges = () => {
    if (patientDocRef && patientData) {
      setDocumentNonBlocking(patientDocRef, patientData, { merge: true });
    }
  }
  
  const isLoading = isPatientLoading || isAllergiesLoading || isConditionsLoading;

  if (isLoading) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
          <CardDescription>
            Manage your personal and health information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={patient?.avatarUrl} alt={`${patient?.firstName} ${patient?.lastName}`} data-ai-hint="person portrait"/>
                <AvatarFallback>{patient?.firstName?.[0]}{patient?.lastName?.[0]}</AvatarFallback>
              </Avatar>
              <Button>Change Photo</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={patientData.firstName || ''} onChange={handleInputChange} />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={patientData.lastName || ''} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={patientData.email || ''} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input id="dateOfBirth" type="date" value={patientData.dateOfBirth ? new Date(patientData.dateOfBirth).toISOString().split('T')[0] : ''} onChange={handleInputChange} />
                </div>
            </div>
            <div className="grid gap-2">
              <Label>Allergies</Label>
              <div className="flex flex-wrap gap-2">
                {allergies?.map(allergy => <Badge variant="secondary" key={allergy.id}>{allergy.name}</Badge>)}
              </div>
              <Input placeholder="Add new allergy..." />
            </div>
             <div className="grid gap-2">
              <Label>Chronic Conditions</Label>
              <div className="flex flex-wrap gap-2">
                {chronicConditions?.map(condition => <Badge variant="secondary" key={condition.id}>{condition.name}</Badge>)}
              </div>
              <Input placeholder="Add new condition..." />
            </div>
          </form>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleSaveChanges}>Save Changes</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
