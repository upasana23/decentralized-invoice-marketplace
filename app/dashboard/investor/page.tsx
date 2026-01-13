"use client"

import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { TrendingUp, PieChart, ShieldCheck, DollarSign, Wallet, FileText } from "lucide-react"
import { fetchAllInvoices, fetchInvestmentAmount, Invoice } from "@/lib/invoice"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { DashboardChatSection } from "@/components/chat/DashboardChatSection"

export default function InvestorDashboard() {
  const { address, isConnected } = useAccount()
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([])
  const [investments, setInvestments] = useState<Record<number, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const loadData = async () => {
      if (!isConnected || !address) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
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
        console.error(error)
        toast({
          title: "Error",
          description: "Failed to load investment data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [address, isConnected, toast])

  // Calculate portfolio stats from blockchain data
  const portfolioInvoices = allInvoices.filter((inv) => investments[inv.id])
  const totalDeployed = Object.values(investments).reduce(
    (sum, amount) => sum + parseFloat(amount),
    0
  )
  const activeInvestments = portfolioInvoices.filter((inv) => inv.status === 1 || inv.status === 2)

  const portfolioStats = [
    { label: "Total Deployed", value: `${totalDeployed.toFixed(2)} MATIC`, icon: DollarSign, color: "text-primary" },
    { label: "Active Investments", value: activeInvestments.length.toString(), icon: ShieldCheck, color: "text-emerald-500" },
    { label: "Portfolio Size", value: portfolioInvoices.length.toString(), icon: PieChart, color: "text-amber-500" },
    { label: "Funded Amount", value: `${portfolioInvoices.reduce((sum, inv) => sum + parseFloat(inv.fundedAmount), 0).toFixed(2)} MATIC`, icon: TrendingUp, color: "text-blue-500" },
  ]

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Wallet className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-medium">Connect your wallet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Connect your wallet to view your investment portfolio.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-border/50">
              <CardHeader>
                <Skeleton className="h-4 w-32 mb-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Investor Overview</h1>
        <p className="text-muted-foreground">Manage your decentralized RWA portfolio.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {portfolioStats.map((stat) => (
          <Card key={stat.label} className="border-border/50 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className={`size-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50 bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Active Investments</CardTitle>
            <CardDescription>Your current portfolio investments.</CardDescription>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard/investor/portfolio">View Portfolio</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {activeInvestments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">No active investments</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                You don't have any active investments yet. Browse the marketplace to start investing.
              </p>
              <Button asChild>
                <Link href="/dashboard/investor/marketplace">Browse Marketplace</Link>
              </Button>
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-muted-foreground">
                    <th className="h-10 px-2 text-left font-medium">Invoice ID</th>
                    <th className="h-10 px-2 text-left font-medium">MSME</th>
                    <th className="h-10 px-2 text-left font-medium">Invested</th>
                    <th className="h-10 px-2 text-left font-medium">Total Amount</th>
                    <th className="h-10 px-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {activeInvestments.map((inv) => (
                    <tr key={inv.id}>
                      <td className="p-4 font-mono text-xs">#{inv.id}</td>
                      <td className="p-4 font-mono text-xs">{inv.msme.slice(0, 6)}...{inv.msme.slice(-4)}</td>
                      <td className="p-4 font-medium">{parseFloat(investments[inv.id]).toFixed(4)} MATIC</td>
                      <td className="p-4">{parseFloat(inv.amount).toFixed(2)} MATIC</td>
                      <td className="p-4">
                        <Badge variant={inv.status === 1 ? "outline" : "default"}>
                          {inv.status === 1 ? "Fundraising" : "Funded"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {address && (
        <DashboardChatSection walletAddress={address} role="investor" />
      )}
    </div>
  )
}
