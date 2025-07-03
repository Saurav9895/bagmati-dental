
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { db } from '@/lib/firebase';
import type { Patient, Payment } from '@/lib/types';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import { startOfWeek, endOfWeek, subWeeks, startOfToday, parseISO, isWithinInterval, format } from 'date-fns';
import { Loader2 } from 'lucide-react';

type Transaction = Payment & {
    patientName: string;
    patientId: string;
    patientRegistrationNumber?: string;
};

export default function IncomePage() {
    const [allTransactions, setAllTransactions] = React.useState<Transaction[]>([]);
    const [filteredTransactions, setFilteredTransactions] = React.useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [filterType, setFilterType] = React.useState('all');
    const [customStartDate, setCustomStartDate] = React.useState('');
    const [customEndDate, setCustomEndDate] = React.useState('');

    React.useEffect(() => {
        async function getIncomeData() {
            setIsLoading(true);
            try {
                const patientsCollection = collection(db, 'patients');
                const q = query(patientsCollection, orderBy('name'));
                const querySnapshot = await getDocs(q);
                const patients = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Patient[];

                const transactions: Transaction[] = [];

                patients.forEach(patient => {
                    if (patient.payments && patient.payments.length > 0) {
                        patient.payments.forEach(payment => {
                            transactions.push({
                                ...payment,
                                patientName: patient.name,
                                patientId: patient.id,
                                patientRegistrationNumber: patient.registrationNumber,
                            });
                        });
                    }
                });
                
                const sortedTransactions = transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setAllTransactions(sortedTransactions);
                setFilteredTransactions(sortedTransactions);
            } catch (error) {
                console.error("Failed to fetch income data:", error);
            } finally {
                setIsLoading(false);
            }
        }
        getIncomeData();
    }, []);

    const applyFilter = React.useCallback((type: string, startDateStr: string, endDateStr: string) => {
        let newFilteredTransactions = allTransactions;
        const today = startOfToday();

        if (type === 'thisWeek') {
            const start = startOfWeek(today, { weekStartsOn: 1 });
            const end = endOfWeek(today, { weekStartsOn: 1 });
            newFilteredTransactions = allTransactions.filter(tx => isWithinInterval(parseISO(tx.date), { start, end }));
        } else if (type === 'lastWeek') {
            const start = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
            const end = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
            newFilteredTransactions = allTransactions.filter(tx => isWithinInterval(parseISO(tx.date), { start, end }));
        } else if (type === 'custom' && startDateStr && endDateStr) {
             try {
                const start = parseISO(startDateStr);
                const end = parseISO(endDateStr);
                if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                    newFilteredTransactions = allTransactions.filter(tx => isWithinInterval(parseISO(tx.date), { start, end }));
                }
            } catch (error) {
                console.error("Invalid date for filtering", error);
                newFilteredTransactions = [];
            }
        }

        setFilteredTransactions(newFilteredTransactions);
    }, [allTransactions]);

    React.useEffect(() => {
        if (filterType !== 'custom') {
            applyFilter(filterType, customStartDate, customEndDate);
        }
    }, [filterType, allTransactions, applyFilter, customStartDate, customEndDate]);

    const handleFilterChange = (type: string) => {
        setFilterType(type);
    }

    const handleApplyCustomDateFilter = () => {
        applyFilter('custom', customStartDate, customEndDate);
    }
    
    const totalIncome = React.useMemo(() => {
        return filteredTransactions.reduce((acc, curr) => acc + curr.amount, 0);
    }, [filteredTransactions]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Income</CardTitle>
                <CardDescription>A complete history of all payments received from patients.</CardDescription>
                <div className="text-2xl font-bold pt-2">Total Income: <span className="text-primary">Rs. {totalIncome.toFixed(2)}</span></div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                    <Select onValueChange={handleFilterChange} defaultValue="all">
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filter by date" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="thisWeek">This Week</SelectItem>
                            <SelectItem value="lastWeek">Last Week</SelectItem>
                            <SelectItem value="custom">Custom Range</SelectItem>
                        </SelectContent>
                    </Select>
                    {filterType === 'custom' && (
                        <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
                            <Input 
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="w-full sm:w-auto"
                            />
                            <span className="text-muted-foreground">to</span>
                            <Input 
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="w-full sm:w-auto"
                            />
                            <Button onClick={handleApplyCustomDateFilter} disabled={!customStartDate || !customEndDate}>Apply</Button>
                        </div>
                    )}
                </div>

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
                        {isLoading ? (
                             <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : filteredTransactions.length > 0 ? (
                            filteredTransactions.map((tx, index) => (
                                <TableRow key={`${tx.patientId}-${tx.dateAdded}-${index}`}>
                                    <TableCell className="font-medium">
                                        <Link href={`/dashboard/patients/${tx.patientId}`} className="hover:underline">
                                            {tx.patientName}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{tx.patientRegistrationNumber || 'N/A'}</TableCell>
                                    <TableCell>{format(parseISO(tx.date), 'PPP')}</TableCell>
                                    <TableCell>{tx.method}</TableCell>
                                    <TableCell className="text-right">Rs. {tx.amount.toFixed(2)}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">No income records found for the selected period.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
