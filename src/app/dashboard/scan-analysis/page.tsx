'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Upload, Loader2, Image as ImageIcon, AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { analyzeScanForAnomaliesAction } from '@/app/actions';
import type { AnalyzeScanForAnomaliesOutput } from '@/ai/flows/analyze-scan-for-anomalies';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

const placeholderImageUrl = "https://picsum.photos/seed/201/600/400";

export default function ScanAnalysisPage() {
  const [analysis, setAnalysis] = useState<AnalyzeScanForAnomaliesOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanType, setScanType] = useState<'X-ray' | 'CT' | 'MRI' | ''>('');
  const [patientDetails, setPatientDetails] = useState('');
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAnalysis(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalysis = async () => {
    if (!previewUrl || !scanType || !user) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please upload an image and select a scan type.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await analyzeScanForAnomaliesAction({
        scanDataUri: previewUrl,
        scanType,
        patientDetails,
      });
      setAnalysis(result);

      // 1. Upload scan image to Firebase Storage
      const storage = getStorage();
      const storageRef = ref(storage, `patients/${user.uid}/scan_images/${uuidv4()}`);
      const snapshot = await uploadString(storageRef, previewUrl, 'data_url');
      const downloadURL = await getDownloadURL(snapshot.ref);

      // 2. Save analysis to Firestore
      const scanId = uuidv4();
      const scanCollectionRef = collection(firestore, `patients/${user.uid}/scan_images`);
      await addDoc(scanCollectionRef, {
          id: scanId,
          patientId: user.uid,
          uploadDate: new Date().toISOString(),
          scanType,
          imageUrl: downloadURL,
          aiAnalysis: {
            anomaliesDetected: result.anomaliesDetected,
            anomalyReport: result.anomalyReport,
            heatmapDataUri: result.heatmapDataUri, // This could also be stored in Storage if it's large
            urgencyClassification: result.urgencyClassification
          }
      });
      
      toast({
        title: "Analysis Complete & Saved",
        description: "Your scan has been analyzed and saved to your records.",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "There was an error analyzing your scan. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getUrgencyBadgeVariant = (urgency?: string) => {
    switch (urgency) {
      case 'Emergency':
      case 'Urgent':
        return 'destructive';
      case 'Routine':
        return 'secondary';
      default:
        return 'default';
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-1 flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Medical Scan</CardTitle>
            <CardDescription>
              Upload an X-ray, CT, or MRI scan for anomaly detection.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="relative aspect-video w-full flex items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg text-center overflow-hidden bg-muted/20">
              {previewUrl ? (
                <Image src={previewUrl} alt="Scan preview" fill objectFit="contain" />
              ) : (
                <div className='p-8'>
                    <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto" data-ai-hint="medical scan"/>
                    <p className="mt-2 text-sm text-muted-foreground">Image preview</p>
                </div>
              )}
            </div>
            <Input id="scan-upload" type="file" onChange={handleFileChange} accept="image/*" disabled={isLoading} />
            
            <div className="space-y-2">
                <Label htmlFor="scan-type">Scan Type</Label>
                <Select onValueChange={(value) => setScanType(value as any)} value={scanType} disabled={isLoading}>
                    <SelectTrigger id="scan-type">
                        <SelectValue placeholder="Select scan type..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="X-ray">X-ray</SelectItem>
                        <SelectItem value="CT">CT Scan</SelectItem>
                        <SelectItem value="MRI">MRI</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="patient-details">Patient Details (Optional)</Label>
                <Textarea
                    id="patient-details"
                    placeholder="e.g., Age: 45, Male, History of..."
                    value={patientDetails}
                    onChange={(e) => setPatientDetails(e.target.value)}
                    disabled={isLoading}
                />
            </div>
            
            <Button onClick={handleAnalysis} disabled={isLoading || !previewUrl || !scanType} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing & Saving...
                </>
              ) : (
                'Analyze Scan'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2">
        <Card className="min-h-[600px]">
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
             <CardDescription>
              AI-detected potential anomalies. Always consult a specialist.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis ? (
              <>
                 <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
                    <Image
                        src={analysis.heatmapDataUri || previewUrl || placeholderImageUrl}
                        alt="Analysis heatmap"
                        fill
                        objectFit="contain"
                        data-ai-hint="heatmap medical"
                    />
                    {analysis.heatmapDataUri && <Badge className="absolute top-2 right-2">Heatmap</Badge>}
                </div>

                <div className='flex items-center justify-between'>
                    <h3 className="font-semibold text-lg">Urgency Classification</h3>
                    <Badge variant={getUrgencyBadgeVariant(analysis.urgencyClassification)}>
                        {analysis.urgencyClassification}
                    </Badge>
                </div>
                
                 <div className="space-y-2">
                    <h3 className="flex items-center gap-2 font-semibold text-lg">
                        {analysis.anomaliesDetected ? <AlertCircle className="w-5 h-5 text-destructive" /> : <ShieldCheck className="w-5 h-5 text-green-600" />}
                        Anomaly Report
                    </h3>
                    <p className="text-muted-foreground bg-muted/50 p-4 rounded-md text-sm prose-sm">
                        {analysis.anomalyReport}
                    </p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                <ImageIcon className="w-16 h-16 mb-4" />
                <h3 className="text-lg font-semibold">Your scan analysis will appear here</h3>
                <p className="text-sm">Upload a scan and click "Analyze Scan" to begin.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
