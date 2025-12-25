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
import { collection, doc, query, where, orderBy, limit } from 'firebase/firestore';
import type { Order, Patient } from '@/lib/types';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '../ui/button';
import { MoreHorizontal, Truck, CheckCircle, Package, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function MedicineStoreDashboard() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const ordersQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, `medicine_stores/${user.uid}/orders`), orderBy('orderDate', 'desc'));
    }, [firestore, user]);
    
    const recentOrdersQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, `medicine_stores/${user.uid}/orders`), orderBy('orderDate', 'desc'), limit(5));
    }, [firestore, user]);

    const { data: orders, isLoading } = useCollection<Order>(ordersQuery);
    const { data: recentOrders } = useCollection<Order>(recentOrdersQuery);
    
    const patientIds = useMemo(() => {
        if (!recentOrders) return [];
        return [...new Set(recentOrders.map(o => o.patientId))];
    }, [recentOrders]);

    const patientsQuery = useMemoFirebase(() => {
        if (!firestore || patientIds.length === 0) return null;
        return query(collection(firestore, 'patients'), where('id', 'in', patientIds));
    }, [firestore, patientIds]);
    const { data: patients } = useCollection<Patient>(patientsQuery);
    
    const getPatient = (patientId: string) => patients?.find(p => p.id === patientId);

    const handleUpdateStatus = (order: Order, status: Order['status']) => {
        if(!user) return;
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
    
    const processingOrders = useMemo(() => orders?.filter(o => o.status === 'Processing').length || 0, [orders]);
    const shippedOrders = useMemo(() => orders?.filter(o => o.status === 'Shipped').length || 0, [orders]);
    const deliveredOrders = useMemo(() => orders?.filter(o => o.status === 'Delivered').length || 0, [orders]);

  return (
    <div className="flex flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">New Orders</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{processingOrders}</div>
                    <p className="text-xs text-muted-foreground">awaiting processing</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">In Transit</CardTitle>
                    <Truck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{shippedOrders}</div>
                    <p className="text-xs text-muted-foreground">orders currently shipped</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{deliveredOrders}</div>
                    <p className="text-xs text-muted-foreground">in the last 30 days</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">items need restocking</p>
                </CardContent>
            </Card>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Your 5 most recent incoming orders.</CardDescription>
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
                       {recentOrders?.map(order => {
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
                 {(!recentOrders || recentOrders.length === 0) && <p className="text-center text-muted-foreground py-8">No recent orders found.</p>}
            </CardContent>
        </Card>
    </div>
  );
}
