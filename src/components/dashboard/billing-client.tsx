'use client';

import * as React from 'react';
import { db } from '@/lib/firebase';
import type { Patient } from '@/lib/types';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Printer, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '../ui/separator';

export function BillingClient() {
  const [allPatients, setAllPatients] = React.useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = React.useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchPatients = async () => {
      setIsLoading(true);
      try {
        const patientsCollection = collection(db, 'patients');
        const q = query(patientsCollection, orderBy('name'));
        const querySnapshot = await getDocs(q);
        const patientsList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Patient[];
        setAllPatients(patientsList);
        setFilteredPatients(patientsList); // Initially show all
      } catch (error) {
        console.error("Error fetching patients: ", error);
        // Maybe add a toast here in a real app
      } finally {
        setIsLoading(false);
      }
    };
    fetchPatients();
  }, []);

  React.useEffect(() => {
    if (searchQuery === '') {
      setFilteredPatients(allPatients);
    } else {
      setFilteredPatients(
        allPatients.filter(patient =>
          patient.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, allPatients]);

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const totalAmount = React.useMemo(() => {
    if (!selectedPatient || !selectedPatient.assignedTreatments) {
      return 0;
    }
    return selectedPatient.assignedTreatments.reduce((total, treatment) => total + treatment.amount, 0);
  }, [selectedPatient]);

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for a patient..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {isLoading ? (
             <div className="text-center p-4">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground mt-2">Loading patients...</p>
             </div>
          ) : (
            <ScrollArea className="h-[450px] rounded-md border">
              <div className="p-2">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map(patient => (
                    <button
                      key={patient.id}
                      onClick={() => handleSelectPatient(patient)}
                      className={`w-full text-left p-2 rounded-md hover:bg-muted text-sm ${selectedPatient?.id === patient.id ? 'bg-muted font-semibold' : ''}`}
                    >
                      {patient.name}
                      {patient.registrationNumber && <span className="text-xs text-muted-foreground ml-2">#{patient.registrationNumber}</span>}
                    </button>
                  ))
                ) : (
                  <p className="text-center text-sm text-muted-foreground p-4">No patients found.</p>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
      <div className="md:col-span-2">
        {selectedPatient ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Invoice for {selectedPatient.name}</CardTitle>
                    <CardDescription>
                        Registration #: {selectedPatient.registrationNumber || 'N/A'}
                    </CardDescription>
                </div>
                <Button variant="outline" onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Invoice
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Treatment</TableHead>
                            <TableHead>Date Added</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {selectedPatient.assignedTreatments && selectedPatient.assignedTreatments.length > 0 ? (
                            selectedPatient.assignedTreatments.map(treatment => (
                                <TableRow key={treatment.dateAdded}>
                                    <TableCell className="font-medium">{treatment.name}</TableCell>
                                    <TableCell>{new Date(treatment.dateAdded).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">${treatment.amount.toFixed(2)}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24">No treatments assigned.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <Separator className="my-4" />
                <div className="flex justify-end items-center text-lg font-bold">
                    <span className="text-muted-foreground mr-4">Total:</span>
                    <span>${totalAmount.toFixed(2)}</span>
                </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 p-8 text-center">
            <p className="text-muted-foreground">Select a patient to view their bill.</p>
          </div>
        )}
      </div>
    </div>
  );
}
