"use client"

import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, DollarSign, AlertCircle, CheckCircle2, Wallet, FileText } from "lucide-react"
import { fetchAllInvoices, fetchInvestmentAmount, Invoice, getStatusLabel } from "@/lib/invoice"
import { useToast } from "@/components/ui/use-toast"

export default function InvestorReturnsPage() {
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
          description: "Failed to load returns data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [address, isConnected, toast])

  // Filter invoices where user has investments and are settled (Repaid or Defaulted)
  const portfolioInvoices = allInvoices.filter((inv) => investments[inv.id])
  const settledInvestments = portfolioInvoices.filter((inv) => inv.status === 3 || inv.status === 4)
  const repaidInvestments = settledInvestments.filter((inv) => inv.status === 3)
  const defaultedInvestments = settledInvestments.filter((inv) => inv.status === 4)

  // Calculate stats from blockchain data
  const totalPrincipalDeployed = settledInvestments.reduce(
    (sum, inv) => sum + parseFloat(investments[inv.id]),
    0
  )

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Wallet className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-medium">Connect your wallet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Connect your wallet to view your investment returns.
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
        <h2 className="text-3xl font-bold tracking-tight">Returns</h2>
        <p className="text-muted-foreground">Track your financial performance and earnings</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settled Investments</CardTitle>
            <DollarSign className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{settledInvestments.length}</div>
            <p className="text-xs text-muted-foreground">Completed investments</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Principal</CardTitle>
            <TrendingUp className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPrincipalDeployed.toFixed(2)} MATIC</div>
            <p className="text-xs text-muted-foreground">In settled investments</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repaid</CardTitle>
            <CheckCircle2 className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{repaidInvestments.length}</div>
            <p className="text-xs text-muted-foreground">Successfully repaid</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Defaulted</CardTitle>
            <AlertCircle className="size-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{defaultedInvestments.length}</div>
            <p className="text-xs text-muted-foreground">Defaulted investments</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Settlement History</CardTitle>
          <CardDescription>Completed investments and their outcomes</CardDescription>
        </CardHeader>
        <CardContent>
          {settledInvestments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">No settled investments</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                You don't have any investments that have been repaid or defaulted yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead className="text-right">Principal Invested</TableHead>
                  <TableHead className="text-right">Invoice Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settledInvestments.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium font-mono text-xs">#{inv.id}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {parseFloat(investments[inv.id]).toFixed(4)} MATIC
                    </TableCell>
                    <TableCell className="text-right">{parseFloat(inv.amount).toFixed(2)} MATIC</TableCell>
                    <TableCell>{inv.dueDate.toLocaleDateString()}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={inv.status === 3 ? "secondary" : "destructive"}>
                        {getStatusLabel(inv.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
