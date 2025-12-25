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
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useCollection, useUser, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where, orderBy } from 'firebase/firestore';
import type { Order, Patient } from '@/lib/types';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ChevronDown, ChevronRight, CheckCircle, AlertTriangle, XCircle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function StoreOrdersPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [openOrderId, setOpenOrderId] = useState<string | null>(null);

    const ordersQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, `medicine_stores/${user.uid}/orders`), orderBy('orderDate', 'desc'));
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
    
    const getInventoryStatusIcon = (status: string) => {
        switch (status) {
            case 'Available': return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'Low Stock': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            case 'Out of Stock': return <XCircle className="h-4 w-4 text-red-500" />;
            default: return null;
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
                <CardDescription>Manage and fulfill prescriptions from all patients. AI has pre-checked your inventory.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]"></TableHead>
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
                           const isOpen = openOrderId === order.id;
                           return (
                               <Collapsible asChild key={order.id} open={isOpen} onOpenChange={() => setOpenOrderId(isOpen ? null : order.id)}>
                                 <>
                                   <TableRow className="hover:bg-muted/50">
                                       <TableCell>
                                           <CollapsibleTrigger asChild>
                                               <Button variant="ghost" size="sm">
                                                   {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                   <span className="sr-only">Toggle details</span>
                                               </Button>
                                           </CollapsibleTrigger>
                                       </TableCell>
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
                                                    <DropdownMenuItem><FileText className="mr-2 h-4 w-4" />View Prescription</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(order, 'Processing')}>Mark as Processing</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(order, 'Shipped')}>Mark as Shipped</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(order, 'Delivered')}>Mark as Delivered</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleUpdateStatus(order, 'Cancelled')}>Cancel Order</DropdownMenuItem>
                                               </DropdownMenuContent>
                                           </DropdownMenu>
                                       </TableCell>
                                   </TableRow>
                                   <CollapsibleContent asChild>
                                       <tr className="bg-muted/50">
                                            <TableCell colSpan={6} className="p-0">
                                                <div className="p-4">
                                                    <h4 className="font-semibold mb-2 text-sm">Order Details (AI Analyzed)</h4>
                                                    <ul className="space-y-2">
                                                        {order.medicines?.map((med, index) => (
                                                            <li key={index} className="flex justify-between items-center text-sm p-2 rounded-md bg-background">
                                                                <div>
                                                                    <span className="font-medium">{med.name}</span>
                                                                    <span className="text-muted-foreground ml-2">({med.dosage} - {med.frequency})</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {getInventoryStatusIcon(med.inventoryStatus)}
                                                                    <span className="font-medium">{med.inventoryStatus}</span>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </TableCell>
                                        </tr>
                                   </CollapsibleContent>
                                 </>
                               </Collapsible>
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
