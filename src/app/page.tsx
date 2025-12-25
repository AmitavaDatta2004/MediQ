'use client';
import Link from 'next/link';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, Bot, Stethoscope, FileScan, ShieldCheck, Menu, X, 
  Activity, CheckCircle2, ChevronRight, Lock, Pill, Brain, 
  Microscope, Store, User, Smartphone, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activePersona, setActivePersona] = useState<'patient' | 'doctor' | 'pharmacy'>('patient');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const personaContent = {
    patient: {
      title: "For Patients",
      description: "Take control of your health journey with AI-powered insights and seamless care.",
      features: [
        { icon: <FileScan />, text: "Upload reports & scans for instant AI analysis" },
        { icon: <Brain />, text: "Understand disease risks & preventive steps" },
        { icon: <Pill />, text: "Order medicines from local stores instantly" }
      ],
      image: "https://picsum.photos/seed/patientview/800/600",
      imageHint: "patient app interface"
    },
    doctor: {
      title: "For Doctors",
      description: "Enhance your practice with data-driven decision support and streamlined workflows.",
      features: [
        { icon: <Activity />, text: "Longitudinal patient history at a glance" },
        { icon: <Sparkles />, text: "AI-assisted diagnostic suggestions" },
        { icon: <Lock />, text: "Secure, consent-based record access" }
      ],
      image: "https://picsum.photos/seed/doctorview/800/600",
      imageHint: "doctor data analysis"
    },
    pharmacy: {
      title: "For Medicine Stores",
      description: "Digitize your inventory and connect directly with patients for prescription fulfillment.",
      features: [
        { icon: <Store />, text: "Receive verified digital prescriptions" },
        { icon: <Smartphone />, text: "Manage inventory & expiration tracking" },
        { icon: <CheckCircle2 />, text: "Expand customer base digitally" }
      ],
      image: "https://picsum.photos/seed/pharmacyview/800/600",
      imageHint: "pharmacy inventory app"
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 overflow-x-hidden font-sans">
      {/* Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
          scrolled || isMobileMenuOpen 
            ? 'bg-white/90 backdrop-blur-md border-slate-200 shadow-sm py-3' 
            : 'bg-transparent border-transparent py-5'
        }`}
      >
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Icons.logo className="transition-transform group-hover:scale-105 text-primary h-8 w-8" />
            <span className="font-headline font-bold text-xl text-slate-900 tracking-tight">MediQuest AI</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#platform" className="hover:text-primary transition-colors">Platform</a>
            <a href="#intelligence" className="hover:text-primary transition-colors">AI Core</a>
            <a href="#ecosystem" className="hover:text-primary transition-colors">Ecosystem</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" asChild className="font-semibold text-slate-700">
              <Link href="/login">Log In</Link>
            </Button>
            <Button size="sm" asChild className="rounded-full px-6">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Nav Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-100 p-4 shadow-xl animate-in slide-in-from-top-5 duration-200">
             <nav className="flex flex-col space-y-4">
                <a href="#platform" className="text-lg font-medium text-slate-800 py-2 border-b border-slate-50" onClick={() => setIsMobileMenuOpen(false)}>Platform</a>
                <a href="#intelligence" className="text-lg font-medium text-slate-800 py-2 border-b border-slate-50" onClick={() => setIsMobileMenuOpen(false)}>AI Core</a>
                <a href="#ecosystem" className="text-lg font-medium text-slate-800 py-2 border-b border-slate-50" onClick={() => setIsMobileMenuOpen(false)}>Ecosystem</a>
                <div className="flex flex-col gap-3 pt-4">
                    <Button variant="outline" className="w-full justify-center" asChild>
                        <Link href="/login">Log In</Link>
                    </Button>
                    <Button className="w-full justify-center" asChild>
                        <Link href="/signup">Get Started</Link>
                    </Button>
                </div>
             </nav>
          </div>
        )}
      </header>

      <main className="flex-1 pt-24">
        {/* Hero Section */}
        <section className="relative pt-12 pb-24 md:pt-20 md:pb-32 overflow-hidden bg-white">
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10 bg-[length:40px_40px]"></div>
          
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-4xl mx-auto space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-foreground border border-primary/20 text-primary text-sm font-semibold animate-in fade-in slide-in-from-bottom-3 duration-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>The Unified Healthcare Intelligence Platform</span>
                </div>
                
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-headline font-extrabold text-slate-900 tracking-tight leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                  Connecting Patients, Doctors, & <br className="hidden md:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-500">Intelligent Care.</span>
                </h1>
                
                <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
                  A single ecosystem that analyzes medical records, predicts health risks, connects you with specialists, and fulfills prescriptions instantly.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
                  <Button size="lg" className="w-full sm:w-auto min-w-[160px] h-12 rounded-full shadow-primary/25 shadow-xl text-base" asChild>
                    <Link href="/signup">
                      Join the Ecosystem <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 rounded-full text-base border-slate-300" asChild>
                    <a href="#intelligence">View AI Demo</a>
                  </Button>
                </div>
            </div>

            {/* Dashboard Visual */}
            <div className="mt-20 relative w-full max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-1000 delay-400">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-72 h-72 bg-primary/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
                
                <div className="relative rounded-2xl bg-slate-900/5 p-2 md:p-4 border border-slate-200/50 backdrop-blur-sm">
                    <Image 
                      src="https://picsum.photos/seed/mediquestdashboard/1200/700" 
                      alt="Platform Dashboard" 
                      width={1200}
                      height={700}
                      className="rounded-xl shadow-2xl w-full border border-slate-200"
                      data-ai-hint="app dashboard health"
                    />
                    
                    <div className="absolute top-8 left-8 bg-white/90 backdrop-blur border border-slate-200 p-3 rounded-lg shadow-lg flex items-center gap-3 animate-bounce duration-[4000ms] hidden md:flex">
                        <div className="bg-blue-100 p-2 rounded-md text-blue-600"><FileScan size={20}/></div>
                        <div>
                            <div className="text-xs font-bold text-slate-500 uppercase">OCR Analysis</div>
                            <div className="text-sm font-bold text-slate-900">Lab Report: Normal</div>
                        </div>
                    </div>

                    <div className="absolute bottom-12 right-12 bg-white/90 backdrop-blur border border-slate-200 p-3 rounded-lg shadow-lg flex items-center gap-3 animate-bounce duration-[5000ms] hidden md:flex">
                        <div className="bg-emerald-100 p-2 rounded-md text-emerald-600"><Brain size={20}/></div>
                        <div>
                            <div className="text-xs font-bold text-slate-500 uppercase">Risk Prediction</div>
                            <div className="text-sm font-bold text-slate-900">Preventive Care Mode</div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </section>

        {/* Intelligence Core Section */}
        <section id="intelligence" className="py-24 bg-white">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col md:flex-row gap-12 items-center mb-16">
                    <div className="flex-1">
                        <Badge variant="outline" className="mb-4 text-primary border-primary/20 bg-primary/10">
                            The Intelligence Engine
                        </Badge>
                        <h2 className="text-3xl md:text-4xl font-headline font-bold text-slate-900 mb-6">
                            Advanced AI that Speaks Medical
                        </h2>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            Our platform isn't just a database. It's an active assistant powered by multiple AI models designed to parse, analyze, and predict.
                        </p>
                    </div>
                    <div className="flex-1 flex justify-end">
                       <div className="grid grid-cols-2 gap-4">
                           <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                               <div className="text-3xl font-bold text-primary mb-1">99%</div>
                               <div className="text-sm text-slate-500">OCR Accuracy</div>
                           </div>
                           <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                               <div className="text-3xl font-bold text-emerald-600 mb-1">&lt;5s</div>
                               <div className="text-sm text-slate-500">Analysis Time</div>
                           </div>
                       </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <Card className="bg-slate-50 border-slate-200 hover:border-primary/30 transition-colors">
                        <CardHeader>
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 text-primary">
                                <FileScan className="w-6 h-6" />
                            </div>
                            <CardTitle>OCR & Text Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-600">
                                Upload handwritten or printed PDFs. Our engine extracts vital markers, detects abnormal values, and translates medical jargon into plain English.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-50 border-slate-200 hover:border-primary/30 transition-colors">
                        <CardHeader>
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 text-primary">
                                <Microscope className="w-6 h-6" />
                            </div>
                            <CardTitle>Vision AI Scans</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-600">
                                Specialized computer vision models analyze X-rays, CTs, and MRIs to highlight regions of interest and classify urgency levels for doctors.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-50 border-slate-200 hover:border-primary/30 transition-colors">
                        <CardHeader>
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 text-primary">
                                <Brain className="w-6 h-6" />
                            </div>
                            <CardTitle>Predictive Risk Models</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-600">
                                By analyzing longitudinal history, our ML models estimate disease risks and suggest preventive measures before issues become critical.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

        {/* Persona/Ecosystem Section */}
        <section id="platform" className="py-24 bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-green-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-5xl font-headline font-bold mb-6">One Platform, Three Worlds</h2>
                    <p className="text-slate-300 max-w-2xl mx-auto text-lg">
                        We unite the fragmented healthcare system. Select your role to see how MediQuest empowers you.
                    </p>
                </div>

                <div className="flex justify-center mb-12">
                    <div className="inline-flex bg-slate-800 p-1 rounded-full border border-slate-700">
                        {(['patient', 'doctor', 'pharmacy'] as const).map((persona) => (
                            <button
                                key={persona}
                                onClick={() => setActivePersona(persona)}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 capitalize ${
                                    activePersona === persona 
                                    ? 'bg-primary text-primary-foreground shadow-lg' 
                                    : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                {persona}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto bg-slate-800/50 rounded-3xl p-8 border border-slate-700/50 backdrop-blur-sm transition-all duration-500">
                    <div className="order-2 lg:order-1 space-y-8">
                        <div>
                            <h3 className="text-3xl font-bold mb-4">{personaContent[activePersona].title}</h3>
                            <p className="text-xl text-slate-300 leading-relaxed">
                                {personaContent[activePersona].description}
                            </p>
                        </div>
                        <div className="space-y-4">
                            {personaContent[activePersona].features.map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl border border-slate-700">
                                    <div className="text-primary">{feature.icon}</div>
                                    <span className="font-medium">{feature.text}</span>
                                </div>
                            ))}
                        </div>
                        <Button asChild className="w-full sm:w-auto bg-white text-slate-900 hover:bg-slate-200">
                           <Link href="/signup"> Get Started as a {activePersona}</Link>
                        </Button>
                    </div>
                    <div className="order-1 lg:order-2">
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700 aspect-video">
                            <div className="absolute inset-0 bg-primary-900/20 mix-blend-overlay z-10"></div>
                            <Image 
                                src={personaContent[activePersona].image} 
                                alt={personaContent[activePersona].title}
                                width={800}
                                height={600}
                                data-ai-hint={personaContent[activePersona].imageHint}
                                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Security & Workflow Section */}
        <section id="ecosystem" className="py-24 bg-slate-50">
            <div className="container mx-auto px-4 md:px-6">
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-headline font-bold text-slate-900 mb-6">
                        Secure by Design, Private by Default
                    </h2>
                    <p className="text-lg text-slate-600">
                        Your health data is sensitive. We built MediQuest with bank-grade security and strict compliance standards.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="flex flex-col items-center text-center p-6">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3">End-to-End Encryption</h3>
                        <p className="text-slate-600">All data is encrypted in transit and at rest. Only you hold the keys to your health vault.</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-6">
                            <User className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3">Granular Consent</h3>
                        <p className="text-slate-600">Share records with doctors for a limited time. Revoke access instantly after consultation.</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-6">
                            <Lock className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3">Audit Logs</h3>
                        <p className="text-slate-600">Complete transparency. See exactly who accessed your data and when in your activity log.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-white relative border-t border-slate-100">
           <div className="container mx-auto px-4 md:px-6 text-center">
              <h2 className="text-4xl md:text-6xl font-headline font-bold mb-8 text-slate-900 tracking-tight">
                  The Future of Health <br/> <span className="text-primary">Is Connected.</span>
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="rounded-full px-8 h-14 text-lg shadow-xl shadow-primary/20" asChild>
                      <Link href="/signup">Start Free Patient Account</Link>
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg" asChild>
                      <Link href="/signup">Register as Practitioner</Link>
                  </Button>
              </div>
           </div>
        </section>

      </main>

      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
               <Link href="/" className="flex items-center gap-2 mb-6 text-white">
                <Icons.logo className="h-8 w-8 text-primary" />
                <span className="font-bold text-xl tracking-tight">MediQuest AI</span>
               </Link>
               <p className="text-sm leading-relaxed mb-6">
                 The Unified Healthcare Intelligence Platform. Empowering patients, doctors, and pharmacies with AI-driven insights for a healthier tomorrow.
               </p>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-6 text-lg">Ecosystem</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#platform" className="hover:text-white transition-colors">For Patients</a></li>
                <li><a href="#platform" className="hover:text-white transition-colors">For Doctors</a></li>
                <li><a href="#platform" className="hover:text-white transition-colors">For Pharmacies</a></li>
                <li><a href="#" className="hover:text-white transition-colors">AI Research</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 text-lg">Resources</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Access</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 text-lg">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">HIPAA Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-900 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} MediQuest AI. All rights reserved. Disclaimer: This platform is assistive and does not replace professional medical diagnosis.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
