"use client"

import { useEffect, useState } from "react"
import { useAccount, useBalance } from "wagmi"
import { formatEther } from "viem"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Wallet, ExternalLink, Copy, Check } from "lucide-react"
import { fetchAllInvoices, fetchInvestmentAmount, Invoice } from "@/lib/invoice"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

function formatAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function formatFullAddress(addr: string) {
  return `${addr.slice(0, 10)}...${addr.slice(-8)}`
}

export default function InvestorWalletPage() {
  const { address, isConnected } = useAccount()
  const { data: balanceData, isLoading: isLoadingBalance } = useBalance({
    address: address,
  })
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([])
  const [investments, setInvestments] = useState<Record<number, string>>({})
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadData = async () => {
      if (!isConnected || !address) {
        setIsLoadingInvoices(false)
        return
      }

      try {
        setIsLoadingInvoices(true)
        const invoices = await fetchAllInvoices()
        setAllInvoices(invoices)

        // Fetch investment amounts for each invoice
        const investmentMap: Record<number, string> = {}
        for (const inv of invoices) {
          const amount = await fetchInvestmentAmount(inv.id, address)
          if (parseFloat(amount) > 0) {
            investmentMap[inv.id] = amount
          }
        }
        setInvestments(investmentMap)
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: "Error",
          description: "Failed to load wallet data",
          variant: "destructive",
        })
      } finally {
        setIsLoadingInvoices(false)
      }
    }

    loadData()
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
  const portfolioInvoices = allInvoices.filter((inv) => investments[inv.id])
  const totalDeployed = Object.values(investments).reduce(
    (sum, amount) => sum + parseFloat(amount),
    0
  )

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Wallet className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-medium">Connect your wallet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Connect your wallet to view your wallet balance and investment data.
        </p>
      </div>
    )
  }

  const polygonScanUrl = `https://amoy.polygonscan.com/address/${address}`
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Wallet</h2>
        <p className="text-muted-foreground">Manage your investment capital and transactions</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="size-5 text-primary" />
              Wallet Balance
            </CardTitle>
            <CardDescription>Your native MATIC balance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">MATIC Balance</p>
              {isLoadingBalance ? (
                <Skeleton className="h-12 w-48" />
              ) : (
                <p className="text-4xl font-bold">
                  {balanceData ? parseFloat(formatEther(balanceData.value)).toFixed(4) : "0.0000"} MATIC
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.open(polygonScanUrl, "_blank")}
              >
                <ExternalLink className="size-4 mr-2" />
                View on Explorer
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Connected Wallet</CardTitle>
            <CardDescription>Your blockchain wallet address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Wallet Address</p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-3 py-2 rounded border border-border/50 flex-1 font-mono">
                  {address ? formatFullAddress(address) : "Not connected"}
                </code>
                {address && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyAddress}
                    title="Copy address"
                  >
                    {copied ? (
                      <Check className="size-4 text-green-500" />
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
                className="w-full"
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
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Capital Deployed</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingInvoices ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalDeployed.toFixed(2)} MATIC</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {portfolioInvoices.length} {portfolioInvoices.length === 1 ? "investment" : "investments"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Investments</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingInvoices ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {portfolioInvoices.filter((inv) => inv.status === 1 || inv.status === 2).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Currently funded</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Network</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Polygon Amoy</div>
            <p className="text-xs text-muted-foreground mt-1">Testnet</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Wallet Information</CardTitle>
          <CardDescription>
            Your wallet data is read directly from the blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Network</p>
              <p className="text-sm text-muted-foreground">Polygon Amoy Testnet (Chain ID: 80002)</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Currency</p>
              <p className="text-sm text-muted-foreground">MATIC (Polygon native token)</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Block Explorer</p>
              <Button
                variant="link"
                className="p-0 h-auto text-sm"
                onClick={() => window.open(polygonScanUrl, "_blank")}
              >
                View on PolygonScan
                <ExternalLink className="size-3 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

