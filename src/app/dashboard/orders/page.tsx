import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { medicineOrders, prescriptions } from '@/lib/data';

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
          {medicineOrders.map((order) => {
            const prescription = prescriptions.find(p => p.id === order.prescriptionId);
            return (
              <div key={order.id} className="grid items-start gap-4 sm:grid-cols-3">
                <div className='sm:col-span-2'>
                  <h3 className="text-lg font-semibold">Order #{order.id}</h3>
                  <p className="text-sm text-muted-foreground">
                    From: {order.storeName} | Ordered on: {order.orderDate}
                  </p>
                  <div className="mt-2 space-y-1">
                    {prescription?.medicines.map((med, index) => (
                      <p key={index} className="text-sm">{med.name}</p>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-2">
                  <Badge variant={getStatusBadgeVariant(order.status)}>
                    {order.status}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    ETA: {order.estimatedDelivery}
                  </p>
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
