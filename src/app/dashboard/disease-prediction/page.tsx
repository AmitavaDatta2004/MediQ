'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { predictDiseaseAction } from '@/app/actions';
import type { DiseasePredictionOutput } from '@/ai/schemas';
import { useUser } from '@/firebase';
import { BrainCircuit, Loader2, Sparkles, Heart, Activity, ShieldAlert, UserMd, ArrowRight, Lightbulb } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function DiseasePredictionPage() {
    const [analysis, setAnalysis] = useState<DiseasePredictionOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useUser();
    const { toast } = useToast();

    const handleRunAnalysis = async () => {
        if (!user) {
            toast({
                variant: 'destructive',
                title: 'Authentication Error',
                description: 'You must be logged in to perform an analysis.'
            });
            return;
        }

        setIsLoading(true);
        setAnalysis(null);
        toast({
            title: 'Starting Health Analysis...',
            description: 'Our AI is reviewing your complete health record. This may take a moment.'
        });

        try {
            const result = await predictDiseaseAction({ patientId: user.uid });
            setAnalysis(result);
            toast({
                title: 'Analysis Complete!',
                description: 'Your personalized health insights are ready.'
            });
        } catch (error) {
            console.error('Disease prediction error:', error);
            toast({
                variant: 'destructive',
                title: 'Analysis Failed',
                description: 'An unexpected error occurred. Please try again later.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getUrgencyBadge = (urgency: DiseasePredictionOutput['urgency']) => {
        switch (urgency) {
            case 'Emergency': return 'destructive';
            case 'High': return 'destructive';
            case 'Moderate': return 'secondary';
            case 'Low': return 'default';
            default: return 'outline';
        }
    }

    return (
        <div className="space-y-8">
            <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-3xl font-bold tracking-tight font-headline">
                        <BrainCircuit className="h-8 w-8 text-primary" />
                        AI Disease Prediction Engine
                    </CardTitle>
                    <CardDescription className="text-lg">
                        Leverage the power of AI to analyze your comprehensive health data and identify potential risks and recommendations.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 max-w-3xl">
                        This tool synthesizes your medical reports, scans, allergies, and conditions to generate insights. It is intended for informational purposes and is not a substitute for professional medical advice. The more complete your <Link href="/dashboard/inventory" className="underline font-medium text-primary">Health Inventory</Link>, the more accurate the analysis.
                    </p>
                    <Button size="lg" onClick={handleRunAnalysis} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Analyzing Your Health Data...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-5 w-5" />
                                Run Comprehensive Analysis
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {isLoading && !analysis && (
                 <div className="text-center py-16">
                    <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin" />
                    <h3 className="mt-4 text-lg font-semibold text-muted-foreground">Gathering and analyzing your records...</h3>
                </div>
            )}

            {analysis && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in-50">
                    <div className="lg:col-span-1 space-y-8">
                        <Card>
                             <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Health Score</CardTitle>
                             </CardHeader>
                             <CardContent className="space-y-3">
                                <div className="flex items-baseline gap-2">
                                     <span className="text-5xl font-bold text-primary">{analysis.healthScore}</span>
                                     <span className="text-xl font-medium text-muted-foreground">/ 100</span>
                                </div>
                                <Progress value={analysis.healthScore} className="h-3" />
                                <p className="text-xs text-muted-foreground">A higher score indicates better overall health based on the available data.</p>
                             </CardContent>
                        </Card>
                        <Card>
                             <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Consultation Urgency</CardTitle>
                             </CardHeader>
                             <CardContent>
                                <Badge variant={getUrgencyBadge(analysis.urgency)} className="text-lg px-4 py-1">{analysis.urgency}</Badge>
                                <p className="text-xs text-muted-foreground mt-2">The AI's estimation of how soon you should consult a professional.</p>
                             </CardContent>
                        </Card>
                        <Card>
                             <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Recommended Specialist</CardTitle>
                             </CardHeader>
                             <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-primary/10 rounded-full text-primary"><UserMd className="w-6 h-6"/></div>
                                    <span className="text-xl font-semibold">{analysis.doctorSpecialty}</span>
                                </div>
                                <Button className="w-full" asChild>
                                    <Link href="/dashboard/doctors">Find a {analysis.doctorSpecialty} <ArrowRight className="ml-2 h-4 w-4"/></Link>
                                </Button>
                             </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-2 space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-primary"/> Health Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground leading-relaxed">{analysis.summary}</p>
                            </CardContent>
                        </Card>
                        <div className="grid md:grid-cols-2 gap-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-destructive"/> Top Risk Factors</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3 list-disc pl-5 text-muted-foreground">
                                        {analysis.riskFactors.map((factor, i) => <li key={i}>{factor}</li>)}
                                    </ul>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Lightbulb className="w-5 h-5 text-yellow-500"/> Recommendations</CardTitle>
                                </CardHeader>
                                <CardContent>
                                     <ul className="space-y-3 list-disc pl-5 text-muted-foreground">
                                        {analysis.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
