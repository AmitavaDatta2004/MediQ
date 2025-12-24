'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { useAuth, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc } from 'firebase/firestore';

export default function DoctorSignupPage() {
    const auth = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSignUp = async () => {
        setError(null);
        if (!email || !password || !firstName || !lastName || !specialty) {
            setError("Please fill in all fields.");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Create doctor profile
            const doctorData = {
                id: user.uid,
                firstName,
                lastName,
                name: `Dr. ${firstName} ${lastName}`,
                specialty,
                email: user.email,
                location: 'Online',
                rating: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10, // Mock rating between 3.5 and 5
                reviews: Math.floor(Math.random() * 200) + 50, // Mock reviews between 50 and 250
            };
            
            const doctorDocRef = doc(firestore, 'doctors', user.uid);
            setDocumentNonBlocking(doctorDocRef, doctorData, { merge: true });

             // Create base user role document
            const userDocRef = doc(firestore, 'users', user.uid);
            setDocumentNonBlocking(userDocRef, { id: user.uid, email: user.email, role: 'doctor' }, { merge: true });

            router.push('/dashboard');
        } catch (error: any) {
            setError(error.message);
        }
    }

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center py-12 px-4">
        <div className="mx-auto grid w-full max-w-md gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold font-headline">Create a Doctor Account</h1>
            <p className="text-balance text-muted-foreground">
              Enter your information to register as a doctor.
            </p>
          </div>
          <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Sign Up</CardTitle>
                <CardDescription>All fields are required.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input id="firstName" placeholder="John" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input id="lastName" placeholder="Doe" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
                        </div>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="specialty">Specialty</Label>
                        <Input id="specialty" placeholder="Cardiology" required value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="doctor@example.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    {error && <p className="text-destructive text-sm">{error}</p>}
                    <Button type="submit" className="w-full" onClick={handleSignUp}>
                        Create Account
                    </Button>
                </div>
            </CardContent>
          </Card>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/doctor-login" className="underline">
              Log in
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:flex items-center justify-center flex-col text-center p-8">
        <Icons.logo className="h-24 w-24 text-primary mb-4" />
        <h2 className="text-4xl font-bold font-headline">MediQuest AI</h2>
        <p className="text-lg text-muted-foreground mt-2 max-w-md">Empowering medical professionals with AI-driven insights.</p>
      </div>
    </div>
  );
}
