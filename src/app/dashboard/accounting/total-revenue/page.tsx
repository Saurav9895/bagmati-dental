'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Expense } from '@/lib/types';
import { getExpenses } from '@/app/actions/expenses';
import { getIncome, type Transaction } from '@/app/actions/income';
import { startOfWeek, endOfWeek, subWeeks, startOfToday, parseISO, isWithinInterval, format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Separator } from '@/components/ui/separator';

const processRevenueDataForChart = (
    income: Transaction[],
    expenses: Expense[]
) => {
    if (!income.length && !expenses.length) return [];
    
    const combinedData: Record<string, { income: number; expenses: number }> = {};

    income.forEach(tx => {
        const date = format(parseISO(tx.date), 'yyyy-MM-dd');
        if (!combinedData[date]) {
            combinedData[date] = { income: 0, expenses: 0 };
        }
        combinedData[date].income += tx.amount;
    });

    expenses.forEach(ex => {
        const date = format(parseISO(ex.date), 'yyyy-MM-dd');
        if (!combinedData[date]) {
            combinedData[date] = { income: 0, expenses: 0 };
        }
        combinedData[date].expenses += ex.amount;
    });

    return Object.entries(combinedData)
        .map(([date, values]) => ({ date, ...values }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const chartConfig = {
    income: {
      label: "Income",
      color: "hsl(142.1 76.2% 36.1%)",
    },
    expenses: {
      label: "Expenses",
      color: "hsl(var(--destructive))",
    },
} satisfies ChartConfig;

export default function TotalRevenuePage() {
    const [allIncome, setAllIncome] = React.useState<Transaction[]>([]);
    const [allExpenses, setAllExpenses] = React.useState<Expense[]>([]);
    const [filteredIncome, setFilteredIncome] = React.useState<Transaction[]>([]);
    const [filteredExpenses, setFilteredExpenses] = React.useState<Expense[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [filterType, setFilterType] = React.useState('all');
    const [customStartDate, setCustomStartDate] = React.useState('');
    const [customEndDate, setCustomEndDate] = React.useState('');

    React.useEffect(() => {
        async function getData() {
            setIsLoading(true);
            try {
                const [incomeData, expensesData] = await Promise.all([
                    getIncome(),
                    getExpenses()
                ]);
                setAllIncome(incomeData);
                setFilteredIncome(incomeData);
                setAllExpenses(expensesData);
                setFilteredExpenses(expensesData);
            } catch (error) {
                console.error("Failed to fetch revenue data:", error);
            } finally {
                setIsLoading(false);
            }
        }
        getData();
    }, []);

    const applyFilter = React.useCallback((type: string, startDateStr: string, endDateStr: string) => {
        let newFilteredIncome = allIncome;
        let newFilteredExpenses = allExpenses;
        const today = startOfToday();
        
        let interval: Interval | undefined;

        if (type === 'thisWeek') {
            interval = { start: startOfWeek(today, { weekStartsOn: 1 }), end: endOfWeek(today, { weekStartsOn: 1 }) };
        } else if (type === 'lastWeek') {
            interval = { start: startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }), end: endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }) };
        } else if (type === 'custom' && startDateStr && endDateStr) {
             try {
                const start = parseISO(startDateStr);
                const end = parseISO(endDateStr);
                if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                    interval = { start, end };
                }
            } catch (error) {
                console.error("Invalid date for filtering", error);
            }
        }
        
        if (interval) {
            newFilteredIncome = allIncome.filter(tx => isWithinInterval(parseISO(tx.date), interval!));
            newFilteredExpenses = allExpenses.filter(ex => isWithinInterval(parseISO(ex.date), interval!));
        }

        setFilteredIncome(newFilteredIncome);
        setFilteredExpenses(newFilteredExpenses);
    }, [allIncome, allExpenses]);
    
    React.useEffect(() => {
        if (filterType !== 'custom' || (customStartDate && customEndDate)) {
            applyFilter(filterType, customStartDate, customEndDate);
        }
    }, [filterType, allIncome, allExpenses, applyFilter, customStartDate, customEndDate]);

    const handleFilterChange = (type: string) => {
        setFilterType(type);
    }

    const handleApplyCustomDateFilter = () => {
        applyFilter('custom', customStartDate, customEndDate);
    }
    
    const totalIncome = React.useMemo(() => {
        return filteredIncome.reduce((acc, curr) => acc + curr.amount, 0);
    }, [filteredIncome]);

    const totalExpenses = React.useMemo(() => {
        return filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    }, [filteredExpenses]);

    const totalRevenue = totalIncome - totalExpenses;

    const chartData = React.useMemo(() => processRevenueDataForChart(filteredIncome, filteredExpenses), [filteredIncome, filteredExpenses]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Revenue Overview</CardTitle>
                    <CardDescription>A summary of your clinic's financial performance for the selected period.</CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                     <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">Rs. {totalIncome.toFixed(2)}</div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-destructive">Rs. {totalExpenses.toFixed(2)}</div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${totalRevenue >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                                    Rs. {totalRevenue.toFixed(2)}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Separator />

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
                        <ChartContainer config={chartConfig} className="h-[300px] w-full">
                            <LineChart accessibilityLayer data={chartData}>
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
                                        labelFormatter={(label) => format(parseISO(label), 'PPP')}
                                        indicator="dot"
                                    />}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="income" stroke="var(--color-income)" strokeWidth={2} dot={{r: 4, fill: "var(--color-income)"}} activeDot={{r: 6}} />
                                <Line type="monotone" dataKey="expenses" stroke="var(--color-expenses)" strokeWidth={2} dot={{r: 4, fill: "var(--color-expenses)"}} activeDot={{r: 6}} />
                            </LineChart>
                        </ChartContainer>
                    ) : (
                         <div className="flex h-[300px] w-full items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 p-8 text-center">
                            <p className="text-muted-foreground">No financial data to display for the selected period.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
