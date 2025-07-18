
'use server';

import { db, storage } from '@/lib/firebase';
import type { Patient, PatientFile } from '@/lib/types';
import { doc, runTransaction } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';

export async function addFileToPatient(patientId: string, fileData: Omit<PatientFile, 'id'>) {
    const patientRef = doc(db, 'patients', patientId);
    try {
        const updatedPatientData = await runTransaction(db, async (transaction) => {
            const patientDoc = await transaction.get(patientRef);
            if (!patientDoc.exists()) {
                throw new Error("Patient document does not exist!");
            }

            const patientData = patientDoc.data() as Patient;
            const newFile: PatientFile = {
                id: crypto.randomUUID(),
                ...fileData,
            };

            const currentFiles = patientData.files || [];
            const updatedFiles = [newFile, ...currentFiles];
            
            updatedFiles.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

            transaction.update(patientRef, {
                files: updatedFiles,
            });

            const { createdAt, ...serializablePatientData } = patientData;

            return {
                ...serializablePatientData,
                id: patientId,
                files: updatedFiles,
            };
        });
        return { success: true, data: updatedPatientData };
    } catch (e) {
        console.error('Transaction failed: ', e);
        return { success: false, error: (e as Error).message || 'An unexpected error occurred.' };
    }
}

export async function removeFileFromPatient(patientId: string, file: PatientFile) {
    const patientRef = doc(db, 'patients', patientId);
    const fileStorageRef = ref(storage, `patient_files/${patientId}/${file.name}`);

    try {
        // Delete the file from Cloud Storage
        await deleteObject(fileStorageRef);

        // Remove file metadata from Firestore
        const updatedPatientData = await runTransaction(db, async (transaction) => {
            const patientDoc = await transaction.get(patientRef);
            if (!patientDoc.exists()) {
                throw new Error("Patient document does not exist!");
            }

            const patientData = patientDoc.data() as Patient;
            const currentFiles = patientData.files || [];

            const updatedFiles = currentFiles.filter(
                (f) => f.id !== file.id
            );

            transaction.update(patientRef, { files: updatedFiles });
            
            const { createdAt, ...serializablePatientData } = patientData;
            
            return {
                ...serializablePatientData,
                id: patientId,
                files: updatedFiles,
            };
        });
        return { success: true, data: updatedPatientData };
    } catch (e) {
        console.error("Failed to remove file: ", e);
        return { success: false, error: (e as Error).message };
    }
}
