
'use server';

import { db } from '@/lib/firebase';
import type { ClinicalExamination, Patient } from '@/lib/types';
import { doc, runTransaction } from 'firebase/firestore';

export async function addClinicalExaminationToPatient(
  patientId: string,
  examinationData: Omit<ClinicalExamination, 'id'>
) {
  const patientRef = doc(db, 'patients', patientId);
  try {
    const updatedPatientData = await runTransaction(db, async (transaction) => {
      const patientDoc = await transaction.get(patientRef);
      if (!patientDoc.exists()) {
        throw new Error('Patient document does not exist!');
      }

      const patientData = patientDoc.data() as Patient;
      const newExamination: ClinicalExamination = {
        id: crypto.randomUUID(),
        ...examinationData,
        chiefComplaint: examinationData.chiefComplaint || [], // Ensure it's an array
      };

      const currentExaminations = patientData.clinicalExaminations || [];
      const updatedExaminations = [newExamination, ...currentExaminations];
      
      updatedExaminations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      transaction.update(patientRef, {
        clinicalExaminations: updatedExaminations,
      });

      const { createdAt, ...serializablePatientData } = patientData;

      return {
        id: patientId,
        ...serializablePatientData,
        clinicalExaminations: updatedExaminations,
      };
    });
    return { success: true, data: updatedPatientData };
  } catch (e) {
    console.error('Transaction failed: ', e);
    return { success: false, error: (e as Error).message || 'An unexpected error occurred.' };
  }
}

export async function removeClinicalExaminationFromPatient(patientId: string, examinationId: string) {
    const patientRef = doc(db, 'patients', patientId);
    try {
        const updatedPatientData = await runTransaction(db, async (transaction) => {
            const patientDoc = await transaction.get(patientRef);
            if (!patientDoc.exists()) {
                throw new Error("Patient document does not exist!");
            }

            const patientData = patientDoc.data() as Patient;
            const currentExaminations = patientData.clinicalExaminations || [];

            const updatedExaminations = currentExaminations.filter(
                (exam) => exam.id !== examinationId
            );

            transaction.update(patientRef, { clinicalExaminations: updatedExaminations });

            const { createdAt, ...serializablePatientData } = patientData;

            return {
                id: patientId,
                ...serializablePatientData,
                clinicalExaminations: updatedExaminations,
            };
        });
        return { success: true, data: updatedPatientData };
    } catch (e) {
        console.error("Transaction failed: ", e);
        return { success: false, error: (e as Error).message || "An unexpected error occurred." };
    }
}
