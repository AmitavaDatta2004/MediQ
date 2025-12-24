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
import { FileText, PlusCircle } from 'lucide-react';
import { useCollection, useUser, useFirestore, useMemoFirebase, useDoc, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import type { Prescription, Doctor, Order, MedicineStore, User } from '@/lib/types';
import { useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function PrescriptionsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isOrdering, setIsOrdering] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);

  const userRoleDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: userRole } = useDoc<User>(userRoleDocRef);

  const prescriptionsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `patients/${user.uid}/prescriptions`));
  }, [firestore, user]);

  const { data: prescriptions, isLoading: isLoadingPrescriptions } = useCollection<Prescription>(prescriptionsQuery);
  
  const doctorIds = useMemo(() => {
    if (!prescriptions) return [];
    return [...new Set(prescriptions.map(p => p.doctorId))];
  }, [prescriptions]);

  const doctorsQuery = useMemoFirebase(() => {
    if (!firestore || doctorIds.length === 0) return null;
    return query(collection(firestore, 'doctors'), where('id', 'in', doctorIds));
  }, [firestore, doctorIds]);

  const { data: doctors } = useCollection<Doctor>(doctorsQuery);

  const storesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'medicine_stores') : null, [firestore]);
  const { data: medicineStores } = useCollection<MedicineStore>(storesQuery);

  const getDoctor = (doctorId: string) => {
    return doctors?.find(d => d.id === doctorId);
  }

  const handleOpenOrderDialog = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setIsOrdering(true);
  }

  const handlePlaceOrder = async () => {
    if (!user || !selectedPrescription || !selectedStore) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Please select a medicine store to place the order.",
        });
        return;
    }

    const orderId = uuidv4();
    const orderData: Order = {
        id: orderId,
        patientId: user.uid,
        medicineStoreId: selectedStore,
        prescriptionId: selectedPrescription.id,
        orderDate: new Date().toISOString(),
        status: 'Processing',
    };

    // Create order in patient's subcollection
    const patientOrderRef = doc(firestore, `patients/${user.uid}/orders`, orderId);
    setDocumentNonBlocking(patientOrderRef, orderData, { merge: false });
    
    // Denormalize order in medicine store's subcollection
    const storeOrderRef = doc(firestore, `medicine_stores/${selectedStore}/orders`, orderId);
    setDocumentNonBlocking(storeOrderRef, orderData, { merge: false });

    toast({
        title: "Order Placed!",
        description: `Your order for prescription #${selectedPrescription.id.substring(0,6)}... has been sent.`,
    });

    setIsOrdering(false);
    setSelectedPrescription(null);
    setSelectedStore(null);
  };


  if (isLoadingPrescriptions) {
    return <div>Loading prescriptions...</div>;
  }

  return (
    <>
    <div className="space-y-6">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">Your Prescriptions</h1>
                <p className="text-muted-foreground">Review your prescribed medications and place new orders.</p>
            </div>
            {userRole?.role === 'doctor' && (
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Prescription
                </Button>
            )}
        </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {prescriptions && prescriptions.map((prescription) => {
          const doctor = getDoctor(prescription.doctorId);
          return (
            <Card key={prescription.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Prescription from Dr. {doctor?.lastName}</span>
                    <span className="text-sm font-normal text-muted-foreground">{new Date(prescription.date).toLocaleDateString()}</span>
                </CardTitle>
                <CardDescription>Prescribed by {doctor?.firstName} {doctor?.lastName}, {doctor?.specialty}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {prescription.medicines?.map((medicine, index) => (
                    <li key={index}>
                      <div className="font-semibold">{medicine.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {medicine.dosage} - {medicine.frequency}
                      </div>
                    </li>
                  ))}
                </ul>
                {prescription.notes && <div className="text-sm text-muted-foreground mt-4">Notes: {prescription.notes}</div>}
              </CardContent>
              <CardFooter className="flex justify-between">
                 <Button variant="ghost"><FileText className="mr-2 h-4 w-4" /> View Details</Button>
                {userRole?.role === 'patient' && <Button onClick={() => handleOpenOrderDialog(prescription)}>Order Medicines</Button>}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>

    <Dialog open={isOrdering} onOpenChange={setIsOrdering}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Order from Prescription</DialogTitle>
                <DialogDescription>
                    Select a medicine store to fulfill this prescription.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="store">Medicine Store</Label>
                     <Select onValueChange={setSelectedStore}>
                        <SelectTrigger id="store">
                            <SelectValue placeholder="Select a store..." />
                        </SelectTrigger>
                        <SelectContent>
                            {medicineStores?.map((store) => (
                                <SelectItem key={store.id} value={store.id}>
                                    {store.name} - {store.address}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsOrdering(false)}>Cancel</Button>
                <Button onClick={handlePlaceOrder}>Place Order</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
