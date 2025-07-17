// src/ai/flows/delete-file.ts
'use server';
/**
 * @fileOverview A flow to securely delete a file from Firebase Storage.
 *
 * - deleteFile - A function that handles the file deletion process.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { storage } from '@/lib/firebase';
import { ref, deleteObject } from 'firebase/storage';

const DeleteFileInputSchema = z.object({
  storagePath: z.string().describe('The full path to the file in Firebase Storage.'),
});

export async function deleteFile(storagePath: string): Promise<{success: boolean, error?: string}> {
  try {
    await deleteFileFlow({ storagePath });
    return { success: true };
  } catch (e) {
    console.error('Error calling deleteFileFlow:', e);
    const error = e as Error;
    return { success: false, error: error.message || 'An unknown error occurred during file deletion.' };
  }
}

const deleteFileFlow = ai.defineFlow(
  {
    name: 'deleteFileFlow',
    inputSchema: DeleteFileInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    const fileRef = ref(storage, input.storagePath);
    await deleteObject(fileRef);
  }
);
