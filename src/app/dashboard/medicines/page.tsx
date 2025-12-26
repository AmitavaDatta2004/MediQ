'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import type { Medicine } from '@/lib/types';
import { Search, Pill, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function MedicinesPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [searchTerm, setSearchTerm] = useState('');

    // A query to get a few medicines to show by default.
    const popularMedicinesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // This is a simplification. A real app might have a 'popularity' field.
        // We will query from a single, arbitrary store's inventory for now.
        // A more robust solution would involve a top-level 'medicines' collection.
        return query(collection(firestore, `medicine_stores/pharmacy-1/inventory`), limit(10));
    }, [firestore]);

    const { data: popularMedicines, isLoading: popularLoading } = useCollection<Medicine>(popularMedicinesQuery);
    
    // A query to search for medicines based on the search term.
    const searchResultsQuery = useMemoFirebase(() => {
        if (!firestore || !searchTerm) return null;
        // This search is also simplified and searches the same arbitrary inventory.
        // Firestore is not ideal for full-text search. A dedicated search service (e.g., Algolia) is better.
        return query(
            collection(firestore, `medicine_stores/pharmacy-1/inventory`),
            where('name', '>=', searchTerm),
            where('name', '<=', searchTerm + '\uf8ff')
        );
    }, [firestore, searchTerm]);

    const { data: searchResults, isLoading: searchLoading } = useCollection<Medicine>(searchResultsQuery);
    
    const medicinesToShow = searchTerm ? searchResults : popularMedicines;
    const isLoading = searchTerm ? searchLoading : popularLoading;

  return (
    <div className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle className="text-3xl font-bold tracking-tight font-headline">Medicine Explorer</CardTitle>
                <CardDescription>
                    Search for medicines to understand their use, side effects, and local availability.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Search for a medicine (e.g., Paracetamol, Atorvastatin)..."
                        className="pl-10 h-12 text-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </CardContent>
        </Card>

        <div className="space-y-4">
            <h2 className="text-xl font-semibold">{searchTerm ? 'Search Results' : 'Popular Medicines'}</h2>
            {isLoading && <p>Loading medicines...</p>}
            
            {medicinesToShow && medicinesToShow.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {medicinesToShow.map(med => (
                        <Link key={med.id} href={`/dashboard/medicines/${med.id}`} passHref>
                           <Card className="hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer h-full flex flex-col">
                               <CardHeader className="flex-row items-center gap-4">
                                   <div className="bg-primary/10 text-primary p-3 rounded-lg">
                                       <Pill className="h-6 w-6"/>
                                   </div>
                                   <div>
                                       <CardTitle className="text-lg">{med.name}</CardTitle>
                                       <CardDescription>{med.category}</CardDescription>
                                   </div>
                               </CardHeader>
                               <CardContent className="flex-grow">
                                    <p className="text-sm text-muted-foreground line-clamp-2">{med.commonUses}</p>
                               </CardContent>
                               <CardFooter>
                                   <Button variant="link" className="p-0">
                                       View Details <ArrowRight className="ml-2 h-4 w-4" />
                                   </Button>
                               </CardFooter>
                           </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                !isLoading && <p className="text-muted-foreground text-center py-8">No medicines found.</p>
            )}
        </div>
    </div>
  )
}
