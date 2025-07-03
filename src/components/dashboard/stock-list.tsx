'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MoreHorizontal, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import type { StockItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { addStockItem, updateStockItem, deleteStockItem } from '@/app/actions/stock';
import { Badge } from '@/components/ui/badge';

const stockSchema = z.object({
  name: z.string().min(2, "Item name must be at least 2 characters."),
  category: z.string().min(2, "Category must be at least 2 characters."),
  quantity: z.coerce.number().int().min(0, "Quantity cannot be negative."),
  reorderLevel: z.coerce.number().int().min(0, "Reorder level cannot be negative."),
  supplier: z.string().optional(),
});

type StockFormValues = z.infer<typeof stockSchema>;

export function StockList({ initialStockItems }: { initialStockItems: StockItem[] }) {
  const [stockItems, setStockItems] = React.useState<StockItem[]>(initialStockItems);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<StockItem | null>(null);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [deletingItemId, setDeletingItemId] = React.useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<StockFormValues>({
    resolver: zodResolver(stockSchema),
    defaultValues: { name: "", category: "", quantity: 0, reorderLevel: 10, supplier: "" },
  });

  React.useEffect(() => {
    if (isFormOpen && editingItem) {
      form.reset(editingItem);
    } else if (!isFormOpen) {
      form.reset({ name: "", category: "", quantity: 0, reorderLevel: 10, supplier: "" });
    }
  }, [isFormOpen, editingItem, form]);

  const handleDialogOpenChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingItem(null);
    }
  }

  const handleEditClick = (item: StockItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (itemId: string) => {
    setDeletingItemId(itemId);
    setIsAlertOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!deletingItemId) return;
    const result = await deleteStockItem(deletingItemId);

    if (result.success) {
        setStockItems(stockItems.filter(i => i.id !== deletingItemId));
        toast({ title: "Stock Item Deleted" });
    } else {
        toast({ variant: "destructive", title: "Failed to delete item", description: result.error });
    }
    
    setIsAlertOpen(false);
    setDeletingItemId(null);
  }

  const onSubmit = async (data: StockFormValues) => {
    const itemPayload = { ...data, supplier: data.supplier || undefined };

    if (editingItem) {
      const result = await updateStockItem(editingItem.id, itemPayload);
      if (result.success) {
        setStockItems(stockItems.map(i => i.id === editingItem.id ? { ...i, ...itemPayload } : i));
        toast({ title: "Item Updated" });
      } else {
        toast({ variant: "destructive", title: "Failed to update item", description: result.error });
        return;
      }
    } else {
      const result = await addStockItem(itemPayload);
      if (result.success && result.data) {
        setStockItems([result.data, ...stockItems]);
        toast({ title: "Item Added" });
      } else {
        toast({ variant: "destructive", title: "Failed to add item", description: result.error });
        return;
      }
    }
    
    form.reset();
    handleDialogOpenChange(false);
  };
  
  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Stock Management</CardTitle>
          <CardDescription>Keep track of your clinic's inventory.</CardDescription>
        </div>
        <Dialog open={isFormOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setEditingItem(null)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Stock Item' : 'Add New Stock Item'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Dental Gloves" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                 <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl><Input placeholder="e.g., Consumables" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                 <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="quantity" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl><Input type="number" placeholder="100" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="reorderLevel" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Reorder Level</FormLabel>
                        <FormControl><Input type="number" placeholder="20" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="supplier" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g., Medical Supplies Co." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Saving...' : 'Save Item'}
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
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : stockItems.length > 0 ? (
              stockItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.supplier || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    {item.quantity <= item.reorderLevel ? (
                        <Badge variant="destructive">{item.quantity}</Badge>
                    ) : (
                        item.quantity
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditClick(item)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteClick(item.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No stock items found. Add one to get started.
                  </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this item from your stock.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeletingItemId(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete}>
                    Continue
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
