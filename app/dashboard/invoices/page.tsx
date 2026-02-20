'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Eye,
  Download,
  Copy,
  AlertCircle,
  RefreshCw,
  Loader2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { InvoiceStatusBadge } from '@/components/invoice-status-badge';

type Invoice = {
  id: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  status: string;
  clientName: string;
  clientEmail?: string;
  description?: string;
  dueDate: string;
  createdAt?: string;
};

const MONTHS = [
  { value: '0', label: 'January' },
  { value: '1', label: 'February' },
  { value: '2', label: 'March' },
  { value: '3', label: 'April' },
  { value: '4', label: 'May' },
  { value: '5', label: 'June' },
  { value: '6', label: 'July' },
  { value: '7', label: 'August' },
  { value: '8', label: 'September' },
  { value: '9', label: 'October' },
  { value: '10', label: 'November' },
  { value: '11', label: 'December' },
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function CardGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="border border-amber-500/20 bg-card/80">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-28" />
            <div className="flex gap-2 pt-4">
              <Skeleton className="h-9 w-20" />
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
  if (status === 403) return { type: 'auth', message: "You don't have permission to view invoices" };
  if (status >= 500) return { type: 'server', message: 'Our servers are having a moment. Please try again.' };
  return { type: 'server', message: 'Something went wrong. Please try again.' };
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ type: ErrorType; message: string } | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 6;

  // Filter states
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const list = data.invoices ?? [];
        setInvoices(list);
      } else {
        const errorInfo = getErrorInfo(res.status);
        setError(errorInfo);
        setInvoices([]);
        toast({
          variant: 'destructive',
          title: "Couldn't load invoices",
          description: data.error ?? errorInfo.message,
        });
      }
    } catch {
      setError({ type: 'network', message: 'Check your connection and try again.' });
      setInvoices([]);
      toast({
        variant: 'destructive',
        title: 'Connection error',
        description: "We couldn't reach our servers. Check your internet and try again.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Get unique clients from invoices
  const uniqueClients = useMemo(() => {
    if (!invoices || invoices.length === 0) return [];
    const clients = invoices.map((inv) => inv.clientName).filter(Boolean);
    return Array.from(new Set(clients)).sort();
  }, [invoices]);

  // Get unique years from invoices
  const availableYears = useMemo(() => {
    if (!invoices || invoices.length === 0) return [];
    const years = invoices
      .map((inv) => {
        const date = new Date(inv.createdAt || inv.dueDate);
        return date.getFullYear();
      })
      .filter(Boolean);
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [invoices]);

  // Filter invoices based on all active filters
  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];

    return invoices.filter((invoice) => {
      if (selectedClient !== 'all' && invoice.clientName !== selectedClient) {
        return false;
      }
      if (selectedStatus !== 'all' && invoice.status !== selectedStatus) {
        return false;
      }
      if (selectedYear !== 'all') {
        const invoiceDate = new Date(invoice.createdAt || invoice.dueDate);
        if (invoiceDate.getFullYear() !== parseInt(selectedYear)) {
          return false;
        }
      }
      if (selectedMonth !== 'all') {
        const invoiceDate = new Date(invoice.createdAt || invoice.dueDate);
        if (invoiceDate.getMonth() !== parseInt(selectedMonth)) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const searchableText = [
          invoice.invoiceNumber,
          invoice.clientName,
          invoice.clientEmail ?? '',
          invoice.description ?? '',
        ]
          .join(' ')
          .toLowerCase();
        if (!searchableText.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [invoices, selectedClient, selectedStatus, selectedMonth, selectedYear, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredInvoices.slice(startIndex, endIndex);
  }, [filteredInvoices, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClient, selectedStatus, selectedMonth, selectedYear, searchQuery]);

  const paymentPageUrl = (invoiceNumber: string) =>
    `${typeof window !== 'undefined' ? window.location.origin : ''}/pay/${invoiceNumber}`;

  function handleCopyPaymentLink(invoiceNumber: string) {
    const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/pay/${invoiceNumber}`;
    navigator.clipboard.writeText(paymentUrl);

    toast({
      title: 'Link copied!',
      description: 'Payment link copied to clipboard',
    });
  }

  const handleDownloadPDF = async (invoice: Invoice) => {
    setDownloadingId(invoice.id);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`);
      if (!res.ok) throw new Error('Failed to fetch invoice');
      const fullInvoice = await res.json();
      const { generateInvoicePDF } = await import('@/lib/pdf-generator');
      const pdfBlob = await generateInvoicePDF({
        ...fullInvoice,
        amount: fullInvoice.amount?.toString?.() ?? fullInvoice.amount,
        dueDate: fullInvoice.dueDate,
        paymentPageUrl: fullInvoice.paymentPageUrl ?? null,
        merchantWallet: fullInvoice.merchantWallet ?? null,
      });
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: 'PDF downloaded!' });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to download PDF',
      });
    } finally {
      setDownloadingId(null);
    }
  };

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

        {/* Filters Section */}
        <div className="mb-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-5">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Client Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Client</label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="All clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All clients</SelectItem>
                  {uniqueClients.map((client) => (
                    <SelectItem key={client} value={client}>
                      {client}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="UNPAID">Unpaid</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Month Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="All months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All months</SelectItem>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedClient !== 'all' ||
            selectedStatus !== 'all' ||
            selectedMonth !== 'all' ||
            selectedYear !== 'all' ||
            searchQuery.trim()) && (
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Active filters:
              </span>
              {selectedClient !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs font-medium rounded-full">
                  Client: {selectedClient}
                  <button
                    onClick={() => setSelectedClient('all')}
                    className="hover:bg-amber-200 dark:hover:bg-amber-800 rounded-full p-0.5 transition-colors"
                    aria-label="Remove client filter"
                  >
                    ✕
                  </button>
                </span>
              )}
              {selectedStatus !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                  Status: {selectedStatus}
                  <button
                    onClick={() => setSelectedStatus('all')}
                    className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                    aria-label="Remove status filter"
                  >
                    ✕
                  </button>
                </span>
              )}
              {selectedMonth !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs font-medium rounded-full">
                  Month: {MONTHS[parseInt(selectedMonth)].label}
                  <button
                    onClick={() => setSelectedMonth('all')}
                    className="hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5 transition-colors"
                    aria-label="Remove month filter"
                  >
                    ✕
                  </button>
                </span>
              )}
              {selectedYear !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 text-xs font-medium rounded-full">
                  Year: {selectedYear}
                  <button
                    onClick={() => setSelectedYear('all')}
                    className="hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full p-0.5 transition-colors"
                    aria-label="Remove year filter"
                  >
                    ✕
                  </button>
                </span>
              )}
              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-xs font-medium rounded-full">
                  Search: &quot;{searchQuery.trim()}&quot;
                  <button
                    onClick={() => setSearchQuery('')}
                    className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5 transition-colors"
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedClient('all');
                  setSelectedStatus('all');
                  setSelectedMonth('all');
                  setSelectedYear('all');
                  setSearchQuery('');
                }}
                className="text-xs text-muted-foreground hover:text-foreground underline ml-2"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Results Count */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing{' '}
              <span className="font-medium text-foreground">
                {filteredInvoices.length === 0
                  ? 0
                  : (currentPage - 1) * ITEMS_PER_PAGE + 1}
              </span>
              {' '}-{' '}
              <span className="font-medium text-foreground">
                {Math.min(
                  currentPage * ITEMS_PER_PAGE,
                  filteredInvoices.length
                )}
              </span>
              {' '}of{' '}
              <span className="font-medium text-foreground">
                {filteredInvoices.length}
              </span>{' '}
              invoices
            </span>
            {totalPages > 1 && (
              <span className="text-xs">
                Page {currentPage} of {totalPages}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <CardGridSkeleton />
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
        ) : filteredInvoices.length === 0 && !loading ? (
          /* Empty State */
          <div className="text-center py-12 border-2 border-dashed rounded-lg border-amber-500/20">
            <div className="max-w-md mx-auto">
              {invoices.length === 0 ? (
                <>
                  <h3 className="text-lg font-semibold mb-2">No invoices yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first invoice to get started
                  </p>
                  <Button
                    asChild
                    className="bg-gradient-to-r from-amber-500 to-red-600 text-white hover:opacity-90"
                  >
                    <Link href="/dashboard/invoices/create">
                      Create Invoice
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold mb-2">
                    No matching invoices
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters to find what you&apos;re looking
                    for
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedClient('all');
                      setSelectedStatus('all');
                      setSelectedMonth('all');
                      setSelectedYear('all');
                      setSearchQuery('');
                    }}
                    className="border-amber-500/20 hover:bg-amber-500/5"
                  >
                    Clear all filters
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedInvoices.map((invoice) => (
              <Card
                key={invoice.id}
                className="border border-amber-500/20 bg-card/80 backdrop-blur-sm overflow-hidden"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold truncate">
                      {invoice.invoiceNumber}
                    </span>
                    <InvoiceStatusBadge status={invoice.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    To: {invoice.clientName}
                    {invoice.clientEmail ? (
                      <span className="block text-xs truncate">
                        {invoice.clientEmail}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-red-600 bg-clip-text text-transparent">
                    {invoice.amount} {invoice.currency}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Due: {formatDate(invoice.dueDate)}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        router.push(`/dashboard/invoices/${invoice.id}`)
                      }
                      className="border-amber-500/20 hover:bg-amber-500/5"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownloadPDF(invoice)}
                      disabled={downloadingId === invoice.id}
                    >
                      {downloadingId === invoice.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-1" />
                          PDF
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        handleCopyPaymentLink(invoice.invoiceNumber)
                      }
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy Link
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => {
                    const showPage =
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 &&
                        pageNum <= currentPage + 1);
                    const showEllipsis =
                      (pageNum === currentPage - 2 && currentPage > 3) ||
                      (pageNum === currentPage + 2 &&
                        currentPage < totalPages - 2);

                    if (showEllipsis) {
                      return (
                        <span
                          key={pageNum}
                          className="px-2 text-muted-foreground"
                        >
                          ...
                        </span>
                      );
                    }
                    if (!showPage) return null;
                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? 'default' : 'outline'
                        }
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={
                          currentPage === pageNum
                            ? 'bg-gradient-to-r from-amber-500 to-red-600 text-white'
                            : ''
                        }
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}
