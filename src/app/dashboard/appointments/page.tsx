import { MoreHorizontal } from 'lucide-react';
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
import { appointments, doctors } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AppointmentsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointment History</CardTitle>
        <CardDescription>
          A log of your past and upcoming medical appointments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Doctor</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="hidden md:table-cell">Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((appointment) => {
              const doctor = doctors.find(d => d.id === appointment.doctorId);
              return (
                <TableRow key={appointment.id}>
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
                  <TableCell>{appointment.reason}</TableCell>
                  <TableCell className="hidden md:table-cell">{appointment.date}</TableCell>
                  <TableCell className="hidden md:table-cell">{appointment.time}</TableCell>
                  <TableCell>
                    <Badge variant={appointment.status === 'Upcoming' ? 'default' : 'secondary'}>
                      {appointment.status}
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
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        {appointment.status === 'Upcoming' && <DropdownMenuItem>Reschedule</DropdownMenuItem>}
                        {appointment.status === 'Upcoming' && <DropdownMenuItem className="text-destructive">Cancel</DropdownMenuItem>}
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
