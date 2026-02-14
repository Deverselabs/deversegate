'use client';

import { SignUp } from '@clerk/nextjs';
import { Zap } from 'lucide-react';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center p-4">
      <div className="fixed top-10 right-10 w-[600px] h-[600px] bg-gradient-to-br from-amber-500/20 to-red-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-10 left-10 w-[500px] h-[500px] bg-gradient-to-tr from-red-500/15 to-orange-500/15 rounded-full blur-3xl pointer-events-none" />

      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors z-10"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-red-600 rounded-xl flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" strokeWidth={1.5} />
        </div>
        <span className="text-lg font-bold bg-gradient-to-r from-amber-500 to-red-600 bg-clip-text text-transparent">
          DeverseGate
        </span>
      </Link>

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-red-600 bg-clip-text text-transparent mb-2">
            Create your account
          </h1>
          <p className="text-muted-foreground text-sm text-center">
            Get started with DeverseGate for free
          </p>
        </div>
        <div className="flex justify-center [&_.cl-rootBox]:w-full [&_.cl-card]:shadow-xl [&_.cl-card]:rounded-2xl [&_.cl-card]:border [&_.cl-card]:border-amber-500/20 [&_.cl-cardBox]:bg-card/95 [&_.cl-headerTitle]:text-foreground [&_.cl-headerSubtitle]:text-muted-foreground [&_.cl-formButtonPrimary]:bg-gradient-to-r [&_.cl-formButtonPrimary]:from-amber-500 [&_.cl-formButtonPrimary]:to-red-600 [&_.cl-formButtonPrimary]:hover:opacity-90 [&_.cl-footerActionLink]:text-amber-600 [&_.cl-footerActionLink]:dark:text-amber-400 [&_.cl-footerActionLink]:hover:opacity-80">
          <SignUp
            appearance={{
              variables: {
                colorPrimary: 'hsl(38, 92%, 50%)',
                colorText: 'hsl(var(--foreground))',
                colorBackground: 'hsl(var(--card))',
                colorInputBackground: 'hsl(var(--background))',
                colorInputText: 'hsl(var(--foreground))',
                borderRadius: '0.75rem',
              },
              elements: {
                card: 'backdrop-blur-sm',
                headerTitle: 'text-foreground',
                headerSubtitle: 'text-muted-foreground',
                socialButtonsBlockButton: 'border-border hover:bg-muted/50',
                formFieldInput: 'bg-background border-border',
                footerActionLink: 'text-amber-600 dark:text-amber-400',
              },
            }}
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            afterSignUpUrl="/dashboard"
          />
        </div>
      </div>
    </div>
  );
}
