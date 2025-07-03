import { BillingClient } from '@/components/dashboard/billing-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function BillingPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Patient Billing</CardTitle>
        <CardDescription>Search for a patient to view their treatments and generate an invoice.</CardDescription>
      </CardHeader>
      <CardContent>
        <BillingClient />
      </CardContent>
    </Card>
  );
}
