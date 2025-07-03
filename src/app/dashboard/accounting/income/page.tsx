import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from '@/lib/firebase';
import type { Patient, Payment } from '@/lib/types';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import Link from 'next/link';

type Transaction = Payment & {
    patientName: string;
    patientId: string;
    patientRegistrationNumber?: string;
};

async function getIncomeData(): Promise<Transaction[]> {
    try {
        const patientsCollection = collection(db, 'patients');
        const q = query(patientsCollection, orderBy('name'));
        const querySnapshot = await getDocs(q);
        const patients = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Patient[];

        const allTransactions: Transaction[] = [];

        patients.forEach(patient => {
            if (patient.payments && patient.payments.length > 0) {
                patient.payments.forEach(payment => {
                    allTransactions.push({
                        ...payment,
                        patientName: patient.name,
                        patientId: patient.id,
                        patientRegistrationNumber: patient.registrationNumber,
                    });
                });
            }
        });
        
        // Sort transactions by date, most recent first
        return allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    } catch (error) {
        console.error("Failed to fetch income data:", error);
        return [];
    }
}


export default async function IncomePage() {
    const transactions = await getIncomeData();
    const totalIncome = transactions.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income</CardTitle>
        <CardDescription>A complete history of all payments received from patients.</CardDescription>
        <div className="text-2xl font-bold pt-2">Total Income: <span className="text-primary">Rs. {totalIncome.toFixed(2)}</span></div>
      </CardHeader>
      <CardContent>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>Reg. #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {transactions.length > 0 ? (
                    transactions.map((tx, index) => (
                        <TableRow key={`${tx.patientId}-${tx.dateAdded}-${index}`}>
                            <TableCell className="font-medium">
                                <Link href={`/dashboard/patients/${tx.patientId}`} className="hover:underline">
                                    {tx.patientName}
                                </Link>
                            </TableCell>
                            <TableCell>{tx.patientRegistrationNumber || 'N/A'}</TableCell>
                            <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                            <TableCell>{tx.method}</TableCell>
                            <TableCell className="text-right">Rs. {tx.amount.toFixed(2)}</TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">No income records found.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
