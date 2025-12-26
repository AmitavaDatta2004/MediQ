
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { predictDiseaseAction } from '@/app/actions';
import type { DiseasePredictionOutput, Allergy, ChronicCondition } from '@/ai/schemas';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { BrainCircuit, Loader2, Sparkles, Heart, Activity, ShieldAlert, Stethoscope, ArrowRight, Lightbulb, Plus, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { collection } from 'firebase/firestore';

const commonSymptoms = [
    "Fever", "Headache", "Cough", "Fatigue", "Nausea", "Dizziness",
    "Chest Pain", "Shortness of Breath", "Body Aches", "Sore Throat"
];


export default function DiseasePredictionPage() {
    const [analysis, setAnalysis] = useState<DiseasePredictionOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useUser();
    const { toast } = useToast();
    const firestore = useFirestore();

    // Symptom state
    const [symptoms, setSymptoms] = useState<string[]>([]);
    const [currentSymptom, setCurrentSymptom] = useState('');

    // Form state
    const [chronicHistory, setChronicHistory] = useState('');
    const [medicationAllergies, setMedicationAllergies] = useState('');
    const [recentProcedures, setRecentProcedures] = useState('');
    const [lifestyle, setLifestyle] = useState('');
    const [sleep, setSleep] = useState('');

    // Fetching data from inventory
    const allergiesCollectionRef = useMemoFirebase(() => {
        if (!user) return null;
        return collection(firestore, `patients/${user.uid}/allergies`);
    }, [firestore, user]);
    const { data: allergies } = useCollection<Allergy>(allergiesCollectionRef);

    const conditionsCollectionRef = useMemoFirebase(() => {
        if (!user) return null;
        return collection(firestore, `patients/${user.uid}/chronic_conditions`);
    }, [firestore, user]);
    const { data: chronicConditions } = useCollection<ChronicCondition>(conditionsCollectionRef);
    
    useEffect(() => {
        if(allergies) {
            setMedicationAllergies(allergies.map(a => a.name).join(', '));
        }
    }, [allergies]);

    useEffect(() => {
        if(chronicConditions) {
            setChronicHistory(chronicConditions.map(c => c.name).join(', '));
        }
    }, [chronicConditions]);


    const handleAddSymptom = () => {
        if (currentSymptom && !symptoms.includes(currentSymptom)) {
            setSymptoms([...symptoms, currentSymptom]);
            setCurrentSymptom('');
        }
    };
    
    const handleToggleSymptom = (symptom: string) => {
        setSymptoms(prev => 
            prev.includes(symptom) 
            ? prev.filter(s => s !== symptom)
            : [...prev, symptom]
        );
    }

    const handleRemoveSymptom = (symptom: string) => {
        setSymptoms(symptoms.filter(s => s !== symptom));
    };

    const handleRunAnalysis = async () => {
        if (!user) {
            toast({
                variant: 'destructive',
                title: 'Authentication Error',
                description: 'You must be logged in to perform an analysis.'
            });
            return;
        }

        if (symptoms.length === 0) {
             toast({
                variant: 'destructive',
                title: 'Input Required',
                description: 'Please add at least one symptom before analyzing.'
            });
            return;
        }

        setIsLoading(true);
        setAnalysis(null);
        toast({
            title: 'Starting Health Analysis...',
            description: 'Our AI is reviewing your symptoms and health data. This may take a moment.'
        });

        try {
            const result = await predictDiseaseAction({ 
                patientId: user.uid,
                symptoms: symptoms.join(', '),
                chronicHistory,
                medicationAllergies,
                recentProcedures,
                lifestyle,
                sleep
            });
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

    const getUrgencyBadge = (urgency?: DiseasePredictionOutput['urgency']) => {
        if (!urgency) return 'outline';
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
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-3xl font-bold tracking-tight font-headline">
                        <BrainCircuit className="h-8 w-8 text-primary" />
                        AI Symptom Analyzer
                    </CardTitle>
                    <CardDescription className="text-lg">
                        Describe your symptoms and answer a few questions to get instant, AI-powered health insights.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="symptom-input">Enter Your Symptoms</Label>
                        <div className="flex gap-2">
                            <Input 
                                id="symptom-input" 
                                placeholder="e.g., persistent headache, mild fever..."
                                value={currentSymptom}
                                onChange={(e) => setCurrentSymptom(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddSymptom()}
                            />
                            <Button onClick={handleAddSymptom}><Plus className="mr-2 h-4 w-4" /> Add</Button>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label>Common Symptoms</Label>
                        <div className="flex flex-wrap gap-2">
                            {commonSymptoms.map(symptom => (
                                <Button 
                                    key={symptom} 
                                    variant={symptoms.includes(symptom) ? 'default' : 'outline'}
                                    onClick={() => handleToggleSymptom(symptom)}
                                    className="rounded-full"
                                >
                                    {symptom}
                                </Button>
                            ))}
                        </div>
                    </div>
                    {symptoms.length > 0 && (
                        <div className="space-y-2">
                            <Label>Your Added Symptoms</Label>
                             <div className="flex flex-wrap gap-2">
                                {symptoms.map(symptom => (
                                    <Badge key={symptom} className="py-1 px-2 text-sm">
                                        {symptom}
                                        <button onClick={() => handleRemoveSymptom(symptom)} className="ml-2 rounded-full hover:bg-destructive/20 p-0.5">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Health Questions</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="chronicHistory">Any chronic illnesses or family history?</Label>
                                <Textarea id="chronicHistory" value={chronicHistory} onChange={(e) => setChronicHistory(e.target.value)} placeholder="e.g., Diabetes, high blood pressure..."/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="medicationAllergies">Current medications or known allergies?</Label>
                                <Textarea id="medicationAllergies" value={medicationAllergies} onChange={(e) => setMedicationAllergies(e.target.value)} placeholder="e.g., Penicillin allergy, taking Metformin..."/>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="recentProcedures">Recent surgeries or vaccinations?</Label>
                                <Textarea id="recentProcedures" value={recentProcedures} onChange={(e) => setRecentProcedures(e.target.value)} placeholder="e.g., Flu shot last month..."/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lifestyle">Lifestyle factors (stress, smoking, etc.)?</Label>
                                <Textarea id="lifestyle" value={lifestyle} onChange={(e) => setLifestyle(e.target.value)} placeholder="e.g., High-stress job, smoke socially..."/>
                            </div>
                             <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="sleep">Describe your sleep pattern.</Label>
                                <Textarea id="sleep" value={sleep} onChange={(e) => setSleep(e.target.value)} placeholder="e.g., About 6 hours per night, difficulty falling asleep..."/>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button size="lg" onClick={handleRunAnalysis} disabled={isLoading} className="w-full sm:w-auto">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Analyzing Symptoms...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-5 w-5" />
                                Analyze Symptoms
                            </>
                        )}
                    </Button>
                </CardFooter>
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
                                    <div className="p-3 bg-primary/10 rounded-full text-primary"><Stethoscope className="w-6 h-6"/></div>
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
