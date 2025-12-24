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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCollection, useUser, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import type { Order, Patient } from '@/lib/types';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function StoreOrdersPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const ordersQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, `medicine_stores/${user.uid}/orders`));
    }, [firestore, user]);

    const { data: orders, isLoading } = useCollection<Order>(ordersQuery);
    
    const patientIds = useMemo(() => {
        if (!orders) return [];
        return [...new Set(orders.map(o => o.patientId))];
    }, [orders]);

    const patientsQuery = useMemoFirebase(() => {
        if (!firestore || patientIds.length === 0) return null;
        return query(collection(firestore, 'patients'), where('id', 'in', patientIds));
    }, [firestore, patientIds]);
    const { data: patients } = useCollection<Patient>(patientsQuery);

    const getPatient = (patientId: string) => patients?.find(p => p.id === patientId);

    const handleUpdateStatus = (order: Order, status: Order['status']) => {
        if (!user) return;
        const patientOrderRef = doc(firestore, `patients/${order.patientId}/orders`, order.id);
        const storeOrderRef = doc(firestore, `medicine_stores/${user.uid}/orders`, order.id);
        
        updateDocumentNonBlocking(patientOrderRef, { status });
        updateDocumentNonBlocking(storeOrderRef, { status });

        toast({
            title: "Order Status Updated",
            description: `Order #${order.id.substring(0,6)}... marked as ${status}.`
        })
    }
    
    const getStatusVariant = (status: Order['status']) => {
        switch (status) {
            case 'Processing': return 'outline';
            case 'Shipped': return 'secondary';
            case 'Delivered': return 'default';
            case 'Cancelled': return 'destructive';
            default: return 'default';
        }
    }

    if (isLoading) {
        return <div>Loading orders...</div>;
    }

  return (
    <div className="flex flex-col gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Incoming Medicine Orders</CardTitle>
                <CardDescription>Manage and fulfill prescriptions.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Patient</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                       {orders?.map(order => {
                           const patient = getPatient(order.patientId);
                           return (
                               <TableRow key={order.id}>
                                   <TableCell className="font-mono text-xs">#{order.id.substring(0, 6)}...</TableCell>
                                   <TableCell>{patient?.firstName} {patient?.lastName}</TableCell>
                                   <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                                   <TableCell><Badge variant={getStatusVariant(order.status)}>{order.status}</Badge></TableCell>
                                   <TableCell className="text-right">
                                       <DropdownMenu>
                                           <DropdownMenuTrigger asChild>
                                               <Button size="icon" variant="ghost">
                                                   <MoreHorizontal className="h-4 w-4" />
                                               </Button>
                                           </DropdownMenuTrigger>
                                           <DropdownMenuContent>
                                                <DropdownMenuItem>View Prescription</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(order, 'Processing')}>Mark as Processing</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(order, 'Shipped')}>Mark as Shipped</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(order, 'Delivered')}>Mark as Delivered</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleUpdateStatus(order, 'Cancelled')}>Cancel Order</DropdownMenuItem>
                                           </DropdownMenuContent>
                                       </DropdownMenu>
                                   </TableCell>
                               </TableRow>
                           );
                       })}
                    </TableBody>
                </Table>
                 {(!orders || orders.length === 0) && <p className="text-center text-muted-foreground py-8">No orders found.</p>}
            </CardContent>
        </Card>
    </div>
  );
}
