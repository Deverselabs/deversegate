'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Plus, Eye, ChevronRight } from 'lucide-react';
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

type Invoice = {
  id: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  status: string;
  clientName: string;
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

function StatusBadge({ status }: { status: string }) {
  const style =
    STATUS_BADGE_STYLES[status] ??
    'bg-muted text-muted-foreground border-border';
  return (
    <Badge variant="outline" className={style}>
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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    async function fetchInvoices() {
      setLoading(true);
      try {
        const url =
          statusFilter === 'all'
            ? '/api/invoices'
            : `/api/invoices?status=${statusFilter}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setInvoices(data.invoices ?? []);
        } else {
          setInvoices([]);
        }
      } catch {
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    }
    fetchInvoices();
  }, [statusFilter]);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-red-600 bg-clip-text text-transparent">
              Invoices
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and view all your crypto invoices
            </p>
          </div>
          <Button
            asChild
            className="bg-gradient-to-r from-amber-500 to-red-600 text-white hover:opacity-90 shrink-0"
          >
            <Link
              href="/dashboard/invoices/create"
              className="inline-flex items-center gap-2"
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
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            href={`/dashboard/invoices/${invoice.id}`}
                            className="inline-flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {invoices.map((invoice) => (
                <Card
                  key={invoice.id}
                  className="border border-amber-500/20 bg-card/80 backdrop-blur-sm overflow-hidden"
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <div>
                        <p className="font-semibold">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {invoice.clientName}
                        </p>
                      </div>
                      <StatusBadge status={invoice.status} />
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <div>
                        <p className="text-sm font-medium">
                          {invoice.amount} {invoice.currency}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Due {formatDate(invoice.dueDate)}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          href={`/dashboard/invoices/${invoice.id}`}
                          className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400"
                        >
                          View
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </Button>
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
