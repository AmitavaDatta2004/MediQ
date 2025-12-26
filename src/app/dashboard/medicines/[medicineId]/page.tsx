'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import type { Medicine, MedicineStore } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pill, AlertTriangle, ShieldCheck, Snowflake, MapPin, Store, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

type StoreInventoryStatus = {
    store: MedicineStore;
    status: 'In Stock' | 'Low Stock' | 'Out of Stock';
    stock: number;
}

export default function MedicineDetailPage() {
    const { medicineId } = useParams();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [medicine, setMedicine] = useState<Medicine | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [availability, setAvailability] = useState<StoreInventoryStatus[]>([]);
    const [isChecking, setIsChecking] = useState(false);

    // This is a placeholder. In a real app, you would fetch the medicine details from a central 'medicines' collection.
    // For this demo, we'll try to find it in an arbitrary pharmacy inventory.
    useEffect(() => {
        const fetchMedicine = async () => {
            if (!firestore || !medicineId) return;
            setIsLoading(true);
            // In a real app, this would be: doc(firestore, 'medicines', medicineId as string)
            // For now, we search for it in a known store inventory. This is inefficient.
            const docRef = doc(firestore, 'medicine_stores/pharmacy-1/inventory', medicineId as string);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setMedicine(docSnap.data() as Medicine);
            } else {
                console.error("Medicine not found");
            }
            setIsLoading(false);
        };
        fetchMedicine();
    }, [firestore, medicineId]);

    const storesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'medicine_stores');
    }, [firestore]);
    const { data: stores } = useCollection<MedicineStore>(storesQuery);

    const checkAvailability = async () => {
        if (!stores || !medicineId) return;
        setIsChecking(true);
        toast({ title: "Checking Nearby Stores..." });
        
        const availabilityResults: StoreInventoryStatus[] = [];

        for (const store of stores) {
            const inventoryDocRef = doc(firestore, `medicine_stores/${store.id}/inventory`, medicineId as string);
            const docSnap = await getDoc(inventoryDocRef);

            if (docSnap.exists()) {
                const inventoryItem = docSnap.data() as Medicine;
                let status: StoreInventoryStatus['status'] = 'Out of Stock';
                if (inventoryItem.stock > 20) status = 'In Stock';
                else if (inventoryItem.stock > 0) status = 'Low Stock';
                
                availabilityResults.push({ store, status, stock: inventoryItem.stock });
            }
        }
        
        setAvailability(availabilityResults);
        setIsChecking(false);
    }
    
    const getStatusIcon = (status: StoreInventoryStatus['status']) => {
        switch (status) {
            case 'In Stock': return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'Low Stock': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            case 'Out of Stock': return <XCircle className="h-5 w-5 text-red-500" />;
        }
    }


    if (isLoading) {
        return <div>Loading medicine details...</div>
    }

    if (!medicine) {
        return <p>Medicine not found.</p>
    }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
             <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                             <CardTitle className="text-4xl font-extrabold tracking-tight font-headline">{medicine.name}</CardTitle>
                             <CardDescription className="text-lg">{medicine.saltComposition}</CardDescription>
                        </div>
                        <Badge variant="secondary" className="text-base">{medicine.category}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><Pill className="h-5 w-5 text-primary" /> Common Uses</h3>
                        <p className="text-muted-foreground">{medicine.commonUses}</p>
                    </div>
                    <Separator />
                     <div>
                        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" /> Safety Notes</h3>
                        <p className="text-muted-foreground">{medicine.safetyNotes}</p>
                    </div>
                    <Separator />
                     <div className="flex items-center gap-8 pt-4">
                        {medicine.isPrescriptionRequired && (
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-6 w-6 text-green-600" />
                                <div>
                                    <div className="font-semibold">Prescription Required</div>
                                    <div className="text-sm text-muted-foreground">A valid prescription is needed.</div>
                                </div>
                            </div>
                        )}
                        {medicine.storageType === 'Cold' && (
                            <div className="flex items-center gap-2">
                                <Snowflake className="h-6 w-6 text-blue-500" />
                                 <div>
                                    <div className="font-semibold">Cold Storage</div>
                                    <div className="text-sm text-muted-foreground">Requires refrigeration.</div>
                                </div>
                            </div>
                        )}
                     </div>
                </CardContent>
             </Card>
        </div>
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Nearby Availability</CardTitle>
                    <CardDescription>Check stock in pharmacies near you.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button className="w-full" onClick={checkAvailability} disabled={isChecking}>
                        {isChecking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                        Check Pharmacies
                    </Button>
                     <div className="space-y-4 mt-6">
                        {availability.map(({store, status}) => (
                             <Card key={store.id} className="p-4 flex items-center justify-between hover:bg-muted/50">
                                 <div className="space-y-1">
                                     <h4 className="font-semibold flex items-center gap-2"><Store className="h-4 w-4 text-muted-foreground" /> {store.name}</h4>
                                     <p className="text-xs text-muted-foreground pl-6">{store.address}</p>
                                 </div>
                                 <div className="text-right">
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(status)}
                                        <span className="font-medium text-sm">{status}</span>
                                    </div>
                                    {status !== 'Out of Stock' && <Button size="sm" variant="outline" className="mt-2 h-8">Request Purchase</Button>}
                                 </div>
                             </Card>
                        ))}
                        {!isChecking && availability.length === 0 && <p className="text-sm text-muted-foreground text-center pt-4">Click the button to check for this medicine.</p>}
                     </div>
                </CardContent>
            </Card>
        </div>
    </div>
  )
}
