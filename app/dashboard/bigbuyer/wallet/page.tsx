"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useAccount, useBalance } from "wagmi"
import { formatEther } from "viem"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Wallet, ExternalLink, Copy, Check, TrendingUp } from "lucide-react"
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
    <div className="min-h-screen bg-[#050505] relative overflow-hidden text-white">
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#FF4D00] opacity-[0.08] blur-[120px]" />
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-[#FF8A00] opacity-[0.05] blur-[100px]" />

      <main className="relative z-10 p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 bg-clip-text text-transparent">
            Wallet & Payments
          </h1>
          <p className="text-gray-400 mt-2">Manage your payment wallet and transaction history</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-black/40 backdrop-blur-md border border-orange-500/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(255,77,0,0.05)] hover:shadow-[0_0_30px_rgba(255,77,0,0.15)] transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="size-5 text-[#FFD600]" />
                <span className="text-orange-400 font-bold">Wallet Balance</span>
              </CardTitle>
              <CardDescription className="text-orange-300">Your native POL balance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-orange-200 mb-1">POL Balance</p>
                {isLoadingBalance ? (
                  <Skeleton className="h-12 w-48" />
                ) : (
                  <p className="text-4xl font-extrabold text-white">
                    {balanceData ? parseFloat(formatEther(BigInt(balanceData.value))).toFixed(4) : "0.0000"} POL
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                  onClick={() => window.open(polygonScanUrl, "_blank")}
                >
                  <ExternalLink className="size-4 mr-2" />
                  View on Explorer
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-md border border-orange-500/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(255,77,0,0.05)] hover:shadow-[0_0_30px_rgba(255,77,0,0.15)] transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="size-5 text-[#FFD600]" />
                <span className="text-orange-400 font-bold">Connected Wallet</span>
              </CardTitle>
              <CardDescription className="text-orange-300">Your blockchain wallet address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-orange-200 mb-1">Wallet Address</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-3 py-2 rounded border border-orange-500/50 flex-1 font-mono">
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
            </CardContent>
          </Card>
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
