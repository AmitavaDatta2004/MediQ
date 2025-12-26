
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getFullMedicineDetailsAction } from '@/app/actions';
import { MedicineDetails } from '@/components/medicine-details';
import type { MedicineData } from '@/lib/medicine-types';
import { Loader2, Search, Bot } from 'lucide-react';

export default function MedicineDetailsPage() {
  const [medicineName, setMedicineName] = useState('');
  const [medicineData, setMedicineData] = useState<MedicineData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!medicineName) return;
    setIsLoading(true);
    setError(null);
    setMedicineData(null);
    try {
      // Hardcoding language and location for now. These can be made dynamic later.
      const data = await getFullMedicineDetailsAction({ 
        medicineName,
        language: 'en',
        location: 'San Francisco, CA' 
      });
      setMedicineData(data);
    } catch (err) {
      setError('Failed to fetch medicine details. Please try again.');
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
            Enter the name of any medicine to get a comprehensive, AI-generated report on its usage, side effects, and more.
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
            />
            <Button type="submit" onClick={handleSearch} disabled={isLoading} size="lg">
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Search className="mr-2 h-5 w-5" />
              )}
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex flex-col items-center justify-center text-center py-16">
          <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin" />
          <h3 className="mt-4 text-lg font-semibold text-muted-foreground">
            Our AI is compiling the report for {medicineName}...
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
