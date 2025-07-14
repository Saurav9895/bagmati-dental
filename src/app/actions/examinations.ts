'use server';

import { db } from '@/lib/firebase';
import type { ChiefComplaint, DentalExamination } from '@/lib/types';
import { collection, addDoc, getDocs, deleteDoc, serverTimestamp, query, orderBy, doc, updateDoc } from 'firebase/firestore';

// Chief Complaints
export async function addChiefComplaint(data: { name: string }): Promise<{ success: boolean; data?: ChiefComplaint; error?: string }> {
    try {
        const docRef = await addDoc(collection(db, "chiefComplaints"), { ...data, createdAt: serverTimestamp() });
        const newComplaint: ChiefComplaint = { id: docRef.id, ...data };
        return { success: true, data: newComplaint };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

export async function getChiefComplaints(): Promise<ChiefComplaint[]> {
    const q = query(collection(db, "chiefComplaints"), orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      const { createdAt, ...rest } = data;
      return { id: doc.id, ...rest } as ChiefComplaint;
    });
}

export async function updateChiefComplaint(id: string, data: { name: string }): Promise<{ success: boolean; error?: string }> {
    try {
        await updateDoc(doc(db, "chiefComplaints", id), data);
        return { success: true };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

export async function deleteChiefComplaint(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await deleteDoc(doc(db, "chiefComplaints", id));
        return { success: true };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

// Dental Examinations
export async function addDentalExamination(data: { name: string }): Promise<{ success: boolean; data?: DentalExamination; error?: string }> {
    try {
        const payload = { ...data, createdAt: serverTimestamp() };
        const docRef = await addDoc(collection(db, "dentalExaminations"), payload);
        const newExamination: DentalExamination = { id: docRef.id, ...data };
        return { success: true, data: newExamination };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

export async function getDentalExaminations(): Promise<DentalExamination[]> {
    const q = query(collection(db, "dentalExaminations"), orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      const { createdAt, ...rest } = data;
      return { id: doc.id, ...rest } as DentalExamination;
    });
}

export async function updateDentalExamination(id: string, data: { name: string }): Promise<{ success: boolean; error?: string }> {
    try {
        await updateDoc(doc(db, "dentalExaminations", id), data);
        return { success: true };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

export async function deleteDentalExamination(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await deleteDoc(doc(db, "dentalExaminations", id));
        return { success: true };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}
