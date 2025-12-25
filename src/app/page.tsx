'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { useAuth, initiateEmailSignIn, initiateGoogleSignIn } from '@/firebase';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { UserRole } from '@/lib/types';

function LoginForm({ role }: { role: UserRole }) {
    const auth = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState(role === 'patient' ? 'patient@mediquest.ai' : '');
    const [password, setPassword] = useState(role === 'patient' ? 'password123' : '');

    const handleLogin = () => {
        if (!email || !password) return;
        initiateEmailSignIn(auth, email, password);
        router.push('/dashboard');
    }

    const handleGoogleSignIn = () => {
        initiateGoogleSignIn(auth, role).then(() => {
            router.push('/dashboard');
        });
    }

    return (
        <CardContent>
            <div className="grid gap-4">
                <div className="grid gap-2">
                <Label htmlFor={`${role}-email`}>Email</Label>
                <Input
                    id={`${role}-email`}
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                </div>
                <div className="grid gap-2">
                <div className="flex items-center">
                    <Label htmlFor={`${role}-password`}>Password</Label>
                    <Link
                    href="#"
                    className="ml-auto inline-block text-sm underline"
                    >
                    Forgot your password?
                    </Link>
                </div>
                <Input id={`${role}-password`} type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" onClick={handleLogin}>
                    Login with Email
                </Button>
                 <div className="relative my-2">
                    <Separator />
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">OR</span>
                </div>
                 <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
                    Sign in with Google
                </Button>
            </div>
        </CardContent>
    )
}

export default function LoginPage() {
  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center py-12 px-4">
        <div className="mx-auto grid w-full max-w-md gap-6">
          <div className="grid gap-2 text-center">
             <Icons.logo className="h-16 w-16 text-primary mb-4 mx-auto" />
            <h1 className="text-3xl font-bold font-headline">Welcome to MediQuest AI</h1>
            <p className="text-balance text-muted-foreground">
              Select your role to sign in to your account.
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
                        <CardTitle className="text-2xl">Patient Login</CardTitle>
                        <CardDescription>Use our demo account, your email, or Google.</CardDescription>
                    </CardHeader>
                    <LoginForm role="patient" />
                </Card>
            </TabsContent>
             <TabsContent value="doctor">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Doctor Login</CardTitle>
                        <CardDescription>Enter your credentials to access the doctor portal.</CardDescription>
                    </CardHeader>
                    <LoginForm role="doctor" />
                </Card>
            </TabsContent>
             <TabsContent value="medicine_store">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Pharmacy Login</CardTitle>
                        <CardDescription>Access your pharmacy dashboard.</CardDescription>
                    </CardHeader>
                    <LoginForm role="medicine_store" />
                </Card>
            </TabsContent>
          </Tabs>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:flex items-center justify-center flex-col text-center p-8">
        <Icons.logo className="h-24 w-24 text-primary mb-4" />
        <h2 className="text-4xl font-bold font-headline">Your Health Intelligence Partner</h2>
        <p className="text-lg text-muted-foreground mt-2 max-w-md">Advanced analysis for reports and scans, at your fingertips.</p>
      </div>
    </div>
  );
}
