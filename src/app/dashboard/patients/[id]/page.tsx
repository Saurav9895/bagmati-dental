import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Patient } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, Calendar as CalendarIcon, MapPin, FileText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

async function getPatient(id: string): Promise<Patient | null> {
  const docRef = doc(db, 'patients', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Patient;
  } else {
    return null;
  }
}

export default async function PatientDetailPage({ params }: { params: { id: string } }) {
  const patient = await getPatient(params.id);

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

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold font-headline">{patient.name}</h1>
                <p className="text-muted-foreground">Patient Details</p>
            </div>
             <Button asChild variant="outline">
                <Link href="/dashboard/patients">Back to List</Link>
            </Button>
        </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-4">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <span>{patient.email}</span>
            </div>
            <div className="flex items-center gap-4">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <span>{patient.phone}</span>
            </div>
            <div className="flex items-center gap-4">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <span>{patient.address}</span>
            </div>
            <div className="flex items-center gap-4">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <span>Date of Birth: {new Date(patient.dob).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
             <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${patient.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                <span>{patient.status}</span>
             </div>
             <p className="text-muted-foreground">Last Visit: {new Date(patient.lastVisit).toLocaleDateString()}</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Medical History
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {patient.medicalHistory || 'No medical history provided.'}
                </p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
