import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Patient, Treatment } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PatientDetailClient } from '@/components/dashboard/patient-detail-client';

async function getPatient(id: string): Promise<Patient | null> {
  const docRef = doc(db, 'patients', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Patient;
  } else {
    return null;
  }
}

async function getTreatments(): Promise<Treatment[]> {
    const treatmentsCollection = collection(db, 'treatments');
    const querySnapshot = await getDocs(treatmentsCollection);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Treatment[];
}


export default async function PatientDetailPage({ params }: { params: { id: string } }) {
  const patient = await getPatient(params.id);
  const treatments = await getTreatments();

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

  return <PatientDetailClient initialPatient={patient} treatments={treatments} />;
}
