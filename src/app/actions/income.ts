'use server';

import { db } from '@/lib/firebase';
import type { Patient, Payment } from '@/lib/types';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export type Transaction = Payment & {
    patientName: string;
    patientId: string;
    patientRegistrationNumber?: string;
};

export async function getIncome(): Promise<Transaction[]> {
    try {
        const patientsCollection = collection(db, 'patients');
        const q = query(patientsCollection, orderBy('name'));
        const querySnapshot = await getDocs(q);
        const patients = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Patient[];

        const transactions: Transaction[] = [];

        patients.forEach(patient => {
            if (patient.payments && patient.payments.length > 0) {
                patient.payments.forEach(payment => {
                    transactions.push({
                        ...payment,
                        patientName: patient.name,
                        patientId: patient.id,
                        patientRegistrationNumber: patient.registrationNumber,
                    });
                });
            }
        });
        
        return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
        console.error("Failed to fetch income data:", error);
        return [];
    }
}
