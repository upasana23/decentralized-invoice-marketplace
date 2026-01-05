"use client"

import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, Clock, CheckCircle2, Wallet, FileText } from "lucide-react"
import { fetchAllInvoices, fetchInvestmentAmount, Invoice, getStatusLabel, calculateDaysRemaining } from "@/lib/invoice"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

function formatAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export default function InvestorPortfolioPage() {
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
          description: "Failed to load portfolio data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [address, isConnected, toast])

  // Filter invoices where user has investments
  const portfolioInvoices = allInvoices.filter((inv) => investments[inv.id])
  const activeInvestments = portfolioInvoices.filter((inv) => inv.status === 1 || inv.status === 2)

  // Calculate stats from blockchain data
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
          Connect your wallet to view your investment portfolio.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
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
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Portfolio</h2>
        <p className="text-muted-foreground">Track your active capital and expected returns</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capital Deployed</CardTitle>
            <TrendingUp className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeployed.toFixed(2)} MATIC</div>
            <p className="text-xs text-muted-foreground">{portfolioInvoices.length} {portfolioInvoices.length === 1 ? "investment" : "investments"}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Investments</CardTitle>
            <CheckCircle2 className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeInvestments.length}</div>
            <p className="text-xs text-muted-foreground">Currently funded</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portfolioInvoices.reduce((sum, inv) => sum + parseFloat(inv.fundedAmount), 0).toFixed(2)} MATIC
            </div>
            <p className="text-xs text-muted-foreground">Total funded</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settled</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portfolioInvoices.filter((inv) => inv.status === 3 || inv.status === 4).length}
            </div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>My Investments</CardTitle>
          <CardDescription>Invoices you are currently funding</CardDescription>
        </CardHeader>
        <CardContent>
          {portfolioInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">No investments yet</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                You haven't invested in any invoices yet. Browse the marketplace to start investing.
              </p>
              <Link href="/dashboard/investor/marketplace">
                <Button>Browse Marketplace</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>MSME Address</TableHead>
                  <TableHead>Buyer Address</TableHead>
                  <TableHead className="text-right">Invested Amount</TableHead>
                  <TableHead className="text-right">Total Invoice</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolioInvoices.map((invoice) => {
                  const daysRemaining = calculateDaysRemaining(invoice.dueDate)
                  const statusLabel = getStatusLabel(invoice.status)
                  const isLate = daysRemaining < 0 && invoice.status === 2

                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium font-mono text-xs">#{invoice.id}</TableCell>
                      <TableCell className="font-mono text-xs">{formatAddress(invoice.msme)}</TableCell>
                      <TableCell className="font-mono text-xs">{formatAddress(invoice.buyer)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {parseFloat(investments[invoice.id]).toFixed(4)} MATIC
                      </TableCell>
                      <TableCell className="text-right">
                        {parseFloat(invoice.amount).toFixed(2)} MATIC
                      </TableCell>
                      <TableCell>{invoice.dueDate.toLocaleDateString()}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={isLate ? "destructive" : statusLabel === "Funded" ? "default" : "outline"}>
                          {isLate ? "Late" : statusLabel}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
