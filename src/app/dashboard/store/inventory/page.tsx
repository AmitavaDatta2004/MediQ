'use client';
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
import { PlusCircle } from 'lucide-react';

const mockInventory = [
    { id: 'MED001', name: 'Paracetamol 500mg', stock: 1200, status: 'In Stock', expiry: '12/2025' },
    { id: 'MED002', name: 'Amoxicillin 250mg', stock: 350, status: 'In Stock', expiry: '06/2026' },
    { id: 'MED003', name: 'Ibuprofen 200mg', stock: 80, status: 'Low Stock', expiry: '09/2024' },
    { id: 'MED004', name: 'Cetirizine 10mg', stock: 500, status: 'In Stock', expiry: '02/2025' },
    { id: 'MED005', name: 'Aspirin 75mg', stock: 0, status: 'Out of Stock', expiry: 'N/A' },
    { id: 'MED006', name: 'Metformin 500mg', stock: 240, status: 'In Stock', expiry: '11/2026' },
];

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'In Stock': return 'default';
        case 'Low Stock': return 'secondary';
        case 'Out of Stock': return 'destructive';
        default: return 'outline';
    }
}

export default function StoreInventoryPage() {
  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
            <CardTitle>Inventory Management</CardTitle>
            <CardDescription>
            View and manage your medicine stock.
            </CardDescription>
        </div>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Medicine
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Medicine ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Stock Level</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {mockInventory.map(item => (
                    <TableRow key={item.id}>
                        <TableCell className="font-mono">{item.id}</TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.stock}</TableCell>
                        <TableCell>{item.expiry}</TableCell>
                        <TableCell>
                            <Badge variant={getStatusVariant(item.status) as any}>
                                {item.status}
                            </Badge>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
