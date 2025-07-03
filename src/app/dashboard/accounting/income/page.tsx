
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
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Separator } from '@/components/ui/separator';
import { getIncome, type Transaction } from '@/app/actions/income';


const processIncomeDataForChart = (transactions: Transaction[]) => {
    if (!transactions.length) return [];
    
    const dailyTotals = transactions.reduce((acc, tx) => {
        const date = format(parseISO(tx.date), 'yyyy-MM-dd');
        if (!acc[date]) {
            acc[date] = 0;
        }
        acc[date] += tx.amount;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(dailyTotals)
        .map(([date, total]) => ({ date, total }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const chartConfig = {
    total: {
      label: "Income",
      color: "hsl(var(--primary))",
    },
} satisfies ChartConfig;


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
                const transactions = await getIncome();
                setAllTransactions(transactions);
                setFilteredTransactions(transactions);
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
        if (filterType !== 'custom' || (customStartDate && customEndDate)) {
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
    
    const chartData = React.useMemo(() => processIncomeDataForChart(filteredTransactions), [filteredTransactions]);


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Income Overview</CardTitle>
                    <CardDescription>A summary of payments received from patients.</CardDescription>
                    <div className="text-2xl font-bold pt-2">Total Income: <span className="text-primary">Rs. {totalIncome.toFixed(2)}</span></div>
                </CardHeader>
                <CardContent className='space-y-6'>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
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
                     <Separator />
                     {chartData.length > 0 ? (
                        <ChartContainer config={chartConfig} className="h-[250px] w-full">
                            <AreaChart accessibilityLayer data={chartData}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.1}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    tickFormatter={(value) => format(parseISO(value), 'MMM d')}
                                />
                                <YAxis
                                    tickFormatter={(value) => `Rs. ${Number(value) > 999 ? `${Number(value) / 1000}k` : value}`}
                                />
                                <ChartTooltip
                                    cursor={true}
                                    content={<ChartTooltipContent
                                        formatter={(value) => `Rs. ${value.toLocaleString()}`}
                                        labelFormatter={(label, payload) => {
                                            if (payload && payload.length) {
                                                return format(parseISO(payload[0].payload.date), "PPP");
                                            }
                                            return label;
                                        }}
                                        indicator="dot"
                                    />}
                                />
                                <Area type="monotone" dataKey="total" stroke="var(--color-total)" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2} />
                            </AreaChart>
                        </ChartContainer>
                    ) : (
                         <div className="flex h-[250px] w-full items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 p-8 text-center">
                            <p className="text-muted-foreground">No income data to display chart for the selected period.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>Detailed list of transactions for the selected period.</CardDescription>
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
        </div>
    );
}
