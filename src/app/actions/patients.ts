

'use client';

import { db } from '@/lib/firebase';
import type { Patient, Treatment, Payment, Discount, AssignedTreatment, Prescription, ToothExamination } from '@/lib/types';
import { doc, runTransaction, updateDoc, getDoc } from 'firebase/firestore';

export async function updatePatientDetails(patientId: string, patientData: Partial<Omit<Patient, 'id'>>) {
    const patientRef = doc(db, 'patients', patientId);
    try {
        await updateDoc(patientRef, patientData);

        const patientDoc = await getDoc(patientRef);
        if (!patientDoc.exists()) {
            throw new Error("Patient document does not exist!");
        }
        const updatedPatient = { id: patientDoc.id, ...patientDoc.data() } as Patient;
        const { createdAt, ...serializablePatientData } = updatedPatient;

        return { success: true, data: serializablePatientData };
    } catch (e) {
        console.error("Failed to update patient details: ", e);
        return { success: false, error: (e as Error).message };
    }
}


export async function addTreatmentToPatient(patientId: string, treatmentData: Omit<AssignedTreatment, 'dateAdded'>) {
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

      if (!newRegistrationNumber) {
        const counterDoc = await transaction.get(counterRef);
        let lastNumber = 0;
        if (counterDoc.exists()) {
          lastNumber = counterDoc.data().lastNumber || 0;
        }
        const newNumber = lastNumber + 1;
        newRegistrationNumber = String(newNumber).padStart(3, '0');
        transaction.set(counterRef, { lastNumber: newNumber }, { merge: true });
      }

      const newAssignedTreatment: AssignedTreatment = {
        ...treatmentData,
        dateAdded: new Date().toISOString(),
      };

      const currentTreatments = patientData.assignedTreatments || [];
      const updatedTreatments = [...currentTreatments, newAssignedTreatment];

      transaction.update(patientRef, {
        registrationNumber: newRegistrationNumber,
        assignedTreatments: updatedTreatments
      });
      
      const { createdAt, ...serializablePatientData } = patientData;

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

export async function updateTreatmentInPatientPlan(patientId: string, updatedTreatment: AssignedTreatment) {
    const patientRef = doc(db, 'patients', patientId);
    try {
        const updatedPatientData = await runTransaction(db, async (transaction) => {
            const patientDoc = await transaction.get(patientRef);
            if (!patientDoc.exists()) {
                throw new Error("Patient document does not exist!");
            }
            const patientData = patientDoc.data() as Patient;
            const currentTreatments = patientData.assignedTreatments || [];
            const updatedTreatments = currentTreatments.map(t =>
                t.id === updatedTreatment.id ? updatedTreatment : t
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


export async function removeTreatmentFromPatient(patientId: string, treatmentId: string) {
    const patientRef = doc(db, 'patients', patientId);
    try {
        const updatedPatientData = await runTransaction(db, async (transaction) => {
            const patientDoc = await transaction.get(patientRef);
            if (!patientDoc.exists()) {
                throw new Error("Patient document does not exist!");
            }

            const patientData = patientDoc.data() as Patient;
            const currentTreatments = patientData.assignedTreatments || [];

            const updatedTreatments = currentTreatments.filter(t => t.id !== treatmentId);

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
        const { createdAt, ...serializableData } = updatedPatientData;
        return { success: true, data: serializableData as Patient };
    } catch (e) {
        console.error("Transaction failed: ", e);
        return { success: false, error: (e as Error).message || "An unexpected error occurred." };
    }
}

export async function addDiscountToPatient(patientId: string, discount: Omit<Discount, 'id' | 'amount'>) {
    const patientRef = doc(db, 'patients', patientId);
    try {
        const updatedPatientData = await runTransaction(db, async (transaction) => {
            const patientDoc = await transaction.get(patientRef);
            if (!patientDoc.exists()) {
                throw new Error("Patient document does not exist!");
            }

            const patientData = patientDoc.data() as Patient;
            
            const totalCost = patientData.assignedTreatments?.reduce((sum, t) => sum + t.cost, 0) || 0;
            let discountAmount = 0;
            if (discount.type === 'Percentage') {
                discountAmount = (totalCost * discount.value) / 100;
            } else {
                discountAmount = discount.value;
            }

            const newDiscount: Discount = {
                id: crypto.randomUUID(),
                ...discount,
                amount: discountAmount,
                dateAdded: new Date().toISOString(),
            };

            const currentDiscounts = patientData.discounts || [];
            const updatedDiscounts = [...currentDiscounts, newDiscount];

            transaction.update(patientRef, {
                discounts: updatedDiscounts
            });
            
            const { createdAt, ...serializablePatientData } = patientData;

            return {
                id: patientId,
                ...serializablePatientData,
                discounts: updatedDiscounts
            };
        });
        return { success: true, data: updatedPatientData };
    } catch (e) {
        console.error("Transaction failed: ", e);
        return { success: false, error: (e as Error).message || "An unexpected error occurred." };
    }
}

export async function removeDiscountFromPatient(patientId: string, discountId: string) {
    const patientRef = doc(db, 'patients', patientId);
    try {
        const updatedPatientData = await runTransaction(db, async (transaction) => {
            const patientDoc = await transaction.get(patientRef);
            if (!patientDoc.exists()) {
                throw new Error("Patient document does not exist!");
            }

            const patientData = patientDoc.data() as Patient;
            const currentDiscounts = patientData.discounts || [];

            const updatedDiscounts = currentDiscounts.filter(
                d => d.id !== discountId
            );

            transaction.update(patientRef, { discounts: updatedDiscounts });
            
            const { createdAt, ...serializablePatientData } = patientData;

            return {
                id: patientId,
                ...serializablePatientData,
                discounts: updatedDiscounts
            };
        });
        return { success: true, data: updatedPatientData };
    } catch (e) {
        console.error("Transaction failed: ", e);
        return { success: false, error: (e as Error).message || "An unexpected error occurred." };
    }
}

export async function addPrescriptionToPatient(patientId: string, prescriptionData: { notes: string; date: string; }) {
    const patientRef = doc(db, 'patients', patientId);
    try {
        const updatedPatientData = await runTransaction(db, async (transaction) => {
            const patientDoc = await transaction.get(patientRef);
            if (!patientDoc.exists()) {
                throw new Error("Patient document does not exist!");
            }

            const patientData = patientDoc.data() as Patient;

            const newPrescription: Prescription = {
                id: crypto.randomUUID(),
                ...prescriptionData,
                dateAdded: new Date().toISOString(),
            };
            
            const currentPrescriptions = patientData.prescriptions || [];
            const updatedPrescriptions = [...currentPrescriptions, newPrescription];

            transaction.update(patientRef, {
                prescriptions: updatedPrescriptions
            });

            const { createdAt, ...serializablePatientData } = patientData;

            return {
                id: patientId,
                ...serializablePatientData,
                prescriptions: updatedPrescriptions
            };
        });
        return { success: true, data: updatedPatientData };
    } catch (e) {
        console.error("Transaction failed: ", e);
        return { success: false, error: (e as Error).message || "An unexpected error occurred." };
    }
}

export async function saveToothExamination(patientId: string, examination: Omit<ToothExamination, 'id'>) {
    const patientRef = doc(db, 'patients', patientId);
    try {
        const updatedPatientData = await runTransaction(db, async (transaction) => {
            const patientDoc = await transaction.get(patientRef);
            if (!patientDoc.exists()) {
                throw new Error("Patient document does not exist!");
            }

            const patientData = patientDoc.data() as Patient;
            
            const newExamination: ToothExamination = {
                id: crypto.randomUUID(),
                ...examination
            };

            const currentExaminations = patientData.toothExaminations || [];
            const updatedExaminations = [...currentExaminations, newExamination];

            transaction.update(patientRef, {
                toothExaminations: updatedExaminations
            });
            
            const { createdAt, ...serializablePatientData } = patientData;

            return {
                id: patientId,
                ...serializablePatientData,
                toothExaminations: updatedExaminations
            };
        });
        return { success: true, data: updatedPatientData };
    } catch (e) {
        console.error("Transaction failed: ", e);
        return { success: false, error: (e as Error).message || "An unexpected error occurred." };
    }
}

export async function removeToothExamination(patientId: string, examinationId: string) {
    const patientRef = doc(db, 'patients', patientId);
    try {
        const updatedPatientData = await runTransaction(db, async (transaction) => {
            const patientDoc = await transaction.get(patientRef);
            if (!patientDoc.exists()) {
                throw new Error("Patient document does not exist!");
            }

            const patientData = patientDoc.data() as Patient;
            const currentExaminations = patientData.toothExaminations || [];
            
            const updatedExaminations = currentExaminations.filter(exam => exam.id !== examinationId);

            transaction.update(patientRef, { toothExaminations: updatedExaminations });

            const { createdAt, ...serializablePatientData } = patientData;
            
            return {
                id: patientId,
                ...serializablePatientData,
                toothExaminations: updatedExaminations
            };
        });
        return { success: true, data: updatedPatientData };
    } catch (e) {
        console.error("Transaction failed: ", e);
        return { success: false, error: (e as Error).message || "An unexpected error occurred." };
    }
}
    
