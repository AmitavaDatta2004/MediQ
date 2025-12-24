import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { prescriptions, doctors } from '@/lib/data';
import { Separator } from '@/components/ui/separator';
import { FileText } from 'lucide-react';

export default function PrescriptionsPage() {
  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Your Prescriptions</h1>
            <p className="text-muted-foreground">Review your prescribed medications and place new orders.</p>
        </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {prescriptions.map((prescription) => {
          const doctor = doctors.find((d) => d.id === prescription.doctorId);
          return (
            <Card key={prescription.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Prescription from Dr. {doctor?.name.split(' ').pop()}</span>
                    <span className="text-sm font-normal text-muted-foreground">{prescription.date}</span>
                </CardTitle>
                <CardDescription>Prescribed by {doctor?.name}, {doctor?.specialty}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {prescription.medicines.map((med, index) => (
                    <li key={index}>
                      <div className="font-semibold">{med.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {med.dosage} - {med.frequency}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="flex justify-between">
                 <Button variant="ghost"><FileText className="mr-2 h-4 w-4" /> View Details</Button>
                <Button>Order Medicines</Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
