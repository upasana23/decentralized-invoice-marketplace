import type React from "react"
import { Web3Provider } from "@/components/providers/web3-provider";
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Web3Background from "@/components/Web3Background"

const geistSans = Geist({ subsets: ["latin"], variable: "--font-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "InvoChain | Decentralized MSME Invoice Financing",
  description: "Instant liquidity for MSMEs through tokenized invoices and smart contracts.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <Web3Provider>
            {/* 🌐 Premium Web3 Animated Background */}
            <Web3Background />
            {children}
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
