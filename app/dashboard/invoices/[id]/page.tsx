'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type Invoice = {
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
  paymentAddress: string | null;
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const res = await fetch(`/api/invoices/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setInvoice(data);
        } else {
          setInvoice(null);
        }
      } catch {
        setInvoice(null);
      } finally {
        setLoading(false);
      }
    }
    fetchInvoice();
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-muted-foreground mb-4">Invoice not found</p>
          <Button asChild variant="outline" className="border-amber-500/20">
            <Link href="/dashboard/invoices">Back to invoices</Link>
          </Button>
        </div>
      </div>
    );
  }

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

        <Card className="border border-amber-500/20 bg-card/80 backdrop-blur-sm shadow-xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-amber-500 to-red-600" />
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" strokeWidth={1.5} />
                </div>
                <div>
                  <CardTitle className="text-xl">{invoice.invoiceNumber}</CardTitle>
                  <span
                    className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-medium ${
                      invoice.status === 'PAID'
                        ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                        : invoice.status === 'OVERDUE'
                          ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                          : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {invoice.status}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-red-600 bg-clip-text text-transparent">
                  {invoice.amount} {invoice.currency}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="mt-1">{invoice.description}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Client</p>
                <p className="mt-1 font-medium">{invoice.clientName}</p>
                <p className="text-sm text-muted-foreground">{invoice.clientEmail}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Due date</p>
                <p className="mt-1">
                  {format(new Date(invoice.dueDate), 'PPP')}
                </p>
              </div>
            </div>
            {invoice.clientWallet && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Client wallet</p>
                <p className="mt-1 font-mono text-sm break-all">{invoice.clientWallet}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
