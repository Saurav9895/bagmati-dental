
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Expense } from '@/lib/types';
import { addExpense, getExpenses } from '@/app/actions/expenses';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { startOfWeek, endOfWeek, subWeeks, startOfToday, parseISO, isWithinInterval } from 'date-fns';
import { Separator } from '@/components/ui/separator';

const expenseSchema = z.object({
  name: z.string().min(2, "Expense name must be at least 2 characters."),
  category: z.enum(['Equipment', 'Supplies', 'Utilities', 'Salaries', 'Rent', 'Other']),
  amount: z.coerce.number().positive("Amount must be a positive number."),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date."),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

const processExpenseDataForChart = (expenses: Expense[]): { category: string; total: number }[] => {
    if (!expenses.length) return [];
    const categoryTotals = expenses.reduce((acc, expense) => {
        const { category, amount } = expense;
        if (!acc[category]) {
            acc[category] = 0;
        }
        acc[category] += amount;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals).map(([category, total]) => ({
        category,
        total,
    })).sort((a, b) => b.total - a.total);
};

const chartConfig = {
    total: {
      label: "Expenses",
      color: "hsl(var(--destructive))",
    },
} satisfies ChartConfig;


export default function ExpensesPage() {
  const [allExpenses, setAllExpenses] = React.useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = React.useState<Expense[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [filterType, setFilterType] = React.useState('all');
  const [customStartDate, setCustomStartDate] = React.useState('');
  const [customEndDate, setCustomEndDate] = React.useState('');
  const { toast } = useToast();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      name: "",
      category: "Other",
      amount: 0,
      date: new Date().toISOString().split('T')[0],
    },
  });
  
  React.useEffect(() => {
    const fetchExpenses = async () => {
      setIsLoading(true);
      const initialExpenses = await getExpenses();
      setAllExpenses(initialExpenses);
      setFilteredExpenses(initialExpenses);
      setIsLoading(false);
    };
    fetchExpenses();
  }, []);

  const applyFilter = React.useCallback((type: string, startDateStr: string, endDateStr: string) => {
    let newFilteredExpenses = allExpenses;
    const today = startOfToday();

    if (type === 'thisWeek') {
        const start = startOfWeek(today, { weekStartsOn: 1 });
        const end = endOfWeek(today, { weekStartsOn: 1 });
        newFilteredExpenses = allExpenses.filter(ex => isWithinInterval(parseISO(ex.date), { start, end }));
    } else if (type === 'lastWeek') {
        const start = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
        const end = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
        newFilteredExpenses = allExpenses.filter(ex => isWithinInterval(parseISO(ex.date), { start, end }));
    } else if (type === 'custom' && startDateStr && endDateStr) {
          try {
            const start = parseISO(startDateStr);
            const end = parseISO(endDateStr);
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                newFilteredExpenses = allExpenses.filter(ex => isWithinInterval(parseISO(ex.date), { start, end }));
            }
        } catch (error) {
            console.error("Invalid date for filtering", error);
            newFilteredExpenses = [];
        }
    }
    setFilteredExpenses(newFilteredExpenses);
  }, [allExpenses]);

  React.useEffect(() => {
    if (filterType !== 'custom' || (customStartDate && customEndDate)) {
        applyFilter(filterType, customStartDate, customEndDate);
    }
  }, [filterType, allExpenses, applyFilter, customStartDate, customEndDate]);

  const handleFilterChange = (type: string) => {
      setFilterType(type);
  }

  const handleApplyCustomDateFilter = () => {
      applyFilter('custom', customStartDate, customEndDate);
  }
  
  const totalExpenses = React.useMemo(() => {
    return filteredExpenses.reduce((acc, expense) => acc + expense.amount, 0);
  }, [filteredExpenses]);

  const chartData = React.useMemo(() => processExpenseDataForChart(filteredExpenses), [filteredExpenses]);

  const onSubmit = async (data: ExpenseFormValues) => {
    const result = await addExpense(data);
    if (result.success && result.data) {
      const newAllExpenses = [result.data, ...allExpenses].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAllExpenses(newAllExpenses);
      toast({ title: 'Expense added successfully!' });
      setIsFormOpen(false);
      form.reset({
        name: "",
        category: "Other",
        amount: 0,
        date: new Date().toISOString().split('T')[0],
      });
    } else {
      toast({ variant: 'destructive', title: 'Failed to add expense', description: result.error });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Expenses</CardTitle>
            <CardDescription>Track all your clinic's expenses.</CardDescription>
            <div className="text-2xl font-bold pt-2">Total Expenses: <span className="text-destructive">Rs. {totalExpenses.toFixed(2)}</span></div>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expense Name/Description</FormLabel>
                      <FormControl><Input placeholder="e.g., New dental chair" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Equipment">Equipment</SelectItem>
                          <SelectItem value="Supplies">Supplies</SelectItem>
                          <SelectItem value="Utilities">Utilities</SelectItem>
                          <SelectItem value="Salaries">Salaries</SelectItem>
                          <SelectItem value="Rent">Rent</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (Rs.)</FormLabel>
                      <FormControl><Input type="number" placeholder="5000" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="date" render={({ field }) => (
                      <FormItem>
                      <FormLabel>Expense Date</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                      </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Expense
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-6">
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
                    <BarChart accessibilityLayer data={chartData} layout="vertical">
                        <CartesianGrid horizontal={false} />
                        <YAxis
                            dataKey="category"
                            type="category"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            className='text-xs'
                        />
                        <XAxis dataKey="total" type="number" hide />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent
                                formatter={(value) => `Rs. ${value.toLocaleString()}`}
                                />}
                        />
                        <Bar dataKey="total" fill="var(--color-total)" radius={4} />
                    </BarChart>
                </ChartContainer>
            ) : (
                  <div className="flex h-[250px] w-full items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 p-8 text-center">
                    <p className="text-muted-foreground">No expense data to display chart for the selected period.</p>
                </div>
            )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Detailed List</CardTitle>
          <CardDescription>A list of all expenses in the selected period.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredExpenses.length > 0 ? (
                filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.name}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">Rs. {expense.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      No expenses recorded for the selected period.
                    </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
