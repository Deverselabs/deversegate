'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, ArrowLeft, FileText, AlertCircle, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const CURRENCIES = ['USDC', 'USDT', 'DAI', 'ETH', 'WETH'] as const;

const invoiceFormSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().email('Invalid email address'),
  clientWallet: z.string().optional(),
  amount: z.coerce
    .number()
    .positive('Amount must be positive')
    .refine((val) => !Number.isNaN(val), 'Amount must be a valid number'),
  currency: z.enum(CURRENCIES, {
    required_error: 'Please select a currency',
  }),
  description: z.string().min(1, 'Description is required'),
  dueDate: z.date({
    required_error: 'Due date is required',
  }),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

type InvoiceData = {
  id: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  status: string;
  description: string;
  dueDate: string;
  clientName: string;
  clientEmail: string;
  clientWallet: string | null;
};

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      clientName: '',
      clientEmail: '',
      clientWallet: '',
      amount: 0,
      currency: 'USDC',
      description: '',
      dueDate: undefined,
    },
  });

  const fetchInvoice = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${id}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg = data?.error ?? 'Couldn\'t load invoice';
        setError(errMsg);
        toast({
          variant: 'destructive',
          title: res.status === 401 ? 'Please sign in' : 'Couldn\'t load invoice',
          description: errMsg,
        });
        return;
      }
      if (data.status !== 'UNPAID') {
        setError('Only unpaid invoices can be edited');
        toast({
          variant: 'destructive',
          title: 'Cannot edit',
          description: 'This invoice has already been paid or is no longer editable.',
        });
        return;
      }
      form.reset({
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientWallet: data.clientWallet ?? '',
        amount: parseFloat(data.amount) || 0,
        currency: (data.currency as InvoiceFormValues['currency']) ?? 'USDC',
        description: data.description,
        dueDate: new Date(data.dueDate),
      });
    } catch {
      setError('Check your connection and try again.');
      toast({
        variant: 'destructive',
        title: 'Connection error',
        description: 'We couldn\'t reach our servers. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [id, form]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  async function onSubmit(data: InvoiceFormValues) {
    if (!id) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          clientWallet: data.clientWallet || undefined,
          amount: data.amount,
          currency: data.currency,
          description: data.description,
          dueDate: data.dueDate.toISOString(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg =
          result.details?.fieldErrors
            ? Object.entries(result.details.fieldErrors)
                .map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`)
                .join('. ') || result.error
            : result.error || 'Failed to update invoice';
        throw new Error(errorMsg);
      }

      toast({
        title: 'Invoice updated',
        description: (
          <span>
            Invoice {result.invoiceNumber} has been updated.{' '}
            <Link
              href={`/dashboard/invoices/${result.id}`}
              className="font-medium text-amber-600 hover:text-amber-500 underline underline-offset-4"
            >
              View invoice
            </Link>
          </span>
        ),
      });

      router.push('/dashboard/invoices');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Couldn\'t update invoice';
      const isNetwork = err instanceof TypeError && err.message.includes('fetch');
      toast({
        variant: 'destructive',
        title: isNetwork ? 'Connection error' : 'Couldn\'t update invoice',
        description: isNetwork ? 'Check your internet connection and try again.' : message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-5 w-48 mb-8" />
          <Card className="border border-amber-500/20 bg-card/80 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-500 to-red-600" />
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-7 w-40" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-[100px] w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="flex gap-4 pt-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-24" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/dashboard/invoices"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to invoices
          </Link>
          <Card className="border border-amber-500/20 bg-card/80 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-500 to-red-600" />
            <CardContent className="p-12 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
                <AlertCircle className="w-7 h-7 text-amber-500" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-semibold mb-2">Couldn&apos;t load invoice</h2>
              <p className="text-muted-foreground mb-6 max-w-sm">{error}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={fetchInvoice}
                  className="bg-gradient-to-r from-amber-500 to-red-600 text-white hover:opacity-90"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try again
                </Button>
                <Button variant="outline" asChild className="border-amber-500/20 hover:bg-amber-500/5">
                  <Link href="/dashboard/invoices" className="inline-flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Invoices
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-5 md:px-6 py-8 sm:py-10 lg:py-12">
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/dashboard/invoices/${id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 sm:mb-8 transition-colors min-h-[44px] items-center -ml-2 pl-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to invoice
        </Link>

        <Card className="border border-amber-500/20 bg-card/80 backdrop-blur-sm shadow-xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-amber-500 to-red-600" />
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" strokeWidth={1.5} />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Edit invoice</CardTitle>
                <CardDescription>
                  Update the details of your crypto invoice
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John Doe"
                            {...field}
                            className="h-12 sm:h-10 min-h-[48px] sm:min-h-0 text-base sm:text-sm border-amber-500/20 focus-visible:ring-amber-500/50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="john@example.com"
                            {...field}
                            className="h-12 sm:h-10 min-h-[48px] sm:min-h-0 text-base sm:text-sm border-amber-500/20 focus-visible:ring-amber-500/50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="clientWallet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Client Wallet Address{' '}
                        <span className="text-muted-foreground font-normal">
                          (optional)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0x..."
                          {...field}
                          className="h-12 sm:h-10 min-h-[48px] sm:min-h-0 text-base sm:text-sm border-amber-500/20 focus-visible:ring-amber-500/50 font-mono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step={0.01}
                            min={0}
                            placeholder="0.00"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ''
                                  ? 0
                                  : parseFloat(e.target.value)
                              )
                            }
                            className="h-12 sm:h-10 min-h-[48px] sm:min-h-0 text-base sm:text-sm border-amber-500/20 focus-visible:ring-amber-500/50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12 sm:h-10 min-h-[48px] sm:min-h-0 text-base sm:text-sm border-amber-500/20 focus:ring-amber-500/50">
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CURRENCIES.map((curr) => (
                              <SelectItem key={curr} value={curr}>
                                {curr}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the goods or services..."
                          className="min-h-[120px] sm:min-h-[100px] text-base sm:text-sm py-3 px-3 border-amber-500/20 focus-visible:ring-amber-500/50 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                            className={cn(
                              'w-full h-12 sm:h-10 min-h-[48px] sm:min-h-0 pl-4 text-left font-normal text-base sm:text-sm border-amber-500/20 hover:bg-amber-500/5 hover:border-amber-500/30',
                              !field.value && 'text-muted-foreground'
                            )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start" sideOffset={8}>
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="sticky bottom-0 left-0 right-0 sm:static -mx-6 -mb-6 sm:mx-0 sm:mb-0 mt-8 sm:mt-0 px-6 py-4 sm:py-0 sm:px-0 bg-background/95 sm:bg-transparent backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:backdrop-blur-none border-t sm:border-t-0 border-border/50">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto min-h-[48px] sm:min-h-[44px] flex-1 sm:flex-none bg-gradient-to-r from-amber-500 to-red-600 text-white hover:opacity-90 px-8"
                    >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Edit invoice'
                    )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push(`/dashboard/invoices/${id}`)}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto min-h-[48px] sm:min-h-[44px] border-amber-500/20 hover:bg-amber-500/5"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
