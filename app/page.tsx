'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import dynamic from 'next/dynamic';
import {
  Zap,
  MessageSquare,
  RefreshCw,
  Check,
  Github,
  Twitter,
  Linkedin,
  ArrowRight,
  Sparkles,
  Shield,
  TrendingUp,
  BarChart3,
  Lock,
  Globe,
} from 'lucide-react';

const CryptoScene = dynamic(() => import('@/components/crypto-scene'), {
  ssr: false,
});

export default function Home() {
  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      <CryptoScene />
      <div className="fixed top-10 right-10 w-[600px] h-[600px] bg-gradient-to-br from-amber-500/20 to-red-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-10 left-10 w-[500px] h-[500px] bg-gradient-to-tr from-red-500/15 to-orange-500/15 rounded-full blur-3xl pointer-events-none" />

      <header className="fixed top-0 w-full z-50 border-b border-amber-500/20 glass-panel">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 supernova-gradient rounded-xl flex items-center justify-center solar-glow pulse-glow">
              <Zap className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <span className="text-xl font-bold supernova-text">
              DeverseGate
            </span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Pricing
            </a>
            <a
              href="#"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Documentation
            </a>
            <a
              href="#"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Contact
            </a>
          </nav>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button variant="ghost" className="hidden md:inline-flex">
              Sign In
            </Button>
            <Button className="prism-button text-white">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-16">
        <section className="relative overflow-hidden min-h-[90vh] flex items-center">
          <div className="container mx-auto px-4 py-32 relative z-10">
            <div className="max-w-6xl mx-auto text-center space-y-12">
              <div className="inline-flex items-center space-x-2 glass-panel dark:glass-panel rounded-full px-6 py-2.5 solar-glow shimmer">
                <Sparkles className="w-4 h-4 text-amber-500" strokeWidth={1.5} />
                <span className="text-sm font-medium text-foreground">
                  Solar AI-Powered Transaction Monitoring
                </span>
              </div>

              <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-[1.1]">
                <span className="block text-foreground">Crypto invoicing meets</span>
                <span className="block supernova-text">
                  intelligent healing
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                One platform for crypto invoicing, payments, and AI-powered transaction healing—seamlessly connected
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button
                  size="lg"
                  className="prism-button text-white px-12 py-7 text-lg font-medium rounded-full"
                >
                  Get Started Free
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="px-12 py-7 text-lg font-medium rounded-full border-2 border-amber-500/30 hover:bg-amber-500/10 backdrop-blur-xl transition-all duration-300"
                >
                  View Demo
                </Button>
              </div>

              <p className="text-sm text-muted-foreground pt-4">
                No credit card required · Free forever plan
              </p>

              <div className="pt-16 space-y-6">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Trusted by businesses worldwide
                </p>
                <div className="flex flex-wrap items-center justify-center gap-12 opacity-60">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    <span className="text-sm font-semibold">SOC 2 Certified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    <span className="text-sm font-semibold">Bank-Level Security</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    <span className="text-sm font-semibold">150+ Countries</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </section>

        <section
          id="features"
          className="py-32 relative overflow-hidden bg-muted/20"
        >
          <div className="container mx-auto px-4">
            <div className="text-center space-y-6 mb-24">
              <h2 className="text-5xl md:text-7xl font-bold text-foreground">
                Everything you need
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Powerful features designed to simplify your crypto invoicing workflow
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
              <div className="space-y-6 glass-panel dark:glass-panel p-8 rounded-3xl hover:scale-105 transition-transform duration-300">
                <div className="w-14 h-14 rounded-2xl supernova-gradient flex items-center justify-center solar-glow pulse-glow">
                  <Zap className="w-7 h-7 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Smart Invoicing</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Create professional crypto invoices in seconds with support for multiple cryptocurrencies and automatic conversion rates.
                </p>
              </div>

              <div className="space-y-6 glass-panel dark:glass-panel p-8 rounded-3xl hover:scale-105 transition-transform duration-300">
                <div className="w-14 h-14 rounded-2xl supernova-gradient flex items-center justify-center solar-glow pulse-glow">
                  <MessageSquare className="w-7 h-7 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Solar AI Assistant</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Ask questions about transactions in plain English and get instant insights, analytics, and intelligent recommendations.
                </p>
              </div>

              <div className="space-y-6 glass-panel dark:glass-panel p-8 rounded-3xl hover:scale-105 transition-transform duration-300">
                <div className="w-14 h-14 rounded-2xl supernova-gradient flex items-center justify-center solar-glow pulse-glow">
                  <RefreshCw className="w-7 h-7 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Auto-Healing</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Automatically fix failed transactions with our intelligent recovery system. Never lose a payment again.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-32 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-16 max-w-5xl mx-auto">
              <div className="text-center space-y-3">
                <h3 className="text-6xl font-bold supernova-text">99.9%</h3>
                <p className="text-muted-foreground">Uptime Guarantee</p>
              </div>
              <div className="text-center space-y-3">
                <h3 className="text-6xl font-bold supernova-text">$2M+</h3>
                <p className="text-muted-foreground">Processed Monthly</p>
              </div>
              <div className="text-center space-y-3">
                <h3 className="text-6xl font-bold supernova-text">10k+</h3>
                <p className="text-muted-foreground">Happy Customers</p>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="py-32 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="text-center space-y-6 mb-24">
              <h2 className="text-5xl md:text-7xl font-bold text-foreground">
                Simple, transparent pricing
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Choose the perfect plan for your business
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <Card className="border border-border bg-background p-8 hover:shadow-lg transition-shadow">
                <CardHeader className="space-y-4 p-0 pb-6">
                  <CardTitle className="text-2xl font-bold">Free</CardTitle>
                  <div>
                    <span className="text-5xl font-bold text-foreground">$0</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Perfect for getting started
                  </p>
                </CardHeader>
                <CardContent className="space-y-6 p-0">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Up to 10 invoices/month</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Basic crypto support</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Email support</span>
                    </li>
                  </ul>
                  <Button className="w-full rounded-full" variant="outline">
                    Get Started
                  </Button>
                </CardContent>
              </Card>

              <Card className="relative border-2 border-amber-500 glass-panel dark:glass-panel p-8 shadow-xl solar-glow">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 supernova-gradient text-white text-xs font-bold px-4 py-1 rounded-full pulse-glow">
                  POPULAR
                </div>
                <CardHeader className="space-y-4 p-0 pb-6">
                  <CardTitle className="text-2xl font-bold">Pro</CardTitle>
                  <div>
                    <span className="text-5xl font-bold supernova-text">$29</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    For growing businesses
                  </p>
                </CardHeader>
                <CardContent className="space-y-6 p-0">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-500" strokeWidth={2} />
                      <span>Unlimited invoices</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-500" strokeWidth={2} />
                      <span>All cryptocurrencies</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-500" strokeWidth={2} />
                      <span>Solar AI Assistant</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-500" strokeWidth={2} />
                      <span>Auto-healing</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-500" strokeWidth={2} />
                      <span>Priority support</span>
                    </li>
                  </ul>
                  <Button className="w-full prism-button text-white rounded-full">
                    Get Started
                  </Button>
                </CardContent>
              </Card>

              <Card className="border border-border bg-background p-8 hover:shadow-lg transition-shadow">
                <CardHeader className="space-y-4 p-0 pb-6">
                  <CardTitle className="text-2xl font-bold">Business</CardTitle>
                  <div>
                    <span className="text-5xl font-bold text-foreground">$99</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    For large organizations
                  </p>
                </CardHeader>
                <CardContent className="space-y-6 p-0">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Everything in Pro</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Team collaboration</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Advanced analytics</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>API access</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Dedicated support</span>
                    </li>
                  </ul>
                  <Button className="w-full rounded-full" variant="outline">
                    Contact Sales
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 supernova-gradient" />
          <div className="absolute inset-0 opacity-40">
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/50 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/50 rounded-full blur-3xl animate-pulse" />
          </div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="max-w-4xl mx-auto space-y-12">
              <h2 className="text-5xl md:text-7xl font-bold leading-tight text-white">
                Ready to get started?
              </h2>
              <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
                Join thousands of businesses using DeverseGate
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  className="bg-white text-amber-600 hover:bg-white/90 px-12 py-7 text-lg font-medium rounded-full shadow-lg font-bold"
                >
                  Get Started Free
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/30 text-white hover:bg-white/10 px-12 py-7 text-lg font-medium rounded-full backdrop-blur-sm"
                >
                  Schedule Demo
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 supernova-gradient rounded-xl flex items-center justify-center solar-glow pulse-glow">
                  <Zap className="w-5 h-5 text-white" strokeWidth={1.5} />
                </div>
                <span className="text-lg font-bold supernova-text">
                  DeverseGate
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Professional crypto invoicing with Solar AI-powered monitoring
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-foreground text-sm">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#features" className="hover:text-foreground transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-foreground transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    API
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Changelog
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-foreground text-sm">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-foreground text-sm">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Community
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Status
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-foreground text-sm">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 DeverseGate. All rights reserved.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
