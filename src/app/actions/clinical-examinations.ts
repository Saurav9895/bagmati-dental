
'use server';

import { db } from '@/lib/firebase';
import type { ClinicalExamination, Patient } from '@/lib/types';
import { doc, runTransaction } from 'firebase/firestore';

export async function addClinicalExaminationToPatient(
  patientId: string,
  examinationData: Omit<ClinicalExamination, 'id'>
) {
  const patientRef = doc(db, 'patients', patientId);
  const counterRef = doc(db, 'counters', 'patientRegistration');

  try {
    const updatedPatientData = await runTransaction(db, async (transaction) => {
      const patientDoc = await transaction.get(patientRef);
      if (!patientDoc.exists()) {
        throw new Error('Patient document does not exist!');
      }

      const patientData = patientDoc.data() as Patient;
      let newRegistrationNumber = patientData.registrationNumber;

      // If patient doesn't have a registration number, generate one.
      if (!newRegistrationNumber) {
        const counterDoc = await transaction.get(counterRef);
        let lastNumber = 0;
        if (counterDoc.exists()) {
          lastNumber = counterDoc.data().lastNumber || 0;
        }
        const newNumber = lastNumber + 1;
        newRegistrationNumber = String(newNumber).padStart(3, '0');
        
        // Update the counter
        transaction.set(counterRef, { lastNumber: newNumber }, { merge: true });
      }

      const newExamination: ClinicalExamination = {
        id: crypto.randomUUID(),
        ...examinationData,
      };

      const currentExaminations = patientData.clinicalExaminations || [];
      const updatedExaminations = [newExamination, ...currentExaminations];
      
      updatedExaminations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      transaction.update(patientRef, {
        registrationNumber: newRegistrationNumber,
        clinicalExaminations: updatedExaminations,
      });

      const { createdAt, ...serializablePatientData } = patientData;

      return {
        id: patientId,
        ...serializablePatientData,
        registrationNumber: newRegistrationNumber,
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
