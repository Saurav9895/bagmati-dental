'use server';

import { db } from '@/lib/firebase';
import type { Doctor, StaffMember } from '@/lib/types';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';

// Doctors
export async function addDoctor(doctorData: Omit<Doctor, 'id' | 'createdAt'>): Promise<{ success: boolean; data?: Doctor; error?: string }> {
    try {
        const docRef = await addDoc(collection(db, "doctors"), {
            ...doctorData,
            createdAt: serverTimestamp(),
        });
        const newDoctor: Doctor = { id: docRef.id, ...doctorData };
        return { success: true, data: newDoctor };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

export async function getDoctors(): Promise<Doctor[]> {
    const q = query(collection(db, "doctors"), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Doctor[];
}

export async function updateDoctor(id: string, data: Partial<Doctor>): Promise<{ success: boolean; error?: string }> {
    try {
        await updateDoc(doc(db, "doctors", id), data);
        return { success: true };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

export async function deleteDoctor(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await deleteDoc(doc(db, "doctors", id));
        return { success: true };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}


// Staff
export async function addStaff(staffData: Omit<StaffMember, 'id' | 'createdAt'>): Promise<{ success: boolean; data?: StaffMember; error?: string }> {
    try {
        const docRef = await addDoc(collection(db, "staff"), {
            ...staffData,
            createdAt: serverTimestamp(),
        });
        const newStaff: StaffMember = { id: docRef.id, ...staffData };
        return { success: true, data: newStaff };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

export async function getStaff(): Promise<StaffMember[]> {
    const q = query(collection(db, "staff"), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StaffMember[];
}

export async function updateStaff(id: string, data: Partial<StaffMember>): Promise<{ success: boolean; error?: string }> {
    try {
        await updateDoc(doc(db, "staff", id), data);
        return { success: true };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

export async function deleteStaff(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await deleteDoc(doc(db, "staff", id));
        return { success: true };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}
