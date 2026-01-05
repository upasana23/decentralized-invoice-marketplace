"use client"

import { useEffect, useState } from "react"
import { useAccount, usePublicClient } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle2, AlertCircle, Wallet } from "lucide-react"
import { fetchInvoicesByMSME, Invoice, getStatusLabel, calculateDaysRemaining } from "@/lib/invoice"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import Link from "next/link"

function formatAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export default function MSMEHistoryPage() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const loadInvoices = async () => {
      if (!isConnected || !address) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const msmeInvoices = await fetchInvoicesByMSME(address, publicClient || undefined)
        // Filter for settled invoices: Repaid (3) or Defaulted (4)
        const settledInvoices = msmeInvoices.filter(
          (inv) => inv.status === 3 || inv.status === 4
        )
        setInvoices(settledInvoices)
      } catch (error) {
        console.error(error)
        toast({
          title: "Error",
          description: "Failed to load invoices",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadInvoices()
  }, [address, isConnected, publicClient, toast])

  // Calculate stats from blockchain data
  const totalSettled = invoices.length
  const totalLiquidityReceived = invoices.reduce(
    (sum, inv) => sum + parseFloat(inv.fundedAmount),
    0
  )
  const repaidInvoices = invoices.filter((inv) => inv.status === 3)
  const onTimeCount = repaidInvoices.length // For now, assume all repaid are on-time
  const onTimeRate =
    totalSettled > 0 ? Math.round((onTimeCount / totalSettled) * 100) : 0
  const defaultedCount = invoices.filter((inv) => inv.status === 4).length

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Wallet className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-medium">Connect your wallet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Connect your wallet to view your settled invoice history.
        </p>
        <Button asChild>
          <Link href="/connect">Connect Wallet</Link>
        </Button>
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
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32 mb-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full mb-2" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settled History</h2>
        <p className="text-muted-foreground">
          Complete financial record of settled invoices
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Invoices Settled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSettled}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalSettled === 0 ? "No invoices settled yet" : "Settled invoices"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Liquidity Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalLiquidityReceived.toFixed(2)} MATIC
            </div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime funding</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Defaulted Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{defaultedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {defaultedCount === 0 ? "No defaults" : "Defaults recorded"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Settlement Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${onTimeRate >= 90 ? "text-green-500" : ""}`}>
              {onTimeRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {onTimeCount} of {totalSettled} {totalSettled === 1 ? "invoice" : "invoices"} repaid
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Settlement Records</CardTitle>
          <CardDescription>Historical transparency of completed invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <p className="text-muted-foreground">No settled invoices</p>
              <p className="text-sm text-muted-foreground text-center">
                You don't have any invoices that have been repaid or defaulted yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Buyer Address</TableHead>
                  <TableHead className="text-right">Invoice Value</TableHead>
                  <TableHead className="text-right">Amount Received</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const statusLabel = getStatusLabel(invoice.status)
                  const isRepaid = invoice.status === 3
                  const isDefaulted = invoice.status === 4

                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">#{invoice.id}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatAddress(invoice.buyer)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {parseFloat(invoice.amount).toFixed(2)} MATIC
                      </TableCell>
                      <TableCell className="text-right">
                        {parseFloat(invoice.fundedAmount).toFixed(2)} MATIC
                      </TableCell>
                      <TableCell>{invoice.dueDate.toLocaleDateString()}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isRepaid ? (
                            <>
                              <CheckCircle2 className="size-4 text-green-500" />
                              <Badge variant="secondary">{statusLabel}</Badge>
                            </>
                          ) : isDefaulted ? (
                            <>
                              <AlertCircle className="size-4 text-red-500" />
                              <Badge variant="destructive">{statusLabel}</Badge>
                            </>
                          ) : (
                            <Badge variant="outline">{statusLabel}</Badge>
                          )}
                        </div>
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
