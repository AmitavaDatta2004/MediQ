'use client';
import Link from 'next/link';
import {
  Activity,
  Calendar,
  FileScan,
  HeartPulse,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { appointments, doctors, patient } from '@/lib/data';

const chartData = [
  { month: 'Jan', heartRate: 72 },
  { month: 'Feb', heartRate: 75 },
  { month: 'Mar', heartRate: 70 },
  { month: 'Apr', heartRate: 78 },
  { month: 'May', heartRate: 80 },
  { month: 'Jun', heartRate: 76 },
];

const chartConfig = {
  heartRate: {
    label: 'Heart Rate',
    color: 'hsl(var(--primary))',
  },
};

export default function Dashboard() {
  const upcomingAppointment = appointments.find(
    (a) => a.status === 'Upcoming'
  );
  const doctor = upcomingAppointment
    ? doctors.find((d) => d.id === upcomingAppointment.doctorId)
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Welcome Back, {patient.name.split(' ')[0]}!
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">Health Dashboard</div>
            <p className="text-xs text-muted-foreground">
              Your personal health overview.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Appointment
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {upcomingAppointment && doctor ? (
              <>
                <div className="text-xl font-bold">{doctor.name}</div>
                <p className="text-xs text-muted-foreground">
                  {new Date(upcomingAppointment.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {upcomingAppointment.time}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground pt-2">No upcoming appointments.</p>
            )}
          </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Analyze a Report</CardTitle>
                <FileScan className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <p className="text-xs text-muted-foreground mb-2">Get AI insights from your medical reports.</p>
                <Button size="sm" asChild>
                    <Link href="/dashboard/report-analysis">Upload Report</Link>
                </Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Analyze a Scan</CardTitle>
                <HeartPulse className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <p className="text-xs text-muted-foreground mb-2">Detect anomalies in X-Rays, CTs, or MRIs.</p>
                <Button size="sm" asChild>
                    <Link href="/dashboard/scan-analysis">Upload Scan</Link>
                </Button>
            </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Health Metrics</CardTitle>
            <CardDescription>Your resting heart rate over the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                 <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  domain={[60, 90]}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar
                  dataKey="heartRate"
                  fill="var(--color-heartRate)"
                  radius={4}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doctor</TableHead>
                  <TableHead className='hidden sm:table-cell'>Date</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.slice(0, 3).map((appointment) => {
                  const apptDoctor = doctors.find(d => d.id === appointment.doctorId);
                  return (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div className="font-medium">{apptDoctor?.name}</div>
                        <div className="text-sm text-muted-foreground hidden md:inline">
                          {apptDoctor?.specialty}
                        </div>
                      </TableCell>
                      <TableCell className='hidden sm:table-cell'>{appointment.date}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={appointment.status === 'Upcoming' ? 'default' : 'secondary'}>{appointment.status}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
