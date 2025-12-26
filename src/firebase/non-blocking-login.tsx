'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getSdks, initializeFirebase } from '.';
import { setDocumentNonBlocking } from './non-blocking-updates';

type Role = 'patient' | 'doctor' | 'medicine_store';

async function handleGoogleSignUp(user: User, role: Role) {
    const { firestore } = initializeFirebase();
    
    // Check if user profile already exists
    const userDocRef = doc(firestore, `${role}s`, user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
        // User profile exists, just sign them in.
        return;
    }
    
    // New Google Sign-in, create profile
    const [firstName, ...lastNameParts] = user.displayName?.split(' ') || ['',''];
    const lastName = lastNameParts.join(' ');

    let profileData: any = {
        id: user.uid,
        email: user.email,
        avatarUrl: user.photoURL
    };

    if (role === 'patient') {
        profileData = {
            ...profileData,
            firstName,
            lastName,
            dateOfBirth: '',
        };
        const patientDocRef = doc(firestore, 'patients', user.uid);
        await setDocumentNonBlocking(patientDocRef, profileData, { merge: true });
    } else if (role === 'doctor') {
        profileData = {
            ...profileData,
            firstName,
            lastName,
            name: user.displayName,
            specialty: 'General Practice', // Default value
            location: 'Online',
            rating: 4.5,
            reviews: 50,
        };
        const doctorDocRef = doc(firestore, 'doctors', user.uid);
        await setDocumentNonBlocking(doctorDocRef, profileData, { merge: true });
    } else if (role === 'medicine_store') {
        profileData = {
            ...profileData,
            name: user.displayName || 'My Pharmacy',
            address: '123 Health St',
            phone: '555-1234'
        };
        const storeDocRef = doc(firestore, 'medicine_stores', user.uid);
        await setDocumentNonBlocking(storeDocRef, profileData, { merge: true });
    }

    // Create base user role document
    const baseUserDocRef = doc(firestore, 'users', user.uid);
    await setDocumentNonBlocking(baseUserDocRef, { id: user.uid, email: user.email, role: role }, { merge: true });
}


/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  // CRITICAL: Call signInAnonymously directly. Do NOT use 'await signInAnonymously(...)'.
  signInAnonymously(authInstance).catch(err => console.error(err));
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  // CRITICAL: Call createUserWithEmailAndPassword directly. Do NOT use 'await createUserWithEmailAndPassword(...)'.
  createUserWithEmailAndPassword(authInstance, email, password).catch(err => console.error(err));
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  // CRITICAL: Call signInWithEmailAndPassword directly. Do NOT use 'await signInWithEmailAndPassword(...)'.
  signInWithEmailAndPassword(authInstance, email, password).catch(err => console.error(err));
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate Google sign-in popup flow (non-blocking). */
export async function initiateGoogleSignIn(authInstance: Auth, role: Role) {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(authInstance, provider);
    await handleGoogleSignUp(result.user, role);
    // Auth state change is handled by onAuthStateChanged listener.
  } catch (err: any) {
    if (err.code !== 'auth/cancelled-popup-request') {
      console.error(err);
    }
    // Don't log error if user cancels the popup
  }
}