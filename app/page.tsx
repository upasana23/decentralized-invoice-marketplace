'use client';

import { Button } from "@/components/ui/button"
import { ArrowRight, ShieldCheck, Zap, Globe, Github, Twitter, Linkedin } from "lucide-react"
import Link from "next/link"
import InfiniteGrid from "@/components/ui/infinite-grid"

export default function LandingPage() {
  return (
    <div className="relative min-h-screen">
      <InfiniteGrid />
      <div className="relative z-10">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b border-border/50 backdrop-blur-md sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2" href="/">
          <div className="bg-primary size-8 rounded flex items-center justify-center text-primary-foreground font-bold">
            IC
          </div>
          <span className="font-bold text-xl tracking-tighter">InvoChain</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="#features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="#how-it-works">
            Process
          </Link>
          <Link href="/auth/signin">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button size="sm">Create Account</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 flex flex-col items-center justify-center text-center px-4">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-medium border border-primary/20">
                Revolutionizing RWA Finance
              </div>
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl max-w-3xl">
                Decentralized Invoice Financing Marketplace
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl leading-relaxed">
                Instant liquidity for MSMEs through tokenized invoices and smart contracts. Empowering businesses with
                the global capital they deserve.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/auth/signup">
                  <Button size="lg" className="h-12 px-8 text-base">
                    Get Started <ArrowRight className="ml-2 size-4" />
                  </Button>
                </Link>
                <Link href="/auth/signin">
                  <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-transparent">
                    Marketplace Demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-accent/5">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-12 lg:grid-cols-3">
              <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <Zap className="size-6" />
                </div>
                <h3 className="text-xl font-bold">Instant Liquidity</h3>
                <p className="text-muted-foreground">
                  Get funded in hours, not weeks. Our automated verification engine speeds up the entire financing
                  lifecycle.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <ShieldCheck className="size-6" />
                </div>
                <h3 className="text-xl font-bold">On-Chain Transparency</h3>
                <p className="text-muted-foreground">
                  Every invoice is tokenized as an NFT, ensuring verifiable ownership and cryptographic proof of escrow.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <Globe className="size-6" />
                </div>
                <h3 className="text-xl font-bold">Global Investor Pool</h3>
                <p className="text-muted-foreground">
                  Access borderless capital markets. Investors from anywhere can fund real-world yield opportunities.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 border-t border-border/50 bg-background">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            <div className="col-span-2 lg:col-span-2 space-y-4">
              <Link className="flex items-center gap-2" href="/">
                <div className="bg-primary size-6 rounded flex items-center justify-center text-primary-foreground text-xs font-bold">
                  IC
                </div>
                <span className="font-bold text-lg tracking-tighter">InvoChain</span>
              </Link>
              <p className="text-sm text-muted-foreground max-w-xs">
                Empowering MSMEs globally with decentralized finance. Tokenizing the future of business receivables.
              </p>
              <div className="flex gap-4">
                <Twitter className="size-5 text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
                <Linkedin className="size-5 text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
                <Github className="size-5 text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider">Product</h4>
              <nav className="flex flex-col gap-2">
                <Link className="text-sm text-muted-foreground hover:text-primary" href="#">
                  Marketplace
                </Link>
                <Link className="text-sm text-muted-foreground hover:text-primary" href="#">
                  For MSMEs
                </Link>
                <Link className="text-sm text-muted-foreground hover:text-primary" href="#">
                  Risk Engine
                </Link>
              </nav>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider">Company</h4>
              <nav className="flex flex-col gap-2">
                <Link className="text-sm text-muted-foreground hover:text-primary transition-colors" href="/about">
                  About
                </Link>
                <Link className="text-sm text-muted-foreground hover:text-primary transition-colors" href="/privacy">
                  Privacy
                </Link>
                <Link className="text-sm text-muted-foreground hover:text-primary transition-colors" href="/terms">
                  Terms
                </Link>
              </nav>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider">Contact</h4>
              <nav className="flex flex-col gap-2">
                <Link className="text-sm text-muted-foreground hover:text-primary" href="#">
                  Support
                </Link>
                <Link className="text-sm text-muted-foreground hover:text-primary" href="#">
                  Sales
                </Link>
                <Link className="text-sm text-muted-foreground hover:text-primary" href="#">
                  Media
                </Link>
              </nav>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border/50 text-center">
            <p className="text-sm text-muted-foreground">© 2025 InvoChain. All rights reserved.</p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  )
}
