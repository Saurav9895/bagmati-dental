import { doc, getDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Patient, Treatment, Appointment } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PatientDetailClient } from '@/components/dashboard/patient-detail-client';

async function getPatient(id: string): Promise<Patient | null> {
  const docRef = doc(db, 'patients', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    // The `createdAt` field is a Firestore Timestamp, which is not serializable
    // and cannot be passed from a Server Component to a Client Component.
    // We omit it here since it's not used on the client.
    const { createdAt, ...rest } = data;
    return { id: docSnap.id, ...rest } as Patient;
  } else {
    return null;
  }
}

async function getTreatments(): Promise<Treatment[]> {
    const treatmentsCollection = collection(db, 'treatments');
    const querySnapshot = await getDocs(treatmentsCollection);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      // The `createdAt` field is a Firestore Timestamp, which is not serializable.
      // We omit it to avoid errors when passing from Server to Client Components.
      const { createdAt, ...rest } = data;
      return { id: doc.id, ...rest };
    }) as Treatment[];
}

async function getAppointmentsForPatient(patientId: string): Promise<Appointment[]> {
    const appointmentsCollection = collection(db, 'appointments');
    const q = query(
      appointmentsCollection,
      where('patientId', '==', patientId),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      const { createdAt, ...rest } = data;
      return { id: doc.id, ...rest } as Appointment;
    });
}


export default async function PatientDetailPage({ params }: { params: { id: string } }) {
  const patient = await getPatient(params.id);
  const treatments = await getTreatments();
  const appointments = await getAppointmentsForPatient(params.id);

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-full">
         <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Patient Not Found</CardTitle>
                <CardDescription>The patient you are looking for does not exist.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild>
                    <Link href="/dashboard/patients">Back to Patient List</Link>
                </Button>
            </CardContent>
         </Card>
      </div>
    );
  }

  return <PatientDetailClient initialPatient={patient} treatments={treatments} appointments={appointments} />;
}
