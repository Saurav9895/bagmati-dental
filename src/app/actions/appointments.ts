'use server';

import { db } from '@/lib/firebase';
import type { Appointment } from '@/lib/types';
import { collection, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';

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
