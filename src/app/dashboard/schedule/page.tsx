
import { AppointmentSchedule } from "@/components/dashboard/appointment-schedule";
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { Appointment, Patient } from '@/lib/types';

async function getAppointments(): Promise<Appointment[]> {
    const appointmentsCollection = collection(db, 'appointments');
    const q = query(appointmentsCollection, orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    const allAppointments = querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Omit non-serializable fields before passing from Server to Client Component.
      const { createdAt, ...rest } = data;
      return { id: doc.id, ...rest } as Appointment;
    });
    return allAppointments.filter(appt => appt.status !== 'Completed');
}

async function getPatients(): Promise<Patient[]> {
    const patientsCollection = collection(db, 'patients');
    const q = query(patientsCollection, orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Omit non-serializable fields
        const { createdAt, ...rest } = data;
        return { id: doc.id, ...rest } as Patient;
    });
}

export default async function SchedulePage() {
  const appointments = await getAppointments();
  const patients = await getPatients();

  return (
    <div className="h-full">
      <AppointmentSchedule appointments={appointments} patients={patients} />
    </div>
  );
}
