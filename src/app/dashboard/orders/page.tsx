'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCollection, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Order, Prescription } from '@/lib/types';
import { useMemo } from 'react';


const getStatusBadgeVariant = (status: string) => {
    switch(status) {
        case 'Delivered': return 'default';
        case 'Shipped': return 'secondary';
        case 'Processing': return 'outline';
        case 'Cancelled': return 'destructive';
        default: return 'default';
    }
}

export default function OrdersPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const ordersQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `patients/${user.uid}/orders`));
  }, [firestore, user]);

  const { data: medicineOrders, isLoading } = useCollection<Order>(ordersQuery);

  const prescriptionIds = useMemo(() => {
    if (!medicineOrders) return [];
    return [...new Set(medicineOrders.map(o => o.prescriptionId))];
  }, [medicineOrders]);

  const prescriptionsQuery = useMemoFirebase(() => {
    if (!firestore || !user || prescriptionIds.length === 0) return null;
    return query(collection(firestore, `patients/${user.uid}/prescriptions`), where('id', 'in', prescriptionIds));
  }, [firestore, user, prescriptionIds]);

  const { data: prescriptions } = useCollection<Prescription>(prescriptionsQuery);

  const getPrescription = (prescriptionId: string) => {
    return prescriptions?.find(p => p.id === prescriptionId);
  }

  if (isLoading) {
    return <div>Loading orders...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Medicine Orders</CardTitle>
        <CardDescription>
          Track your current and past medicine orders.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {medicineOrders && medicineOrders.map((order) => {
            const prescription = getPrescription(order.prescriptionId);
            return (
              <div key={order.id} className="grid items-start gap-4 sm:grid-cols-3">
                <div className='sm:col-span-2'>
                  <h3 className="text-lg font-semibold">Order #{order.id}</h3>
                  <p className="text-sm text-muted-foreground">
                    Ordered on: {new Date(order.orderDate).toLocaleDateString()}
                  </p>
                  <div className="mt-2 space-y-1">
                    {prescription?.medicines.map((med, index) => (
                      <p key={index} className="text-sm">{med.name}</p>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-2">
                  <Badge variant={getStatusBadgeVariant(order.status) as any}>
                    {order.status}
                  </Badge>
                  
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm">
                      Track Order
                    </Button>
                     <Button variant="secondary" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            )
        })}
        </div>
      </CardContent>
    </Card>
  );
}
