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
import { setDocumentNonBlocking, useFirestore, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Doctor } from '@/lib/types';
import { useState, useEffect } from 'react';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2 } from 'lucide-react';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export default function DoctorProfileForm({ doctor }: { doctor: Doctor }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [doctorData, setDoctorData] = useState<Partial<Doctor>>({});

  useEffect(() => {
    if (doctor) {
      setDoctorData(doctor);
    }
  }, [doctor]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    const finalValue = type === 'number' ? Number(value) : value;
    setDoctorData(prev => ({ ...prev, [id]: finalValue }));
  }

  const handleAvailabilityChange = (index: number, field: 'day' | 'startTime' | 'endTime', value: string) => {
    const newAvailability = [...(doctorData.availability || [])];
    newAvailability[index] = { ...newAvailability[index], [field]: value };
    setDoctorData(prev => ({ ...prev, availability: newAvailability }));
  };

  const addAvailabilitySlot = () => {
    const newAvailability = [...(doctorData.availability || [])];
    newAvailability.push({ day: 'Monday', startTime: '09:00', endTime: '17:00' });
    setDoctorData(prev => ({ ...prev, availability: newAvailability }));
  };
  
  const removeAvailabilitySlot = (index: number) => {
    const newAvailability = [...(doctorData.availability || [])];
    newAvailability.splice(index, 1);
    setDoctorData(prev => ({ ...prev, availability: newAvailability }));
  };

  const handleSaveChanges = () => {
    if (!user) return;
    const doctorDocRef = doc(firestore, 'doctors', user.uid);
    if (doctorDocRef && doctorData) {
      setDocumentNonBlocking(doctorDocRef, doctorData, { merge: true });
      toast({ title: 'Profile Updated', description: 'Your professional information has been saved.' });
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Doctor Profile</CardTitle>
          <CardDescription>
            Manage your professional information. This will be visible to patients and used for intelligent appointment scheduling.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-8">
            <div>
              <h3 className="text-lg font-medium">Professional Details</h3>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={doctorData.firstName || ''} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={doctorData.lastName || ''} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="specialty">Specialty</Label>
                  <Input id="specialty" value={doctorData.specialty || ''} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location (City, State)</Label>
                  <Input id="location" value={doctorData.location || ''} onChange={handleInputChange} />
                </div>
                <div className="md:col-span-2 grid gap-2">
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea id="bio" placeholder="A brief summary of your background, expertise, and philosophy of care..." value={doctorData.bio || ''} onChange={handleInputChange} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium">Practice Management</h3>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="consultationFee">Consultation Fee ($)</Label>
                  <Input id="consultationFee" type="number" value={doctorData.consultationFee || ''} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="patientsPerDay">Maximum Patients Per Day</Label>
                  <Input id="patientsPerDay" type="number" value={doctorData.patientsPerDay || ''} onChange={handleInputChange} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium">Weekly Availability</h3>
              <Separator className="my-4" />
              <div className="space-y-4">
                {doctorData.availability?.map((slot, index) => (
                  <div key={index} className="grid grid-cols-4 items-center gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="grid gap-2">
                        <Label htmlFor={`day-${index}`}>Day</Label>
                        <select id={`day-${index}`} value={slot.day} onChange={(e) => handleAvailabilityChange(index, 'day', e.target.value)} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                            {daysOfWeek.map(day => <option key={day} value={day}>{day}</option>)}
                        </select>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor={`startTime-${index}`}>Start Time</Label>
                        <Input id={`startTime-${index}`} type="time" value={slot.startTime || ''} onChange={(e) => handleAvailabilityChange(index, 'startTime', e.target.value)} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor={`endTime-${index}`}>End Time</Label>
                        <Input id={`endTime-${index}`} type="time" value={slot.endTime || ''} onChange={(e) => handleAvailabilityChange(index, 'endTime', e.target.value)} />
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="mt-6 text-destructive" onClick={() => removeAvailabilitySlot(index)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addAvailabilitySlot}><PlusCircle className="mr-2 h-4 w-4" /> Add Time Slot</Button>
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
