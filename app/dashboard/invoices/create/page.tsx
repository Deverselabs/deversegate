'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, ArrowLeft, FileText } from 'lucide-react';

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
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const CURRENCIES = ['USDC', 'USDT', 'DAI', 'ETH', 'WETH'] as const;

const invoiceFormSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().email('Invalid email address'),
  clientWallet: z.string().optional(),
  paymentAddress: z.string().optional(),
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

export default function CreateInvoicePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { address, isConnected } = useAccount();

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
      paymentAddress: address || '',
    },
  });

  useEffect(() => {
    if (address && isConnected) {
      form.setValue('paymentAddress', address);
    }
  }, [address, isConnected, form]);

  async function onSubmit(data: InvoiceFormValues) {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          clientWallet: data.clientWallet || undefined,
          amount: data.amount,
          currency: data.currency,
          description: data.description,
          dueDate: data.dueDate.toISOString(),
          paymentAddress: address,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        let errorMsg = result.error || 'Couldn\'t create invoice';
        if (response.status === 401) {
          errorMsg = 'Please sign in to create invoices';
        } else if (response.status === 400 && result.details?.fieldErrors) {
          errorMsg = Object.entries(result.details.fieldErrors)
            .map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`)
            .join('. ');
        }
        throw new Error(errorMsg);
      }

      toast({
        title: 'Invoice created',
        description: (
          <span>
            Invoice {result.invoiceNumber} has been created.{' '}
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Couldn\'t create invoice';
      const isNetwork = error instanceof TypeError && error.message.includes('fetch');
      toast({
        variant: 'destructive',
        title: isNetwork ? 'Connection error' : 'Couldn\'t create invoice',
        description: isNetwork
          ? 'Check your internet connection and try again.'
          : message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(min-width: 1024px)').matches) {
      firstInputRef.current?.focus();
    }
  }, []);

  return (
    <div className="container mx-auto px-4 sm:px-5 md:px-6 py-8 sm:py-10 lg:py-12">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/dashboard/invoices"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 sm:mb-8 transition-colors min-h-[44px] items-center -ml-2 pl-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to invoices
        </Link>

        <Card className="border border-amber-500/20 bg-card/80 backdrop-blur-sm shadow-xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-amber-500 to-red-600" />
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" strokeWidth={1.5} />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">
                  Create new invoice
                </CardTitle>
                <CardDescription>
                  Fill in the details below to create a crypto invoice
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
                    render={({ field: { ref, ...fieldRest } }) => (
                      <FormItem>
                        <FormLabel>Client Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John Doe"
                            {...fieldRest}
                            ref={(el) => {
                              ref(el);
                              (firstInputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
                            }}
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

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Payment Address (Where you&apos;ll receive payment)
                  </label>
                  {isConnected && address ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-green-600 font-medium">✓ Auto-filled from connected wallet</span>
                      </div>
                      <div className="mt-2 font-mono text-sm text-slate-700 break-all">
                        {address}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <span className="text-xs text-yellow-600 font-medium">⚠️ Connect your wallet to auto-fill payment address</span>
                    </div>
                  )}
                </div>

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
                        <PopoverContent className="w-auto p-0 sm:data-[state=open]:animate-in" align="start" sideOffset={8}>
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
                        Creating...
                      </>
                    ) : (
                      'Create invoice'
                    )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/dashboard/invoices')}
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