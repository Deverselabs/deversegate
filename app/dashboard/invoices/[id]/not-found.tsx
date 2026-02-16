import Link from 'next/link';
import { FileQuestion, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';

export default function InvoiceNotFound() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-xl mx-auto">
        <Card className="border border-amber-500/20 bg-card/80 backdrop-blur-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-amber-500 to-red-600" />
          <CardContent className="p-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
              <FileQuestion className="w-8 h-8 text-amber-500" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-bold mb-2">Invoice not found</h1>
            <p className="text-muted-foreground mb-8 max-w-sm">
              We couldn&apos;t find the invoice you&apos;re looking for. It may have been deleted, or the link might be incorrect.
            </p>
            <Button
              asChild
              className="bg-gradient-to-r from-amber-500 to-red-600 text-white hover:opacity-90"
            >
              <Link
                href="/dashboard/invoices"
                className="inline-flex items-center gap-2"
              >
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
