import Image from 'next/image';
import { Star, MapPin } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { doctors } from '@/lib/data';

export default function DoctorsPage() {
  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Find a Doctor</h1>
            <p className="text-muted-foreground">Search for specialists near you and book an appointment.</p>
        </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {doctors.map((doctor) => (
          <Card key={doctor.id} className="flex flex-col">
            <CardHeader className="flex-row items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={doctor.avatarUrl} alt={doctor.name} data-ai-hint="doctor professional" />
                <AvatarFallback>{doctor.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{doctor.name}</CardTitle>
                <CardDescription>{doctor.specialty}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{doctor.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{doctor.rating}</span>
                    <span className="text-muted-foreground">({doctor.reviews} reviews)</span>
                </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Book Appointment</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
