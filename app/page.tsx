import { Button } from "@/components/ui/button"
// import Web3Background from "@/components/Web3Background"
import { ArrowRight, ShieldCheck, Zap, Globe, Github, Twitter, Linkedin } from "lucide-react"
import Link from "next/link"
import CentralAnimation from "@/components/CentralAnimation"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* <Web3Background /> */}

      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b border-border/50 backdrop-blur-md sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2" href="/">
          <div className="size-9 rounded-lg bg-gradient-to-br from-primary to-primary/70 
                          text-primary-foreground font-semibold flex items-center justify-center
                          shadow-md">
            IC
          </div>

          <span className="text-xl font-semibold tracking-tight text-foreground
                          transition-colors duration-200 hover:text-primary cursor-pointer">
            InvoChain
          </span>

        </Link>
        <nav
          className="ml-auto flex items-center gap-5 sm:gap-7
                    rounded-full px-5 py-2
                    bg-background/40 backdrop-blur-xl
                    border border-white/10 shadow-lg"
        >
          <Link
            href="#features"
            className="relative text-sm font-medium text-foreground/80
                      transition-all duration-300
                      hover:text-primary hover:scale-105"
          >
            Features
            <span className="absolute left-0 -bottom-1 h-[2px] w-0
                            bg-primary transition-all duration-300
                            group-hover:w-full" />
          </Link>

          <Link
            href="#how-it-works"
            className="relative text-sm font-medium text-foreground/80
                      transition-all duration-300
                      hover:text-primary hover:scale-105"
          >
            Process
          </Link>

          <Link href="/auth/signin">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full px-4
                        transition-all duration-300
                        hover:bg-primary/10 hover:text-primary
                        hover:scale-105"
            >
              Sign In
            </Button>
          </Link>

          <Link href="/auth/signup">
            <Button
              size="sm"
              className="rounded-full px-5
                        bg-gradient-to-r from-primary to-primary/80
                        shadow-md transition-all duration-300
                        hover:shadow-xl hover:scale-105"
            >
              Create Account
            </Button>
          </Link>
        </nav>

      </header>

      <main className="flex-1">
      {/* Hero Section */}
        <section
          className="
            relative
            w-full
            min-h-screen
            flex items-center
            px-4
            bg-[#05010D]
            bg-[url('/landingbg.png')]
            bg-no-repeat
            bg-right
            bg-contain
            bg-scroll
          "
        >
          <div className="absolute inset-0 bg-black/40"></div>

          <CentralAnimation />

         <div className="container px-4 md:px-6 relative z-10">
           <div className="flex flex-col items-start space-y-6">

            {/* Minimal badge */}
            <div className="inline-flex items-center rounded-full border border-white/20 bg-black/30 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
              Revolutionizing RWA Finance
            </div>

            {/* Heading */}
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl text-white drop-shadow-md text-left">
              Decentralized Invoice <br className="hidden sm:block" />
              Financing Marketplace
            </h1>

            {/* Subtitle */}
            <p className="max-w-[720px] text-white/80 md:text-xl leading-relaxed text-left">
              Instant liquidity for MSMEs through{" "}
              <span className="text-white font-medium">tokenized invoices</span> and
              <span className="text-white font-medium"> smart contracts</span>.  
              Empowering businesses with seamless access to global capital.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="h-12 px-8 text-base rounded-xl
                    bg-primary text-primary-foreground
                    transition-transform duration-300 hover:scale-105">
                  Get Started
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>

              <Link href="/auth/signin">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 text-base rounded-xl
                    border-white/30 text-white
                    hover:bg-white/10 transition-all duration-300">
                  Marketplace Demo
                </Button>
              </Link>
            </div>

          </div>
        </div>
      </section>




       {/* Features Section */}
<section
  id="features"
  className="relative w-full py-16 md:py-28 lg:py-36"
>
  <div className="container px-4 md:px-6 mx-auto">
    <div className="grid gap-10 lg:grid-cols-3">

      {/* Feature Card */}
      <div
        className="group relative flex flex-col items-center text-center space-y-4
        p-8 rounded-2xl
        border border-white/10
        bg-black/25 backdrop-blur-md
        transition-all duration-700 ease-out
        hover:border-primary/30
        hover:scale-[1.02]"
      >
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute -inset-2 rounded-2xl opacity-0
          group-hover:opacity-100 transition duration-700
          blur-3xl bg-primary/15"
        />

        {/* Icon */}
        <div
          className="relative p-4 rounded-full bg-primary/10 text-primary
          transition-all duration-700
          group-hover:bg-primary/15
          group-hover:-translate-y-0.5"
        >
          <Zap className="size-6" />
        </div>

        <h3 className="text-xl font-bold text-white">
          Instant Liquidity
        </h3>

        <p className="text-white/70 leading-relaxed">
          Get funded in hours, not weeks. Our automated verification engine speeds up the entire financing lifecycle.
        </p>
      </div>

      {/* Feature Card */}
      <div
        className="group relative flex flex-col items-center text-center space-y-4
        p-8 rounded-2xl
        border border-white/10
        bg-black/25 backdrop-blur-md
        transition-all duration-700 ease-out
        hover:border-primary/30
        hover:scale-[1.02]"
      >
        <div
          className="pointer-events-none absolute -inset-2 rounded-2xl opacity-0
          group-hover:opacity-100 transition duration-700
          blur-3xl bg-primary/15"
        />

        <div
          className="relative p-4 rounded-full bg-primary/10 text-primary
          transition-all duration-700
          group-hover:bg-primary/15
          group-hover:-translate-y-0.5"
        >
          <ShieldCheck className="size-6" />
        </div>

        <h3 className="text-xl font-bold text-white">
          On-Chain Transparency
        </h3>

        <p className="text-white/70 leading-relaxed">
          Every invoice is tokenized as an NFT, ensuring verifiable ownership and cryptographic proof of escrow.
        </p>
      </div>

      {/* Feature Card */}
      <div
        className="group relative flex flex-col items-center text-center space-y-4
        p-8 rounded-2xl
        border border-white/10
        bg-black/25 backdrop-blur-md
        transition-all duration-700 ease-out
        hover:border-primary/30
        hover:scale-[1.02]"
      >
        <div
          className="pointer-events-none absolute -inset-2 rounded-2xl opacity-0
          group-hover:opacity-100 transition duration-700
          blur-3xl bg-primary/15"
        />

        <div
          className="relative p-4 rounded-full bg-primary/10 text-primary
          transition-all duration-700
          group-hover:bg-primary/15
          group-hover:-translate-y-0.5"
        >
          <Globe className="size-6" />
        </div>

        <h3 className="text-xl font-bold text-white">
          Global Investor Pool
        </h3>

        <p className="text-white/70 leading-relaxed">
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
                <Link className="text-sm text-muted-foreground hover:text-primary" href="#">
                  About
                </Link>
                <Link className="text-sm text-muted-foreground hover:text-primary" href="#">
                  Privacy
                </Link>
                <Link className="text-sm text-muted-foreground hover:text-primary" href="#">
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
  )
}
