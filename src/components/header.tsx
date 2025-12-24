'use client';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useDoc, useUser, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Patient, Doctor, MedicineStore, UserRole } from '@/lib/types';
import { signOut } from 'firebase/auth';


export function Header({ userRole }: { userRole?: UserRole }) {
    const pathname = usePathname();
    const router = useRouter();
    const pageTitle = pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard';
    const capitalizedTitle = pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1);
    
    const { user } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();

    const userProfileDocRef = useMemoFirebase(() => {
        if (!user || !userRole) return null;
        const collectionName = userRole === 'doctor' ? 'doctors' : userRole === 'medicine_store' ? 'medicine_stores' : 'patients';
        return doc(firestore, collectionName, user.uid);
    }, [firestore, user, userRole]);

    const { data: userProfile } = useDoc<Patient | Doctor | MedicineStore>(userProfileDocRef);

    const getAvatarFallback = () => {
        if (!userProfile) return 'U';
        if ('firstName' in userProfile) {
            return `${userProfile.firstName?.[0] || ''}${userProfile.lastName?.[0] || ''}`;
        }
        if ('name' in userProfile) {
            return userProfile.name?.[0] || 'S';
        }
        return 'U';
    }
     const getAvatarUrl = () => {
        if (!userProfile) return undefined;
        if ('avatarUrl' in userProfile) return userProfile.avatarUrl;
        return undefined;
    }
    const getUserName = () => {
        if (!userProfile) return 'User';
        if ('firstName' in userProfile) return `${userProfile.firstName} ${userProfile.lastName}`;
        if ('name' in userProfile) return userProfile.name;
        return 'User';
    }


    const handleLogout = async () => {
      await signOut(auth);
      router.push('/');
    }

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
       <SidebarTrigger className="shrink-0 md:hidden" />
      <div className="w-full flex-1">
         <h1 className="font-semibold text-lg font-headline">{capitalizedTitle}</h1>
      </div>
       <form className="ml-auto flex-1 sm:flex-initial hidden md:block">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-background"
            />
          </div>
        </form>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
             <Avatar>
                <AvatarImage src={getAvatarUrl()} alt={getUserName()} data-ai-hint="person portrait" />
                <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
            </Avatar>
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild><Link href="/dashboard/profile">Profile</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link href="#">Support</Link></DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
