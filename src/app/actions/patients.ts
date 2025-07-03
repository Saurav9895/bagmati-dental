'use server';

import { db } from '@/lib/firebase';
import type { Patient, Treatment, Payment } from '@/lib/types';
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
      
      // The patientData from firestore contains a non-serializable 'createdAt' field.
      // We must omit it before returning it to the client.
      const { createdAt, ...serializablePatientData } = patientData;

      // Return the new data to update the client state
      return {
          id: patientId,
          ...serializablePatientData,
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

export async function removeTreatmentFromPatient(patientId: string, treatmentToRemove: Treatment & { dateAdded: string }) {
    const patientRef = doc(db, 'patients', patientId);
    try {
        const updatedPatientData = await runTransaction(db, async (transaction) => {
            const patientDoc = await transaction.get(patientRef);
            if (!patientDoc.exists()) {
                throw new Error("Patient document does not exist!");
            }

            const patientData = patientDoc.data() as Patient;
            const currentTreatments = patientData.assignedTreatments || [];

            // Filter out the treatment to be removed.
            const updatedTreatments = currentTreatments.filter(
                t => t.dateAdded !== treatmentToRemove.dateAdded
            );

            transaction.update(patientRef, { assignedTreatments: updatedTreatments });
            
            const { createdAt, ...serializablePatientData } = patientData;

            return {
                id: patientId,
                ...serializablePatientData,
                assignedTreatments: updatedTreatments
            };
        });
        return { success: true, data: updatedPatientData };
    } catch (e) {
        console.error("Transaction failed: ", e);
        return { success: false, error: (e as Error).message || "An unexpected error occurred." };
    }
}


export async function addPaymentToPatient(patientId: string, payment: Omit<Payment, 'dateAdded'>) {
    const patientRef = doc(db, 'patients', patientId);
    try {
        const updatedPatientData = await runTransaction(db, async (transaction) => {
            const patientDoc = await transaction.get(patientRef);
            if (!patientDoc.exists()) {
                throw new Error("Patient document does not exist!");
            }

            const patientData = patientDoc.data() as Patient;
            
            const newPayment: Payment = {
                ...payment,
                dateAdded: new Date().toISOString(),
            };

            const currentPayments = patientData.payments || [];
            const updatedPayments = [...currentPayments, newPayment];

            transaction.update(patientRef, {
                payments: updatedPayments
            });
            
            const { createdAt, ...serializablePatientData } = patientData;

            return {
                id: patientId,
                ...serializablePatientData,
                payments: updatedPayments
            };
        });
        return { success: true, data: updatedPatientData };
    } catch (e) {
        console.error("Transaction failed: ", e);
        return { success: false, error: (e as Error).message || "An unexpected error occurred." };
    }
}
