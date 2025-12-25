'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { useAuth, useFirestore, setDocumentNonBlocking, initiateGoogleSignIn } from '@/firebase';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function PatientSignupForm() {
    const auth = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSignUp = async () => {
        setError(null);
        if (!email || !password || !firstName || !lastName) {
            setError("Please fill in all fields.");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Create patient profile
            const patientData = {
                id: user.uid,
                firstName,
                lastName,
                email: user.email,
                avatarUrl: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
                dateOfBirth: '',
            };
            const patientDocRef = doc(firestore, 'patients', user.uid);
            await setDocumentNonBlocking(patientDocRef, patientData, { merge: true });

            const userDocRef = doc(firestore, 'users', user.uid);
            await setDocumentNonBlocking(userDocRef, { id: user.uid, email: user.email, role: 'patient' }, { merge: true });

            router.push('/dashboard');
        } catch (error: any) {
            setError(error.message);
        }
    }

    const handleGoogleSignUp = () => initiateGoogleSignIn(auth, 'patient').then(() => router.push('/dashboard'));

    return (
        <CardContent>
            <div className="grid gap-4">
                 <Button variant="outline" className="w-full" onClick={handleGoogleSignUp}>
                    Sign up with Google
                </Button>
                 <div className="relative my-2">
                    <Separator />
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">OR CONTINUE WITH EMAIL</span>
                </div>
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
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
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
    );
}

function DoctorSignupForm() {
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

            const doctorData = {
                id: user.uid, firstName, lastName, name: `Dr. ${firstName} ${lastName}`, specialty, email: user.email,
                avatarUrl: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
                location: 'Online', rating: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10, reviews: Math.floor(Math.random() * 200) + 50,
            };
            await setDocumentNonBlocking(doc(firestore, 'doctors', user.uid), doctorData, { merge: true });
            await setDocumentNonBlocking(doc(firestore, 'users', user.uid), { id: user.uid, email: user.email, role: 'doctor' }, { merge: true });
            router.push('/dashboard');
        } catch (error: any) { setError(error.message); }
    }

    const handleGoogleSignUp = () => initiateGoogleSignIn(auth, 'doctor').then(() => router.push('/dashboard'));

    return (
        <CardContent>
            <div className="grid gap-4">
                <Button variant="outline" className="w-full" onClick={handleGoogleSignUp}>Sign up with Google</Button>
                <div className="relative my-2"><Separator /><span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">OR CONTINUE WITH EMAIL</span></div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2"><Label htmlFor="doc-firstName">First Name</Label><Input id="doc-firstName" placeholder="John" required value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
                    <div className="grid gap-2"><Label htmlFor="doc-lastName">Last Name</Label><Input id="doc-lastName" placeholder="Doe" required value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
                </div>
                <div className="grid gap-2"><Label htmlFor="specialty">Specialty</Label><Input id="specialty" placeholder="Cardiology" required value={specialty} onChange={(e) => setSpecialty(e.target.value)} /></div>
                <div className="grid gap-2"><Label htmlFor="doc-email">Email</Label><Input id="doc-email" type="email" placeholder="doctor@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div className="grid gap-2"><Label htmlFor="doc-password">Password</Label><Input id="doc-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                {error && <p className="text-destructive text-sm">{error}</p>}
                <Button type="submit" className="w-full" onClick={handleSignUp}>Create Account</Button>
            </div>
        </CardContent>
    );
}

function StoreSignupForm() {
    const auth = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [storeName, setStoreName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSignUp = async () => {
        setError(null);
        if (!email || !password || !storeName || !address || !phone) { setError("Please fill in all fields."); return; }
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const storeData = { id: user.uid, name: storeName, address, phone, email: user.email };
            await setDocumentNonBlocking(doc(firestore, 'medicine_stores', user.uid), storeData, { merge: true });
            await setDocumentNonBlocking(doc(firestore, 'users', user.uid), { id: user.uid, email: user.email, role: 'medicine_store' }, { merge: true });
            router.push('/dashboard');
        } catch (error: any) { setError(error.message); }
    }

    const handleGoogleSignUp = () => initiateGoogleSignIn(auth, 'medicine_store').then(() => router.push('/dashboard'));

    return (
        <CardContent>
            <div className="grid gap-4">
                <Button variant="outline" className="w-full" onClick={handleGoogleSignUp}>Sign up with Google</Button>
                <div className="relative my-2"><Separator /><span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">OR CONTINUE WITH EMAIL</span></div>
                <div className="grid gap-2"><Label htmlFor="storeName">Store Name</Label><Input id="storeName" placeholder="City Pharmacy" required value={storeName} onChange={(e) => setStoreName(e.target.value)} /></div>
                <div className="grid gap-2"><Label htmlFor="address">Address</Label><Input id="address" placeholder="123 Main St, Anytown" required value={address} onChange={(e) => setAddress(e.target.value)} /></div>
                <div className="grid gap-2"><Label htmlFor="phone">Phone Number</Label><Input id="phone" placeholder="+1 (555) 123-4567" required value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                <div className="grid gap-2"><Label htmlFor="store-email">Email</Label><Input id="store-email" type="email" placeholder="store@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div className="grid gap-2"><Label htmlFor="store-password">Password</Label><Input id="store-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                {error && <p className="text-destructive text-sm">{error}</p>}
                <Button type="submit" className="w-full" onClick={handleSignUp}>Create Account</Button>
            </div>
        </CardContent>
    );
}

export default function SignupPage() {
    return (
        <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
          <div className="flex items-center justify-center py-12 px-4">
            <div className="mx-auto grid w-full max-w-md gap-6">
              <div className="grid gap-2 text-center">
                 <Icons.logo className="h-16 w-16 text-primary mb-4 mx-auto" />
                <h1 className="text-3xl font-bold font-headline">Create an Account</h1>
                <p className="text-balance text-muted-foreground">
                  Choose your role and enter your information to get started.
                </p>
              </div>
               <Tabs defaultValue="patient" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="patient">Patient</TabsTrigger>
                        <TabsTrigger value="doctor">Doctor</TabsTrigger>
                        <TabsTrigger value="medicine_store">Pharmacy</TabsTrigger>
                    </TabsList>
                    <TabsContent value="patient">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-2xl">Patient Sign Up</CardTitle>
                                <CardDescription>Create your personal health account.</CardDescription>
                            </CardHeader>
                            <PatientSignupForm />
                        </Card>
                    </TabsContent>
                    <TabsContent value="doctor">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-2xl">Doctor Registration</CardTitle>
                                <CardDescription>Join our network of medical professionals.</CardDescription>
                            </CardHeader>
                            <DoctorSignupForm />
                        </Card>
                    </TabsContent>
                    <TabsContent value="medicine_store">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-2xl">Pharmacy Registration</CardTitle>
                                <CardDescription>Register your medicine store on the platform.</CardDescription>
                            </CardHeader>
                            <StoreSignupForm />
                        </Card>
                    </TabsContent>
                </Tabs>
              <div className="mt-4 text-center text-sm">
                Already have an account?{' '}
                <Link href="/" className="underline">
                  Log in
                </Link>
              </div>
            </div>
          </div>
          <div className="hidden bg-muted lg:flex items-center justify-center flex-col text-center p-8">
            <Icons.logo className="h-24 w-24 text-primary mb-4" />
            <h2 className="text-4xl font-bold font-headline">Join MediQuest AI Today</h2>
            <p className="text-lg text-muted-foreground mt-2 max-w-md">Your Personal Health Intelligence Partner. Advanced analysis for reports and scans, at your fingertips.</p>
          </div>
        </div>
      );
}