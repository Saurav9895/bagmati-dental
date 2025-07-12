
'use server';

import { db } from '@/lib/firebase';
import type { Treatment } from '@/lib/types';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';


export async function addTreatment(itemData: Omit<Treatment, 'id' | 'createdAt'>): Promise<{ success: boolean; data?: Treatment; error?: string }> {
    try {
        const docRef = await addDoc(collection(db, "treatments"), {
            ...itemData,
            createdAt: serverTimestamp(),
        });
        const newItem: Treatment = { id: docRef.id, ...itemData };
        return { success: true, data: newItem };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

export async function getTreatments(): Promise<Treatment[]> {
    const q = query(collection(db, "treatments"), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      const { createdAt, ...rest } = data;
      return { id: doc.id, ...rest } as Treatment;
    }) as Treatment[];
}

export async function updateTreatment(id: string, data: Partial<Treatment>): Promise<{ success: boolean; error?: string }> {
    try {
        await updateDoc(doc(db, "treatments", id), data);
        return { success: true };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

export async function deleteTreatment(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await deleteDoc(doc(db, "treatments", id));
        return { success: true };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}
