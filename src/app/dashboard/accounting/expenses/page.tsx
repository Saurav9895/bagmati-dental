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

const expenseSchema = z.object({
  name: z.string().min(2, "Expense name must be at least 2 characters."),
  category: z.enum(['Equipment', 'Supplies', 'Utilities', 'Salaries', 'Rent', 'Other']),
  amount: z.coerce.number().positive("Amount must be a positive number."),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date."),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export default function ExpensesPage() {
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
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
      setExpenses(initialExpenses);
      setIsLoading(false);
    };
    fetchExpenses();
  }, []);

  const totalExpenses = React.useMemo(() => {
    return expenses.reduce((acc, expense) => acc + expense.amount, 0);
  }, [expenses]);

  const onSubmit = async (data: ExpenseFormValues) => {
    const result = await addExpense(data);
    if (result.success && result.data) {
      setExpenses(prev => [result.data!, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
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
                  Loading expenses...
                </TableCell>
              </TableRow>
            ) : expenses.length > 0 ? (
              expenses.map((expense) => (
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
                    No expenses recorded yet.
                  </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
