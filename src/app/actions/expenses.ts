'use server';

import { db } from '@/lib/firebase';
import type { Expense } from '@/lib/types';
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy } from 'firebase/firestore';

export async function addExpense(expenseData: Omit<Expense, 'id' | 'createdAt'>): Promise<{ success: boolean; data?: Expense; error?: string }> {
    try {
        const docRef = await addDoc(collection(db, "expenses"), {
            ...expenseData,
            createdAt: serverTimestamp(),
        });
        
        const newExpense: Expense = {
            id: docRef.id,
            ...expenseData,
        };

        return { success: true, data: newExpense };
    } catch (e) {
        console.error("Failed to add expense: ", e);
        return { success: false, error: (e as Error).message };
    }
}

export async function getExpenses(): Promise<Expense[]> {
    try {
        const expensesCollection = collection(db, 'expenses');
        const q = query(expensesCollection, orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            const { createdAt, ...rest } = data;
            return { id: doc.id, ...rest } as Expense;
        });
    } catch (error) {
        console.error("Failed to get expenses: ", error);
        return [];
    }
}
