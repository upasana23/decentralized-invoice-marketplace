"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useAccount, useBalance } from "wagmi"
import { formatEther } from "viem"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Wallet, ExternalLink, Copy, Check, TrendingUp, ArrowUpRight } from "lucide-react"
import { fetchInvoicesByBuyer, Invoice } from "@/lib/invoice"
import { useToast } from "@/components/ui/use-toast"

function formatAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function formatFullAddress(addr: string) {
  return `${addr.slice(0, 10)}...${addr.slice(-8)}`
}

export default function BigBuyerWalletPage() {
  const { address, isConnected } = useAccount()
  const { data: balanceData, isLoading: isLoadingBalance } = useBalance({
    address,
  })
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadInvoices = async () => {
      if (!isConnected || !address) {
        setIsLoadingInvoices(false)
        return
      }

      try {
        setIsLoadingInvoices(true)
        const buyerInvoices = await fetchInvoicesByBuyer(address)
        setInvoices(buyerInvoices)
      } catch (error) {
        console.error("Error loading invoices:", error)
        toast({
          title: "Error",
          description: "Failed to load wallet data",
          variant: "destructive",
        })
      } finally {
        setIsLoadingInvoices(false)
      }
    }

    loadInvoices()
  }, [address, isConnected, toast])

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      toast({
        title: "Copied",
        description: "Wallet address copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Calculate stats from blockchain data
  const outstandingInvoices = invoices.filter(
    (inv) => inv.status === 1 || inv.status === 2
  )
  const totalOutstanding = outstandingInvoices.reduce(
    (sum, inv) => sum + parseFloat(inv.amount),
    0
  )
  const repaidInvoices = invoices.filter((inv) => inv.status === 3)
  const totalPaid = repaidInvoices.reduce(
    (sum, inv) => sum + parseFloat(inv.amount),
    0
  )

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Wallet className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-medium">Connect your wallet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Connect your wallet to view wallet information.
        </p>
      </div>
    )
  }

  const polygonScanUrl = `https://amoy.polygonscan.com/address/${address}`
  return (
    <div className="min-h-screen bg-[#080808] relative overflow-hidden text-white">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/25 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[40%] bg-yellow-600/15 blur-[100px] rounded-full" />
      </div>

      <main className="relative z-10 p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">
            Wallet & Payments
          </h1>
          <p className="text-neutral-500 font-medium mt-1">Manage your payment wallet and transaction history</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-3xl transition-all duration-300 hover:border-orange-500/50 hover:bg-white/[0.05] hover:shadow-[0_0_30px_rgba(234,88,12,0.15)] group p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 rounded-2xl bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                <Wallet className="size-6 text-orange-500" />
              </div>
              <ArrowUpRight className="size-5 text-neutral-600 group-hover:text-orange-400" />
            </div>
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Wallet Balance</p>
            <div className="mt-4">
              <p className="text-sm text-neutral-500 mb-2">POL Balance</p>
              {isLoadingBalance ? (
                <Skeleton className="h-12 w-48" />
              ) : (
                <p className="text-4xl font-extrabold text-white">
                  {balanceData ? parseFloat(formatEther(BigInt(balanceData.value))).toFixed(4) : "0.0000"} POL
                </p>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                onClick={() => window.open(polygonScanUrl, "_blank")}
              >
                <ExternalLink className="size-4 mr-2" />
                View on Explorer
              </Button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-3xl transition-all duration-300 hover:border-orange-500/50 hover:bg-white/[0.05] hover:shadow-[0_0_30px_rgba(234,88,12,0.15)] group p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 rounded-2xl bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                <Wallet className="size-6 text-orange-500" />
              </div>
              <ArrowUpRight className="size-5 text-neutral-600 group-hover:text-orange-400" />
            </div>
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Connected Wallet</p>
            <div className="mt-4">
              <p className="text-sm text-neutral-500 mb-2">Wallet Address</p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-black/20 px-3 py-2 rounded border border-orange-500/50 flex-1 font-mono">
                  {address ? formatFullAddress(address) : "Not connected"}
                </code>
                {address && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyAddress}
                    title="Copy address"
                    className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                  >
                    {copied ? (
                      <Check className="size-4 text-green-400" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
            {address && (
              <Button
                variant="outline"
                className="w-full border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                onClick={() => window.open(polygonScanUrl, "_blank")}
              >
                <ExternalLink className="size-4 mr-2" />
                View on PolygonScan
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-black/40 backdrop-blur-md border border-orange-500/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(255,77,0,0.05)] hover:shadow-[0_0_30px_rgba(255,77,0,0.15)] transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-400">Total Paid</CardTitle>
              <Check className="size-4 text-[#FFD600]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-white">{totalPaid.toFixed(2)} MATIC</div>
              <p className="text-xs text-muted-foreground">
                {repaidInvoices.length} {repaidInvoices.length === 1 ? "payment" : "payments"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-md border border-orange-500/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(255,77,0,0.05)] hover:shadow-[0_0_30px_rgba(255,77,0,0.15)] transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-400">Outstanding</CardTitle>
              <Wallet className="size-4 text-[#FFD600]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-white">{totalOutstanding.toFixed(2)} MATIC</div>
              <p className="text-xs text-muted-foreground">
                {outstandingInvoices.length} {outstandingInvoices.length === 1 ? "invoice" : "invoices"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-md border border-orange-500/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(255,77,0,0.05)] hover:shadow-[0_0_30px_rgba(255,77,0,0.15)] transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-400">Avg Payment Size</CardTitle>
              <TrendingUp className="size-4 text-[#FFD600]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-white">
                {repaidInvoices.length > 0
                  ? (totalPaid / repaidInvoices.length).toFixed(2)
                  : "0.00"}{" "}
                MATIC
              </div>
              <p className="text-xs text-muted-foreground">Per invoice payment</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-black/40 backdrop-blur-md border border-orange-500/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(255,77,0,0.05)] hover:shadow-[0_0_30px_rgba(255,77,0,0.15)] transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-[#FFD600]" />
              <span className="text-orange-400 font-bold">Wallet Information</span>
            </CardTitle>
            <CardDescription className="text-orange-300">Your wallet data is read directly from blockchain</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-orange-200 mb-1">Network</p>
              <p className="text-sm text-orange-200">Polygon Amoy Testnet (Chain ID: 80002)</p>
            </div>
            <div>
              <p className="text-sm font-medium text-orange-200 mb-1">Currency</p>
              <p className="text-sm text-orange-200">MATIC (Polygon native token)</p>
            </div>
            <div>
              <p className="text-sm font-medium text-orange-200 mb-1">Block Explorer</p>
              <Button
                variant="link"
                className="p-0 h-auto text-sm border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                onClick={() => window.open(polygonScanUrl, "_blank")}
              >
                <ExternalLink className="size-3 ml-1" />
                View on PolygonScan
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
