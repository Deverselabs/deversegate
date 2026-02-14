'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import QRCode from 'qrcode';
import {
  ArrowLeft,
  Receipt,
  Copy,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

const STATUS_BADGE_STYLES: Record<string, string> = {
  UNPAID: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
  PENDING: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
  PAID: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
  OVERDUE: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30',
  CANCELLED: 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30',
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  status: string;
  description: string;
  dueDate: string;
  paymentAddress: string | null;
  paymentTxHash: string | null;
  paidAt: string | null;
  clientName: string;
  clientEmail: string;
  createdAt: string;
  updatedAt: string;
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="py-3 border-b border-border/50 last:border-0">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={mono ? 'font-mono text-sm break-all' : 'text-sm'}>
        {value}
      </p>
    </div>
  );
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function fetchInvoice() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/invoices/${id}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? 'Failed to load invoice');
          setInvoice(null);
          return;
        }
        setInvoice(data);
      } catch {
        setError('Failed to load invoice');
        setInvoice(null);
      } finally {
        setLoading(false);
      }
    }
    fetchInvoice();
  }, [id]);

  useEffect(() => {
    if (!invoice?.paymentAddress) return;
    QRCode.toDataURL(invoice.paymentAddress, { width: 256, margin: 2 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [invoice?.paymentAddress]);

  async function copyAddress() {
    if (!invoice?.paymentAddress) return;
    try {
      await navigator.clipboard.writeText(invoice.paymentAddress);
      setCopied(true);
      toast({
        title: 'Address copied',
        description: 'Payment address copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        variant: 'destructive',
        title: 'Copy failed',
        description: 'Could not copy to clipboard',
      });
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <Skeleton className="h-5 w-48 mb-8" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border border-amber-500/20 bg-card/80 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-amber-500 to-red-600" />
              <CardHeader>
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-6 w-24 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </CardContent>
            </Card>
            <Card className="border border-amber-500/20 bg-card/80 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-amber-500 to-red-600" />
              <CardContent className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                <Skeleton className="h-64 w-64 rounded-lg" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/dashboard/invoices"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Invoices
          </Link>
          <Card className="border border-red-500/20 bg-card/80 overflow-hidden">
            <CardContent className="p-12 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <AlertCircle className="w-7 h-7 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Invoice not found</h2>
              <p className="text-muted-foreground mb-6">
                {error ?? 'This invoice may have been deleted or you do not have access to it.'}
              </p>
              <Button asChild className="bg-gradient-to-r from-amber-500 to-red-600 text-white hover:opacity-90">
                <Link href="/dashboard/invoices" className="inline-flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Invoices
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/dashboard/invoices"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Invoices
        </Link>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Invoice details */}
          <Card className="border border-amber-500/20 bg-card/80 backdrop-blur-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-500 to-red-600" />
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-white" strokeWidth={1.5} />
                    </div>
                    <StatusBadge status={invoice.status} />
                  </div>
                  <CardTitle className="text-3xl font-bold tracking-tight">
                    {invoice.invoiceNumber}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Invoice created {formatDate(invoice.createdAt)}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-0">
              <div className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-red-600 bg-clip-text text-transparent mb-6">
                {invoice.amount} {invoice.currency}
              </div>

              <DetailRow label="Client" value={invoice.clientName} />
              <DetailRow label="Email" value={invoice.clientEmail} />
              <DetailRow label="Description" value={invoice.description} />
              <DetailRow label="Due date" value={formatDate(invoice.dueDate)} />

              {invoice.status === 'PAID' && (
                <>
                  {invoice.paidAt && (
                    <DetailRow
                      label="Paid date"
                      value={formatDateTime(invoice.paidAt)}
                    />
                  )}
                  {invoice.paymentTxHash && (
                    <DetailRow
                      label="Transaction hash"
                      value={
                        <a
                          href={`https://etherscan.io/tx/${invoice.paymentTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-600 dark:text-amber-400 hover:underline break-all font-mono text-sm"
                        >
                          {invoice.paymentTxHash}
                        </a>
                      }
                      mono
                    />
                  )}
                </>
              )}

              {invoice.paymentAddress && invoice.status !== 'PAID' && (
                <DetailRow
                  label="Payment address"
                  value={
                    <span className="font-mono text-xs break-all">
                      {invoice.paymentAddress}
                    </span>
                  }
                  mono
                />
              )}
            </CardContent>
          </Card>

          {/* Right: QR code & payment */}
          <Card className="border border-amber-500/20 bg-card/80 backdrop-blur-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-500 to-red-600" />
            <CardContent className="p-8 flex flex-col items-center min-h-[400px]">
              {invoice.paymentAddress ? (
                invoice.status === 'PAID' ? (
                  <div className="flex flex-col items-center text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                      <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Payment received</h3>
                    <p className="text-muted-foreground text-sm">
                      This invoice has been paid.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                      Scan to Pay
                    </p>
                    <div className="w-64 h-64 rounded-xl border-2 border-amber-500/30 bg-white p-3 flex items-center justify-center mb-6">
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt="Payment QR Code"
                          width={256}
                          height={256}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full">
                          <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-mono text-muted-foreground break-all text-center mb-4 max-w-full px-2">
                      {invoice.paymentAddress}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyAddress}
                      disabled={copied}
                      className="border-amber-500/20 hover:bg-amber-500/5"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2 text-green-500" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Address
                        </>
                      )}
                    </Button>
                  </>
                )
              ) : (
                <div className="flex flex-col items-center text-center py-12">
                  <p className="text-muted-foreground">
                    No payment address configured for this invoice.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
