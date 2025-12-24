import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';

export default function LoginPage() {
  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center py-12 px-4">
        <div className="mx-auto grid w-full max-w-md gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold font-headline">Login to MediQuest AI</h1>
            <p className="text-balance text-muted-foreground">
              Enter your email below to login to your account
            </p>
          </div>
          <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Login</CardTitle>
                <CardDescription>Use our demo account to proceed.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        defaultValue="patient@mediquest.ai"
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
                    <Input id="password" type="password" required defaultValue="password123" />
                    </div>
                    <Button type="submit" className="w-full" asChild>
                    <Link href="/dashboard">Login</Link>
                    </Button>
                    <Button variant="outline" className="w-full">
                    Login with Google
                    </Button>
                </div>
            </CardContent>
          </Card>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="#" className="underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:flex items-center justify-center flex-col text-center p-8">
        <Icons.logo className="h-24 w-24 text-primary mb-4" />
        <h2 className="text-4xl font-bold font-headline">MediQuest AI</h2>
        <p className="text-lg text-muted-foreground mt-2 max-w-md">Your Personal Health Intelligence Partner. Advanced analysis for reports and scans, at your fingertips.</p>
      </div>
    </div>
  );
}
