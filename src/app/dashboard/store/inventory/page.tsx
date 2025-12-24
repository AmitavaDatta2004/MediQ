'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function StoreInventoryPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Management</CardTitle>
        <CardDescription>
          View and manage your medicine stock.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">Inventory management feature coming soon.</p>
        </div>
      </CardContent>
    </Card>
  );
}
