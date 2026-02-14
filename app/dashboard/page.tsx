'use client';

import { UserButton } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';
import { Zap, LogOut } from 'lucide-react';
import Link from 'next/link';
import { SignOutButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed top-10 right-10 w-[600px] h-[600px] bg-gradient-to-br from-amber-500/20 to-red-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-10 left-10 w-[500px] h-[500px] bg-gradient-to-tr from-red-500/15 to-orange-500/15 rounded-full blur-3xl pointer-events-none" />

      <header className="relative z-50 border-b border-amber-500/20 backdrop-blur-xl bg-background/80">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-red-600 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-amber-500 to-red-600 bg-clip-text text-transparent">
              DeverseGate
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <SignOutButton>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
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

      <main className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
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
            <div className="mt-8 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Use the profile button in the header to manage your account or sign out.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
