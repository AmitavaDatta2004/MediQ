import { MoreHorizontal, ShieldCheck, ShieldX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { consents, doctors } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ConsentPage() {
    const getStatusInfo = (status: string) => {
        switch(status) {
            case 'Active': return { variant: 'default', icon: <ShieldCheck className="h-4 w-4 text-green-600" /> };
            case 'Expired': return { variant: 'secondary', icon: <ShieldX className="h-4 w-4 text-muted-foreground" /> };
            case 'Revoked': return { variant: 'destructive', icon: <ShieldX className="h-4 w-4" /> };
            default: return { variant: 'default', icon: null };
        }
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Consent Management</CardTitle>
        <CardDescription>
          Control which practitioners can access your medical data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Doctor</TableHead>
              <TableHead className="hidden sm:table-cell">Granted On</TableHead>
              <TableHead className="hidden sm:table-cell">Expires On</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {consents.map((consent) => {
              const doctor = doctors.find(d => d.id === consent.doctorId);
              const statusInfo = getStatusInfo(consent.status);
              return (
                <TableRow key={consent.id}>
                  <TableCell className="font-medium">
                     <div className="flex items-center gap-3">
                      <Avatar className="hidden h-9 w-9 sm:flex">
                        <AvatarImage src={doctor?.avatarUrl} alt="Avatar" data-ai-hint="doctor professional" />
                        <AvatarFallback>{doctor?.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="grid gap-0.5">
                        <span className='font-medium'>{doctor?.name}</span>
                        <span className='text-muted-foreground text-sm hidden md:inline'>{doctor?.specialty}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{consent.grantedDate}</TableCell>
                  <TableCell className="hidden sm:table-cell">{consent.expiryDate}</TableCell>
                  <TableCell>
                    <Badge variant={statusInfo.variant as any}>
                        <div className="flex items-center gap-2">
                            {statusInfo.icon}
                            {consent.status}
                        </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>View Access Logs</DropdownMenuItem>
                        {consent.status === 'Active' && <DropdownMenuItem>Extend Access</DropdownMenuItem>}
                        {consent.status === 'Active' && <DropdownMenuItem className="text-destructive">Revoke Access</DropdownMenuItem>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
