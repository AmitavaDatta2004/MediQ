
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
import { PlusCircle, Bot, Loader2, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { Medicine } from '@/lib/types';
import { generateMedicineDetailsAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const getStatusVariant = (status?: string) => {
    switch (status) {
        case 'In Stock': return 'default';
        case 'Low Stock': return 'secondary';
        case 'Out of Stock': return 'destructive';
        default: return 'outline';
    }
}

export default function StoreInventoryPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isAdding, setIsAdding] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [medicineName, setMedicineName] = useState('');
  const [generatedDetails, setGeneratedDetails] = useState<Partial<Medicine>>({});

  const inventoryCollectionRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `medicine_stores/${user.uid}/inventory`);
  }, [firestore, user]);

  const { data: inventory, isLoading } = useCollection<Medicine>(inventoryCollectionRef);

  const getStatus = (stock: number): 'In Stock' | 'Low Stock' | 'Out of Stock' => {
    if (stock <= 0) return 'Out of Stock';
    if (stock < 100) return 'Low Stock';
    return 'In Stock';
  }

  const handleAutoFill = async () => {
      if (!medicineName) {
          toast({ variant: 'destructive', title: 'Error', description: 'Please enter a medicine name.' });
          return;
      }
      setIsGenerating(true);
      try {
          const details = await generateMedicineDetailsAction({ medicineName });
          setGeneratedDetails(details);
      } catch (error) {
          console.error(error);
          toast({ variant: 'destructive', title: 'AI Error', description: 'Could not generate medicine details.' });
      } finally {
          setIsGenerating(false);
      }
  }
  
  const handleAddMedicine = () => {
    if (!user || !generatedDetails.name) {
        toast({ variant: 'destructive', title: 'Error', description: 'Cannot save medicine without details.'});
        return;
    }

    const medicineId = uuidv4();
    const newMedicineData: Medicine = {
        id: medicineId,
        name: generatedDetails.name || '',
        strength: generatedDetails.strength || '',
        saltComposition: generatedDetails.saltComposition || '',
        category: generatedDetails.category || '',
        isPrescriptionRequired: generatedDetails.isPrescriptionRequired || false,
        storageType: generatedDetails.storageType || 'Normal',
        commonUses: generatedDetails.commonUses || '',
        safetyNotes: generatedDetails.safetyNotes || '',
        stock: Number(generatedDetails.stock) || 0,
        expiryDate: generatedDetails.expiryDate || '',
    };
    
    if (inventoryCollectionRef) {
        addDocumentNonBlocking(inventoryCollectionRef, newMedicineData);
        toast({ title: 'Medicine Added', description: `${newMedicineData.name} has been added to your inventory.` });
        setIsAdding(false);
        setMedicineName('');
        setGeneratedDetails({});
    }
  }

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
            <CardTitle>Inventory Management</CardTitle>
            <CardDescription>
            View and manage your medicine stock using AI-powered tools.
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
                </TableRow>
            </TableHeader>
            <TableBody>
                {inventory?.map(item => {
                    const status = getStatus(item.stock);
                    return (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name} ({item.strength})</TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell>{item.stock}</TableCell>
                            <TableCell>{new Date(item.expiryDate).toLocaleDateString()}</TableCell>
                            <TableCell>
                                <Badge variant={getStatusVariant(status)}>
                                    {status}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
      </CardContent>
    </Card>

    <Dialog open={isAdding} onOpenChange={(open) => {
        if (!open) {
            setMedicineName('');
            setGeneratedDetails({});
        }
        setIsAdding(open);
    }}>
        <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
                <DialogTitle>Smart Medicine Entry</DialogTitle>
                <DialogDescription>
                    Enter the name of the medicine and let our AI handle the rest.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Medicine Name</Label>
                    <div className="flex gap-2">
                        <Input id="name" placeholder="e.g., Crocin Advance 500mg" value={medicineName} onChange={(e) => setMedicineName(e.target.value)} />
                        <Button onClick={handleAutoFill} disabled={isGenerating}>
                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                             Auto-Fill
                        </Button>
                    </div>
                </div>
                 
                 {Object.keys(generatedDetails).length > 0 && (
                     <div className="space-y-4 pt-4 border-t animate-in fade-in-50">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2"><Label>Strength</Label><Input value={generatedDetails.strength} onChange={(e) => setGeneratedDetails(p => ({...p, strength: e.target.value}))} /></div>
                            <div className="grid gap-2"><Label>Category</Label><Input value={generatedDetails.category} onChange={(e) => setGeneratedDetails(p => ({...p, category: e.target.value}))} /></div>
                        </div>
                        <div className="grid gap-2"><Label>Salt Composition</Label><Input value={generatedDetails.saltComposition} onChange={(e) => setGeneratedDetails(p => ({...p, saltComposition: e.target.value}))} /></div>
                        <div className="grid gap-2"><Label>Common Uses</Label><Textarea value={generatedDetails.commonUses} onChange={(e) => setGeneratedDetails(p => ({...p, commonUses: e.target.value}))} /></div>
                        <div className="grid gap-2"><Label>Safety Notes</Label><Textarea value={generatedDetails.safetyNotes} onChange={(e) => setGeneratedDetails(p => ({...p, safetyNotes: e.target.value}))} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2"><Label>Stock Level</Label><Input type="number" value={generatedDetails.stock} onChange={(e) => setGeneratedDetails(p => ({...p, stock: Number(e.target.value)}))} /></div>
                            <div className="grid gap-2"><Label>Expiry Date</Label><Input type="date" value={generatedDetails.expiryDate} onChange={(e) => setGeneratedDetails(p => ({...p, expiryDate: e.target.value}))} /></div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Label>Prescription Required?</Label>
                                <Switch checked={generatedDetails.isPrescriptionRequired} onCheckedChange={(checked) => setGeneratedDetails(p => ({...p, isPrescriptionRequired: checked}))} />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Label>Requires Cold Storage?</Label>
                                <Switch checked={generatedDetails.storageType === 'Cold'} onCheckedChange={(checked) => setGeneratedDetails(p => ({...p, storageType: checked ? 'Cold': 'Normal'}))} />
                            </div>
                        </div>
                     </div>
                 )}

            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button onClick={handleAddMedicine} disabled={Object.keys(generatedDetails).length === 0}>Add to Inventory</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
