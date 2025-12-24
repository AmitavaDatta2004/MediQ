'use client';
import { Star, MapPin, ShieldCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCollection, useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { Doctor } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

export default function DoctorsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const doctorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'doctors');
  }, [firestore]);

  const { data: doctors, isLoading } = useCollection<Doctor>(doctorsQuery);

  const handleGrantAccess = async (doctor: Doctor) => {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "You must be logged in to grant access.",
        });
        return;
    }

    const consentId = doctor.id; // Use doctor's ID as the consent document ID
    const consentRef = doc(firestore, `patients/${user.uid}/data_consents`, consentId);

    const consentData = {
        id: consentId,
        patientId: user.uid,
        doctorId: doctor.id,
        startDate: new Date().toISOString(),
        // Consent valid for 1 year by default
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        consentGiven: true,
    };

    await setDocumentNonBlocking(consentRef, consentData, { merge: true });

    toast({
        title: "Access Granted",
        description: `You have successfully granted Dr. ${doctor.lastName} access to your medical data.`,
    });
};


  if (isLoading) {
    return <div>Loading doctors...</div>
  }

  return (
    <>
    <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Find a Doctor</h1>
            <p className="text-muted-foreground">Search for specialists and grant them access to your records to begin consultation.</p>
        </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {doctors && doctors.map((doctor) => (
          <Card key={doctor.id} className="flex flex-col">
            <CardHeader className="flex-row items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={doctor.avatarUrl} alt={doctor.name} data-ai-hint="doctor professional" />
                <AvatarFallback>{doctor.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{doctor.name}</CardTitle>
                <CardDescription>{doctor.specialty}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{doctor.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{doctor.rating}</span>
                    <span className="text-muted-foreground">({doctor.reviews} reviews)</span>
                </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => handleGrantAccess(doctor)}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Grant Access
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
    </>
  );
}
