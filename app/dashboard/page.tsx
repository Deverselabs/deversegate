'use client';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FileText, ChevronRight, RefreshCw } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WalletInfo } from '@/components/wallet-info';
import { toast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { user } = useUser();
  const router = useRouter();
  const [checkingPayments, setCheckingPayments] = useState(false);

  async function handleCheckPayments() {
    setCheckingPayments(true);
    try {
      const res = await fetch('/api/monitor-payments', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: 'Check failed',
          description: data.error ?? 'Failed to check for payments',
          variant: 'destructive',
        });
        return;
      }
      const { checked, detected, updated } = data;
      toast({
        title: 'Payment check complete',
        description: `Checked ${checked} invoice${checked !== 1 ? 's' : ''}, detected ${detected} payment${detected !== 1 ? 's' : ''}, updated ${updated}.`,
      });
      if (updated > 0) router.refresh();
    } catch {
      toast({
        title: 'Check failed',
        description: 'Could not reach the server.',
        variant: 'destructive',
      });
    } finally {
      setCheckingPayments(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-3 items-start">
          <div className="lg:col-span-1">
            <WalletInfo />
          </div>
          <div className="lg:col-span-2 space-y-8">
        <div className="bg-card/80 backdrop-blur-sm border border-amber-500/20 rounded-3xl p-8 md:p-12 shadow-xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Welcome back,{' '}
            <span className="bg-gradient-to-r from-amber-500 to-red-600 bg-clip-text text-transparent">
              {user?.firstName || user?.username || 'there'}
            </span>
          </h1>
          <p className="text-muted-foreground mb-6">
            You&apos;re signed in to your DeverseGate dashboard.
          </p>
          {user?.primaryEmailAddress?.emailAddress && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/50 border border-border">
              <span className="text-sm font-medium text-muted-foreground">Email</span>
              <span className="text-foreground font-medium">{user.primaryEmailAddress.emailAddress}</span>
            </div>
          )}

          <Button
            onClick={handleCheckPayments}
            disabled={checkingPayments}
            className="mt-6 w-full sm:w-auto bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white border-0 shadow-lg shadow-amber-500/20"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${checkingPayments ? 'animate-spin' : ''}`} />
            {checkingPayments ? 'Checking…' : 'Check for Payments'}
          </Button>
        </div>

        <Link href="/dashboard/invoices" className="block group">
          <Card className="border-2 border-amber-500/30 bg-card/80 backdrop-blur-sm overflow-hidden transition-all hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="w-7 h-7 text-white" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl md:text-2xl bg-gradient-to-r from-amber-500 to-red-600 bg-clip-text text-transparent">
                    Manage Invoices
                  </CardTitle>
                  <CardDescription className="mt-1.5 text-base">
                    Create your first invoice or track existing ones
                  </CardDescription>
                </div>
                <ChevronRight className="w-6 h-6 text-amber-500/70 group-hover:text-amber-500 group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <span className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 text-white text-sm font-medium hover:opacity-90 transition-opacity">
                <FileText className="w-4 h-4" />
                Create Your First Invoice
                <ChevronRight className="w-4 h-4" />
              </span>
            </CardContent>
          </Card>
        </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
