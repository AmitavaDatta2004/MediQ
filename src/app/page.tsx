
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Bot, Stethoscope, FileScan, ShieldCheck } from 'lucide-react';
import { Icons } from '@/components/icons';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: <Bot className="w-8 h-8 text-primary" />,
    title: 'AI-Powered Analysis',
    description: 'Upload your medical reports and scans to get simplified summaries, potential issues, and next steps in seconds.',
  },
  {
    icon: <FileScan className="w-8 h-8 text-primary" />,
    title: 'Health Inventory',
    description: 'Build a comprehensive, secure, and private digital vault of your entire medical history for smarter insights.',
  },
  {
    icon: <Stethoscope className="w-8 h-8 text-primary" />,
    title: 'Find a Specialist',
    description: 'Connect with doctors and grant them secure, time-limited access to your health records for consultations.',
  },
    {
    icon: <ShieldCheck className="w-8 h-8 text-primary" />,
    title: 'Patient-Controlled Privacy',
    description: 'You own your data. Share it with practitioners on your terms with granular consent management and full audit logs.',
    },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
                <Link href="#" className="flex items-center gap-2 mr-6">
                    <Icons.logo className="h-6 w-6 text-primary" />
                    <span className="font-bold font-headline">MediQuest AI</span>
                </Link>
                 <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                    <Link href="#features" className="text-muted-foreground transition-colors hover:text-foreground">Features</Link>
                    <Link href="#how-it-works" className="text-muted-foreground transition-colors hover:text-foreground">How It Works</Link>
                    <Link href="#" className="text-muted-foreground transition-colors hover:text-foreground">For Doctors</Link>
                </nav>
                <div className="flex flex-1 items-center justify-end gap-4">
                    <Button variant="ghost" asChild>
                        <Link href="/login">Log In</Link>
                    </Button>
                    <Button asChild>
                         <Link href="/signup">Sign Up Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                </div>
            </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24 lg:py-32">
          <div className="container text-center">
            <Badge variant="outline" className="mb-4 text-primary border-primary">Your Personal Health Intelligence Partner</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-headline tracking-tight">
              Understand Your Health, <br/> Empower Your Decisions
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
              MediQuest AI transforms your complex medical reports and scans into clear, actionable insights. Take control of your health journey today.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/signup">Get Started For Free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                 <Link href="#features">Explore Features</Link>
              </Button>
            </div>
             <div className="relative mt-12 w-full max-w-4xl mx-auto">
              <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
              <div className="absolute top-0 -right-4 w-72 h-72 bg-accent/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
              <div className="absolute -bottom-8 left-20 w-72 h-72 bg-secondary/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
              <div className="relative bg-background rounded-xl shadow-2xl p-2 border">
                 <Image 
                    src="https://picsum.photos/seed/101/1200/600" 
                    alt="MediQuest AI Dashboard Preview" 
                    width={1200}
                    height={600}
                    className="rounded-lg"
                    data-ai-hint="app dashboard health"
                    priority
                  />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 bg-muted/50">
          <div className="container">
            <div className="text-center">
              <h2 className="text-3xl font-bold font-headline tracking-tight">A Smarter Way to Manage Your Health</h2>
              <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                From analysis to consultation, MediQuest AI provides the tools you need for a complete health overview.
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <Card key={index} className="bg-background">
                  <CardHeader>
                    {feature.icon}
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-lg font-semibold">{feature.title}</CardTitle>
                    <CardDescription className="mt-2 text-sm">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 md:py-24">
            <div className="container">
                <div className="text-center">
                    <h2 className="text-3xl font-bold font-headline tracking-tight">Get Started in 3 Simple Steps</h2>
                    <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                        Begin your journey to better health understanding in just a few minutes.
                    </p>
                </div>
                <div className="mt-12 grid md:grid-cols-3 gap-8 text-center relative">
                   {/* Dotted line */}
                  <div className="hidden md:block absolute top-1/2 left-0 w-full h-px -translate-y-12">
                      <svg width="100%" height="2" className="overflow-visible">
                          <line x1="0" y1="1" x2="100%" y2="1" strokeWidth="2" stroke="hsl(var(--border))" strokeDasharray="8, 8"/>
                      </svg>
                  </div>
                    
                   <div className="relative flex flex-col items-center">
                       <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xl border-2 border-primary/20 mb-4 z-10 bg-background">1</div>
                       <h3 className="font-semibold text-lg">Create Your Account</h3>
                       <p className="text-muted-foreground mt-2 text-sm">Sign up for free and create your secure patient profile.</p>
                   </div>
                    <div className="relative flex flex-col items-center">
                       <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xl border-2 border-primary/20 mb-4 z-10 bg-background">2</div>
                       <h3 className="font-semibold text-lg">Upload Your Documents</h3>
                       <p className="text-muted-foreground mt-2 text-sm">Add your medical reports, scans, and prescriptions to your Health Inventory.</p>
                   </div>
                    <div className="relative flex flex-col items-center">
                       <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xl border-2 border-primary/20 mb-4 z-10 bg-background">3</div>
                       <h3 className="font-semibold text-lg">Receive AI Insights</h3>
                       <p className="text-muted-foreground mt-2 text-sm">Get instant, easy-to-understand summaries and find the right doctor.</p>
                   </div>
                </div>
            </div>
        </section>

      </main>

      <footer className="border-t">
        <div className="container py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Icons.logo className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} MediQuest AI. All rights reserved.</p>
          </div>
          <nav className="flex gap-4 text-sm font-medium">
             <Link href="#" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link>
             <Link href="#" className="text-muted-foreground hover:text-foreground">Terms of Service</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
