
'use client';
import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, AlertTriangle, Snowflake } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Medicine } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { differenceInDays } from 'date-fns';
import { medicinesDB, type MedicineInfo } from '@/lib/medicines-db';
import { Combobox } from '@/components/ui/combobox';

const getStatus = (item: Medicine): 'Near Expiry' | 'Out of Stock' | 'Low Stock' | 'In Stock' => {
    if (item.expiryDate) {
        const today = new Date();
        const expiry = new Date(item.expiryDate);
        if (differenceInDays(expiry, today) <= 30 && differenceInDays(expiry, today) > 0) {
            return 'Near Expiry';
        }
    }
    if (item.stock <= 0) return 'Out of Stock';
    if (item.stock < 20) return 'Low Stock';
    return 'In Stock';
}

const getStatusVariant = (status: 'Near Expiry' | 'Out of Stock' | 'Low Stock' | 'In Stock') => {
    switch (status) {
        case 'In Stock': return 'default';
        case 'Low Stock': return 'secondary';
        case 'Out of Stock': return 'destructive';
        case 'Near Expiry': return 'destructive';
        default: return 'outline';
    }
}

export default function StoreInventoryPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isAdding, setIsAdding] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineInfo | null>(null);
  const [stockLevel, setStockLevel] = useState(100);
  const [expiryDate, setExpiryDate] = useState('');

  const inventoryCollectionRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `medicine_stores/${user.uid}/inventory`);
  }, [firestore, user]);

  const { data: inventory, isLoading } = useCollection<Medicine>(inventoryCollectionRef);

  const resetForm = () => {
    setIsAdding(false);
    setSelectedMedicine(null);
    setStockLevel(100);
    setExpiryDate('');
  };

  const handleAddMedicine = () => {
    if (!user || !selectedMedicine || !expiryDate) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select a medicine and set a stock level and expiry date.'});
        return;
    }

    const medicineId = uuidv4();
    const newMedicineData: Medicine = {
        id: medicineId,
        name: selectedMedicine.name,
        strength: selectedMedicine.strength,
        saltComposition: selectedMedicine.saltComposition,
        category: selectedMedicine.category,
        isPrescriptionRequired: selectedMedicine.isPrescriptionRequired,
        storageType: selectedMedicine.storageType,
        commonUses: selectedMedicine.commonUses,
        safetyNotes: selectedMedicine.safetyNotes,
        stock: stockLevel,
        expiryDate: expiryDate,
    };
    
    if (inventoryCollectionRef) {
        addDocumentNonBlocking(inventoryCollectionRef, newMedicineData);
        toast({ title: 'Medicine Added', description: `${newMedicineData.name} has been added to your inventory.` });
        resetForm();
    }
  }

  const medicineOptions = useMemo(() => {
      return medicinesDB.map(med => ({
          value: med.name.toLowerCase(),
          label: med.name
      }));
  }, []);

  const handleSelectMedicine = (value: string) => {
      const foundMedicine = medicinesDB.find(med => med.name.toLowerCase() === value);
      if (foundMedicine) {
          setSelectedMedicine(foundMedicine);
      }
  }


  return (
    <>
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
            <CardTitle>Inventory Management</CardTitle>
            <CardDescription>
            View and manage your medicine stock.
            </CardDescription>
        </div>
        <Button onClick={() => setIsAdding(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Medicine
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock Level</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {inventory?.map(item => {
                    const status = getStatus(item);
                    return (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name} ({item.strength})</TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell>{item.stock}</TableCell>
                            <TableCell>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</TableCell>
                            <TableCell>
                                <Badge variant={getStatusVariant(status)} className="gap-1">
                                    {status === 'Near Expiry' && <AlertTriangle className="h-3 w-3" />}
                                    {status}
                                </Badge>
                            </TableCell>
                             <TableCell>
                                {item.storageType === 'Cold' && (
                                    <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-800">
                                        <Snowflake className="h-3 w-3" />
                                        Cold Storage
                                    </Badge>
                                )}
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
        {(!inventory || inventory.length === 0) && !isLoading && (
            <div className="text-center p-8 text-muted-foreground">
                Your inventory is empty. Add your first medicine to get started.
            </div>
        )}
      </CardContent>
    </Card>

    <Dialog open={isAdding} onOpenChange={(open) => {
        if (!open) resetForm();
        setIsAdding(open);
    }}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Add Medicine to Inventory</DialogTitle>
                <DialogDescription>
                    Search for a medicine from the database and set its stock details.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Medicine Name</Label>
                    <Combobox
                        options={medicineOptions}
                        placeholder="Search for a medicine..."
                        onSelect={handleSelectMedicine}
                    />
                </div>
                 
                 {selectedMedicine && (
                     <div className="space-y-4 pt-4 border-t animate-in fade-in-50">
                        <div className="p-4 bg-muted/50 rounded-lg">
                           <h4 className="font-semibold">{selectedMedicine.name}</h4>
                           <p className="text-sm text-muted-foreground">{selectedMedicine.saltComposition}</p>
                           <p className="text-xs text-muted-foreground mt-2">{selectedMedicine.commonUses}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="stock">Stock Level</Label>
                                <Input id="stock" type="number" value={stockLevel} onChange={(e) => setStockLevel(Number(e.target.value))} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="expiry">Expiry Date</Label>
                                <Input id="expiry" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
                            </div>
                        </div>
                     </div>
                 )}

            </div>
            <DialogFooter>
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleAddMedicine} disabled={!selectedMedicine}>Add to Inventory</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
