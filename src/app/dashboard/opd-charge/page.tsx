
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getOpdCharge, setOpdCharge } from '@/app/actions/settings';
import { Loader2 } from 'lucide-react';

const opdChargeSchema = z.object({
  amount: z.coerce.number().min(0, "Amount must be a positive number."),
});

type OpdChargeFormValues = z.infer<typeof opdChargeSchema>;

export default function OpdChargePage() {
  const { toast } = useToast();
  const form = useForm<OpdChargeFormValues>({
    resolver: zodResolver(opdChargeSchema),
    defaultValues: { amount: 0 },
  });

  React.useEffect(() => {
    const fetchCharge = async () => {
      const charge = await getOpdCharge();
      if (charge) {
        form.setValue('amount', charge.amount);
      }
    };
    fetchCharge();
  }, [form]);

  const onSubmit = async (data: OpdChargeFormValues) => {
    const result = await setOpdCharge(data.amount);
    if (result.success) {
      toast({ title: 'OPD Charge Saved!', description: 'The new charge has been set successfully.' });
    } else {
      toast({
        variant: 'destructive',
        title: 'Failed to save charge',
        description: result.error,
      });
    }
  };

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>OPD Charge Setting</CardTitle>
        <CardDescription>
          Set the standard Outpatient Department (OPD) charge. This fee can be applied to any patient as a one-time consultation charge.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Charge Amount (Rs.)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Enter amount" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Charge
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
