
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getFullMedicineDetailsAction } from '@/app/actions';
import { MedicineDetails } from '@/components/medicine-details';
import type { MedicineData } from '@/lib/medicine-types';
import { Loader2, Search, Bot, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function MedicineDetailsPage() {
  const [medicineName, setMedicineName] = useState('');
  const [medicineData, setMedicineData] = useState<MedicineData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [location, setLocation] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(true);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(`${position.coords.latitude}, ${position.coords.longitude}`);
          setIsLocating(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast({
            variant: 'destructive',
            title: 'Location Error',
            description: 'Could not get your location. Please enable it in your browser settings. Defaulting to a sample location.'
          });
          setLocation('New York, NY'); // Fallback location
          setIsLocating(false);
        }
      );
    } else {
      toast({
        variant: 'destructive',
        title: 'Geolocation not supported',
        description: 'Defaulting to a sample location.'
      });
      setLocation('New York, NY'); // Fallback for old browsers
      setIsLocating(false);
    }
  }, [toast]);

  const handleSearch = async () => {
    if (!medicineName) return;
    if (!location) {
        toast({
            variant: 'destructive',
            title: 'Location not ready',
            description: 'Please wait a moment while we determine your location.'
        });
        return;
    }
    setIsLoading(true);
    setError(null);
    setMedicineData(null);
    try {
      const data = await getFullMedicineDetailsAction({ 
        medicineName,
        language: 'en',
        location,
      });
      setMedicineData(data);
    } catch (err) {
      setError('Failed to fetch medicine details. The AI model may be temporarily unavailable. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight font-headline flex items-center gap-3">
            <Bot className="h-8 w-8 text-primary" />
            AI Medicine Encyclopedia
          </CardTitle>
          <CardDescription className="text-lg">
            Enter the name of any medicine to get a comprehensive, AI-generated report including usage, side effects, and local availability.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full max-w-lg items-center space-x-2">
            <Input
              type="text"
              placeholder="e.g., Atorvastatin, Metformin, Amoxicillin..."
              value={medicineName}
              onChange={(e) => setMedicineName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="h-12 text-base"
              disabled={isLocating}
            />
            <Button type="submit" onClick={handleSearch} disabled={isLoading || isLocating} size="lg">
              {isLoading || isLocating ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Search className="mr-2 h-5 w-5" />
              )}
              Search
            </Button>
          </div>
            {isLocating && 
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin"/>
                    <span>Getting your location for nearby pharmacies...</span>
                </div>
            }
            {location && !isLocating &&
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-green-600"/>
                    <span>Location ready for pharmacy search.</span>
                </div>
            }
        </CardContent>
      </Card>

      {(isLoading || isLocating) && !medicineData && (
        <div className="flex flex-col items-center justify-center text-center py-16">
          <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin" />
          <h3 className="mt-4 text-lg font-semibold text-muted-foreground">
            {isLoading ? `Our AI is compiling the report for ${medicineName}...` : 'Initializing...'}
          </h3>
          <p className="text-sm text-muted-foreground">This may take a few moments.</p>
        </div>
      )}

      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">An Error Occurred</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {medicineData && <MedicineDetails data={medicineData} />}
    </div>
  );
}
