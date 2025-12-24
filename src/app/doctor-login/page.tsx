'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { useAuth, initiateEmailSignIn } from '@/firebase';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DoctorLoginPage() {
    const auth = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        if (!email || !password) return;
        initiateEmailSignIn(auth, email, password);
        router.push('/dashboard');
    }

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center py-12 px-4">
        <div className="mx-auto grid w-full max-w-md gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold font-headline">Doctor Login</h1>
            <p className="text-balance text-muted-foreground">
              Enter your credentials to access the doctor portal.
            </p>
          </div>
          <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Login</CardTitle>
                <CardDescription>Use your registered email and password.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="doctor@mediquest.ai"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    </div>
                    <div className="grid gap-2">
                    <div className="flex items-center">
                        <Label htmlFor="password">Password</Label>
                        <Link
                        href="#"
                        className="ml-auto inline-block text-sm underline"
                        >
                        Forgot your password?
                        </Link>
                    </div>
                    <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <Button type="submit" className="w-full" onClick={handleLogin}>
                        Login
                    </Button>
                    <div className="text-center text-sm">
                        Not a doctor? Login as a{' '}
                        <Link href="/" className="underline">
                        Patient
                        </Link> or a {' '}
                        <Link href="/store-login" className="underline">
                        Medicine Store
                        </Link>
                    </div>
                </div>
            </CardContent>
          </Card>
           <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/doctor-signup" className="underline">
              Sign up
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
