
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function setOpdCharge(amount: number): Promise<{ success: boolean; error?: string }> {
    try {
        const settingsRef = doc(db, 'settings', 'opdCharge');
        await setDoc(settingsRef, { amount });
        return { success: true };
    } catch (e) {
        console.error("Failed to set OPD charge: ", e);
        return { success: false, error: (e as Error).message };
    }
}

export async function getOpdCharge(): Promise<{ amount: number } | null> {
    try {
        const settingsRef = doc(db, 'settings', 'opdCharge');
        const docSnap = await getDoc(settingsRef);

        if (docSnap.exists()) {
            return docSnap.data() as { amount: number };
        } else {
            return null;
        }
    } catch (e) {
        console.error("Failed to get OPD charge: ", e);
        return null;
    }
}
