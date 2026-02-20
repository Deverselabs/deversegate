'use client';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FileText, ChevronRight, RefreshCw, Wallet as WalletIcon } from 'lucide-react';
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.firstName || user?.username || 'there'}
          </h1>
          <p className="text-muted-foreground">
            Manage your invoices and track payments
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {/* Quick Actions Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Get started with your invoice management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Create Invoice Button */}
              <Link href="/dashboard/invoices/create">
                <Button
                  className="w-full justify-start h-auto p-4 bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white border-0"
                  size="lg"
                >
                  <FileText className="w-5 h-5 mr-3" />
                  <div className="flex-1 text-left">
                    <div className="font-semibold">Create New Invoice</div>
                    <div className="text-xs text-white/80">Generate a payment request</div>
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </Link>

              {/* View Invoices Button */}
              <Link href="/dashboard/invoices">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-4"
                  size="lg"
                >
                  <FileText className="w-5 h-5 mr-3" />
                  <div className="flex-1 text-left">
                    <div className="font-semibold">View All Invoices</div>
                    <div className="text-xs text-muted-foreground">Track and manage payments</div>
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </Link>

              {/* Check Payments Button */}
              <Button
                onClick={handleCheckPayments}
                disabled={checkingPayments}
                variant="outline"
                className="w-full justify-start h-auto p-4"
                size="lg"
              >
                <RefreshCw className={`w-5 h-5 mr-3 ${checkingPayments ? 'animate-spin' : ''}`} />
                <div className="flex-1 text-left">
                  <div className="font-semibold">
                    {checkingPayments ? 'Checking...' : 'Check for Payments'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Scan blockchain for recent payments
                  </div>
                </div>
              </Button>

            </CardContent>
          </Card>

          {/* Wallet Card */}
          <div className="lg:col-span-1">
            <WalletInfo />
          </div>

        </div>

        {/* Info Section */}
        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-red-600/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                <WalletIcon className="w-5 h-5 text-amber-600" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">Smart Contract Payments</h3>
                <p className="text-sm text-muted-foreground">
                  All payments are secured by blockchain smart contracts. Invoices are automatically verified and updated when payments are received.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
