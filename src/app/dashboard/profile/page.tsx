import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { patient } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function ProfilePage() {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
          <CardDescription>
            Manage your personal and health information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={patient.avatarUrl} alt={patient.name} data-ai-hint="person portrait"/>
                <AvatarFallback>{patient.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <Button>Change Photo</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" defaultValue={patient.name} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={patient.email} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input id="dob" type="date" defaultValue={patient.dob} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="blood-type">Blood Type</Label>
                    <Input id="blood-type" defaultValue={patient.bloodType} />
                </div>
            </div>
            <div className="grid gap-2">
              <Label>Allergies</Label>
              <div className="flex flex-wrap gap-2">
                {patient.allergies.map(allergy => <Badge variant="secondary" key={allergy}>{allergy}</Badge>)}
              </div>
              <Input placeholder="Add new allergy..." />
            </div>
             <div className="grid gap-2">
              <Label>Chronic Conditions</Label>
              <div className="flex flex-wrap gap-2">
                {patient.chronicConditions.map(condition => <Badge variant="secondary" key={condition}>{condition}</Badge>)}
              </div>
              <Input placeholder="Add new condition..." />
            </div>
          </form>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button>Save Changes</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
