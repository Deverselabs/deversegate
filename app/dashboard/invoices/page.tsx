'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { FileText, Plus, Eye, ChevronRight, Pencil, Mail, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Invoice = {
  id: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  status: string;
  clientName: string;
  clientEmail?: string;
  dueDate: string;
};

type StatusFilter = 'all' | 'UNPAID' | 'PAID' | 'OVERDUE';

const STATUS_BADGE_STYLES: Record<string, string> = {
  UNPAID: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
  PENDING: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
  PAID: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
  OVERDUE: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30',
  CANCELLED: 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30',
};

function StatusBadge({ status, className }: { status: string; className?: string }) {
  const style =
    STATUS_BADGE_STYLES[status] ??
    'bg-muted text-muted-foreground border-border';
  return (
    <Badge variant="outline" className={cn(style, className)}>
      {status}
    </Badge>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border border-amber-500/20 bg-card/80 overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
      <div className="divide-y divide-border">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-9 w-16 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="space-y-4 md:hidden">
      {[...Array(3)].map((_, i) => (
        <Card
          key={i}
          className="border border-amber-500/20 bg-card/80 overflow-hidden"
        >
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-40" />
            <div className="flex justify-between pt-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-9 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

type ErrorType = 'network' | 'auth' | 'server' | null;

function getErrorInfo(status: number): { type: ErrorType; message: string } {
  if (status === 401) return { type: 'auth', message: 'Please sign in to view invoices' };
  if (status === 403) return { type: 'auth', message: 'You don\'t have permission to view invoices' };
  if (status >= 500) return { type: 'server', message: 'Our servers are having a moment. Please try again.' };
  return { type: 'server', message: 'Something went wrong. Please try again.' };
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ type: ErrorType; message: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sendingId, setSendingId] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url =
        statusFilter === 'all'
          ? '/api/invoices'
          : `/api/invoices?status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setInvoices(data.invoices ?? []);
      } else {
        const errorInfo = getErrorInfo(res.status);
        setError(errorInfo);
        setInvoices([]);
        toast({
          variant: 'destructive',
          title: 'Couldn\'t load invoices',
          description: data.error ?? errorInfo.message,
        });
      }
    } catch {
      setError({ type: 'network', message: 'Check your connection and try again.' });
      setInvoices([]);
      toast({
        variant: 'destructive',
        title: 'Connection error',
        description: 'We couldn\'t reach our servers. Check your internet and try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  async function handleSendEmail(invoice: Invoice) {
    setSendingId(invoice.id);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/send-email`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          variant: 'destructive',
          title: 'Send failed',
          description: data.error ?? 'Could not send email. Please try again.',
        });
        return;
      }
      toast({
        title: 'Email sent',
        description: `Email sent to ${invoice.clientEmail ?? invoice.clientName}. Copy sent to ${data.yourEmail ?? 'you'}.`,
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Send failed',
        description: 'Could not send email. Please try again.',
      });
    } finally {
      setSendingId(null);
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-5 md:px-6 py-8 sm:py-10 lg:py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-500 to-red-600 bg-clip-text text-transparent">
              Invoices
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Manage and view all your crypto invoices
            </p>
          </div>
          <Button
            asChild
            className="bg-gradient-to-r from-amber-500 to-red-600 text-white hover:opacity-90 shrink-0 min-h-[44px] px-5"
          >
            <Link
              href="/dashboard/invoices/create"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              Create Invoice
            </Link>
          </Button>
        </div>

        <Tabs
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          className="mb-6"
        >
          <TabsList className="bg-muted/50 border border-amber-500/20">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="UNPAID">Unpaid</TabsTrigger>
            <TabsTrigger value="PAID">Paid</TabsTrigger>
            <TabsTrigger value="OVERDUE">Overdue</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <>
            <div className="hidden md:block">
              <TableSkeleton />
            </div>
            <CardSkeleton />
          </>
        ) : error ? (
          <Card className="border border-amber-500/20 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-12 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
                <AlertCircle className="w-7 h-7 text-amber-500" strokeWidth={1.5} />
              </div>
              <CardTitle className="mb-2">Couldn&apos;t load invoices</CardTitle>
              <CardDescription className="mb-6 max-w-sm">
                {error.message}
              </CardDescription>
              <Button
                onClick={fetchInvoices}
                className="bg-gradient-to-r from-amber-500 to-red-600 text-white hover:opacity-90"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : invoices.length === 0 ? (
          <Card className="border border-amber-500/20 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center mb-4">
                <FileText className="w-7 h-7 text-white" strokeWidth={1.5} />
              </div>
              <CardTitle>No invoices yet</CardTitle>
              <CardDescription>
                {statusFilter === 'all'
                  ? 'Create your first crypto invoice to get started'
                  : `No ${statusFilter.toLowerCase()} invoices found`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                asChild
                className="bg-gradient-to-r from-amber-500 to-red-600 text-white hover:opacity-90"
              >
                <Link
                  href="/dashboard/invoices/create"
                  className="inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Invoice
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block rounded-xl border border-amber-500/20 bg-card/80 backdrop-blur-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-amber-500/20 hover:bg-transparent">
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow
                      key={invoice.id}
                      className="border-amber-500/10 hover:bg-amber-500/5"
                    >
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>{invoice.clientName}</TableCell>
                      <TableCell>
                        {invoice.amount} {invoice.currency}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={invoice.status} />
                      </TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendEmail(invoice)}
                            disabled={sendingId === invoice.id}
                            className="min-h-[44px] min-w-[44px] border-amber-500/20 hover:bg-amber-500/5 text-amber-600 dark:text-amber-400"
                          >
                            {sendingId === invoice.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Mail className="w-4 h-4" />
                            )}
                            <span className="sr-only">Send</span>
                          </Button>
                          <Button variant="ghost" size="sm" asChild className="min-h-[44px] min-w-[44px]">
                            <Link
                              href={`/dashboard/invoices/${invoice.id}`}
                              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Link>
                          </Button>
                          {invoice.status === 'UNPAID' && (
                            <Button variant="ghost" size="sm" asChild className="min-h-[44px] min-w-[44px]">
                              <Link
                                href={`/dashboard/invoices/${invoice.id}/edit`}
                                className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3"
                              >
                                <Pencil className="w-4 h-4" />
                                Edit
                              </Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              <p className="text-xs text-muted-foreground mb-1 px-1">
                Tap View or Edit to open • Scroll for more
              </p>
              {invoices.map((invoice) => (
                <Card
                  key={invoice.id}
                  className="border border-amber-500/20 bg-card/80 backdrop-blur-sm overflow-hidden active:bg-amber-500/5 transition-colors"
                >
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start gap-3 mb-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-base truncate">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground truncate mt-0.5">
                          {invoice.clientName}
                        </p>
                      </div>
                      <StatusBadge status={invoice.status} className="shrink-0 text-xs" />
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-border gap-3">
                      <div>
                        <p className="text-base font-medium">
                          {invoice.amount} {invoice.currency}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Due {formatDate(invoice.dueDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendEmail(invoice)}
                          disabled={sendingId === invoice.id}
                          className="min-h-[44px] min-w-[44px] px-4 border-amber-500/20 hover:bg-amber-500/5 text-amber-600 dark:text-amber-400"
                        >
                          {sendingId === invoice.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Mail className="w-4 h-4" />
                          )}
                          <span className="sr-only sm:not-sr-only sm:inline">Send</span>
                        </Button>
                        {invoice.status === 'UNPAID' && (
                          <Button variant="outline" size="sm" asChild className="min-h-[44px] min-w-[44px] px-4 border-amber-500/20 hover:bg-amber-500/5">
                            <Link
                              href={`/dashboard/invoices/${invoice.id}/edit`}
                              className="inline-flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400"
                            >
                              <Pencil className="w-4 h-4" />
                              <span className="sr-only sm:not-sr-only sm:inline">Edit</span>
                            </Link>
                          </Button>
                        )}
                        <Button variant="default" size="sm" asChild className="min-h-[44px] px-4 bg-gradient-to-r from-amber-500 to-red-600 text-white hover:opacity-90">
                          <Link
                            href={`/dashboard/invoices/${invoice.id}`}
                            className="inline-flex items-center justify-center gap-2"
                          >
                            View
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
