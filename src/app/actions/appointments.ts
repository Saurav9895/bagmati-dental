'use server';

import { db } from '@/lib/firebase';
import type { Appointment } from '@/lib/types';
import { collection, addDoc, serverTimestamp, getDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';

export async function addAppointment(appointmentData: Omit<Appointment, 'id' | 'createdAt'>): Promise<{ success: boolean; data?: Appointment; error?: string }> {
    try {
        const docRef = await addDoc(collection(db, "appointments"), {
            ...appointmentData,
            createdAt: serverTimestamp(),
        });
        
        // We get the doc again to have a serializable object to return to the client.
        const newDocSnap = await getDoc(docRef);
        if (newDocSnap.exists()) {
            const newAppointment = { id: newDocSnap.id, ...newDocSnap.data() } as Appointment;
            
            // Omit non-serializable fields before returning to client.
            // The `createdAt` field from the server is a Timestamp object.
            const { createdAt, ...serializableAppointment } = newAppointment;
            
            // We create a serializable date string for the client to use immediately.
            const clientAppointment = { ...serializableAppointment, dateAdded: new Date().toISOString() };
            
            return { success: true, data: clientAppointment as Appointment };
        } else {
             throw new Error("Failed to retrieve newly created appointment.");
        }
    } catch (e) {
        console.error("Failed to add appointment: ", e);
        return { success: false, error: (e as Error).message };
    }
}

export async function updateAppointment(appointmentId: string, appointmentData: Partial<Omit<Appointment, 'id' | 'createdAt'>>): Promise<{ success: boolean; data?: Appointment; error?: string }> {
    try {
        const appointmentRef = doc(db, "appointments", appointmentId);
        await updateDoc(appointmentRef, appointmentData);

        const updatedDocSnap = await getDoc(appointmentRef);
        if (updatedDocSnap.exists()) {
            const updatedAppointment = { id: updatedDocSnap.id, ...updatedDocSnap.data() } as Appointment;
            const { createdAt, ...serializableAppointment } = updatedAppointment;
            return { success: true, data: serializableAppointment as Appointment };
        } else {
            throw new Error("Failed to retrieve updated appointment.");
        }
    } catch (e) {
        console.error("Failed to update appointment: ", e);
        return { success: false, error: (e as Error).message };
    }
}

export async function deleteAppointment(appointmentId: string): Promise<{ success: boolean; error?: string }> {
    try {
        await deleteDoc(doc(db, "appointments", appointmentId));
        return { success: true };
    } catch (e) {
        console.error("Failed to delete appointment: ", e);
        return { success: false, error: (e as Error).message };
    }
}
