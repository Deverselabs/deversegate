'use client';

import { UserButton, SignOutButton } from '@clerk/nextjs';
import { Zap, LogOut, FileText, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed top-10 right-10 w-[600px] h-[600px] bg-gradient-to-br from-amber-500/20 to-red-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-10 left-10 w-[500px] h-[500px] bg-gradient-to-tr from-red-500/15 to-orange-500/15 rounded-full blur-3xl pointer-events-none" />

      <header className="relative z-50 border-b border-amber-500/20 backdrop-blur-xl bg-background/80">
        <div className="container mx-auto px-4 sm:px-5 md:px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-red-600 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-amber-500 to-red-600 bg-clip-text text-transparent">
              DeverseGate
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/dashboard/invoices"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <FileText className="w-4 h-4" />
              Invoices
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <SignOutButton>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </Button>
            </SignOutButton>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: 'w-9 h-9 ring-2 ring-amber-500/30',
                },
              }}
            />
          </div>
        </div>
      </header>

      <main className="relative z-10">{children}</main>
    </div>
  );
}
