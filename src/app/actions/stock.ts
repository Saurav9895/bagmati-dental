'use server';

import { db } from '@/lib/firebase';
import type { StockItem } from '@/lib/types';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';


export async function addStockItem(itemData: Omit<StockItem, 'id' | 'createdAt' | 'lastUpdatedAt'>): Promise<{ success: boolean; data?: StockItem; error?: string }> {
    try {
        const docRef = await addDoc(collection(db, "stock"), {
            ...itemData,
            lastUpdatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
        });
        const newItem: StockItem = { id: docRef.id, ...itemData };
        return { success: true, data: newItem };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

export async function getStockItems(): Promise<StockItem[]> {
    const q = query(collection(db, "stock"), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StockItem[];
}

export async function updateStockItem(id: string, data: Partial<StockItem>): Promise<{ success: boolean; error?: string }> {
    try {
        await updateDoc(doc(db, "stock", id), { ...data, lastUpdatedAt: serverTimestamp() });
        return { success: true };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}

export async function deleteStockItem(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await deleteDoc(doc(db, "stock", id));
        return { success: true };
    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
}
