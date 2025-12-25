
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
import { setDocumentNonBlocking, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Patient } from '@/lib/types';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PatientProfileForm({ patient }: { patient: Patient }) {
  const firestore = useFirestore();
  const [patientData, setPatientData] = useState<Partial<Patient>>({});

  useEffect(() => {
    if (patient) {
      setPatientData({
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        avatarUrl: patient.avatarUrl,
      });
    }
  }, [patient]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setPatientData(prev => ({...prev, [id]: value}));
  }

  const handleSaveChanges = () => {
    const patientDocRef = doc(firestore, 'patients', patient.id);
    if (patientDocRef && patientData) {
      setDocumentNonBlocking(patientDocRef, patientData, { merge: true });
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
          <CardDescription>
            Manage your personal and account information. For health records, please visit the <Link href="/dashboard/inventory" className="text-primary underline">Health Inventory</Link>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={patientData.avatarUrl} alt={`${patientData.firstName} ${patientData.lastName}`} data-ai-hint="person portrait"/>
                <AvatarFallback>{patientData.firstName?.[0]}{patientData.lastName?.[0]}</AvatarFallback>
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
