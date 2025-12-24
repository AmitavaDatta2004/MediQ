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

export default function StoreSignupPage() {
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
        if (!email || !password || !storeName || !address || !phone) {
            setError("Please fill in all fields.");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const storeData = {
                id: user.uid,
                name: storeName,
                address,
                phone,
                email: user.email,
            };
            
            const storeDocRef = doc(firestore, 'medicine_stores', user.uid);
            setDocumentNonBlocking(storeDocRef, storeData, { merge: true });

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
            <h1 className="text-3xl font-bold font-headline">Register Your Medicine Store</h1>
            <p className="text-balance text-muted-foreground">
              Enter your store's information to get started.
            </p>
          </div>
          <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Sign Up</CardTitle>
                <CardDescription>All fields are required.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="storeName">Store Name</Label>
                        <Input id="storeName" placeholder="City Pharmacy" required value={storeName} onChange={(e) => setStoreName(e.target.value)} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="address">Address</Label>
                        <Input id="address" placeholder="123 Main St, Anytown" required value={address} onChange={(e) => setAddress(e.target.value)} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" placeholder="+1 (555) 123-4567" required value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="store@example.com"
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
            <Link href="/store-login" className="underline">
              Log in
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:flex items-center justify-center flex-col text-center p-8">
        <Icons.logo className="h-24 w-24 text-primary mb-4" />
        <h2 className="text-4xl font-bold font-headline">MediQuest AI</h2>
        <p className="text-lg text-muted-foreground mt-2 max-w-md">Streamlining prescription fulfillment and inventory management.</p>
      </div>
    </div>
  );
}
