'use server';

import { db } from '@/lib/firebase';
import type { Patient, Treatment } from '@/lib/types';
import { doc, runTransaction, arrayUnion } from 'firebase/firestore';

export async function addTreatmentToPatient(patientId: string, treatment: Treatment) {
  const patientRef = doc(db, 'patients', patientId);
  const counterRef = doc(db, 'counters', 'patientRegistration');

  try {
    const updatedPatientData = await runTransaction(db, async (transaction) => {
      const patientDoc = await transaction.get(patientRef);
      if (!patientDoc.exists()) {
        throw new Error("Patient document does not exist!");
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

      // Add the new treatment to the patient's record.
      const newAssignedTreatment = {
        ...treatment,
        dateAdded: new Date().toISOString(),
      };

      const currentTreatments = patientData.assignedTreatments || [];
      const updatedTreatments = [...currentTreatments, newAssignedTreatment];

      transaction.update(patientRef, {
        registrationNumber: newRegistrationNumber,
        assignedTreatments: updatedTreatments
      });
      
      // Return the new data to update the client state
      return {
          id: patientId,
          ...patientData,
          registrationNumber: newRegistrationNumber,
          assignedTreatments: updatedTreatments
      };
    });
    return { success: true, data: updatedPatientData };
  } catch (e) {
    console.error("Transaction failed: ", e);
    return { success: false, error: (e as Error).message || "An unexpected error occurred." };
  }
}
