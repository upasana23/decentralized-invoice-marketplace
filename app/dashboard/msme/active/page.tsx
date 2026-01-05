"use client"

import { useEffect, useState } from "react"
import { useAccount, usePublicClient } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Wallet, ExternalLink } from "lucide-react"
import { fetchInvoicesByMSME, Invoice, getStatusLabel, calculateDaysRemaining } from "@/lib/invoice"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

function formatAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export default function MSMEActiveInvoicesPage() {
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
        // Filter for active invoices: Fundraising (1) or Funded (2)
        const activeInvoices = msmeInvoices.filter(
          (inv) => inv.status === 1 || inv.status === 2
        )
        setInvoices(activeInvoices)
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
  const totalActiveValue = invoices.reduce(
    (sum, inv) => sum + parseFloat(inv.amount),
    0
  )
  const totalFundedAmount = invoices.reduce(
    (sum, inv) => sum + parseFloat(inv.fundedAmount),
    0
  )
  
  // Calculate average days to settlement (for funded invoices only)
  const fundedInvoices = invoices.filter((inv) => inv.status === 2)
  const avgDaysToSettlement =
    fundedInvoices.length > 0
      ? Math.round(
          fundedInvoices.reduce((sum, inv) => {
            const daysRemaining = calculateDaysRemaining(inv.dueDate)
            return sum + Math.max(0, daysRemaining)
          }, 0) / fundedInvoices.length
        )
      : 0

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Wallet className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-medium">Connect your wallet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Connect your wallet to view your active invoices.
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
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
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
        <h2 className="text-3xl font-bold tracking-tight">Active Invoices</h2>
        <p className="text-muted-foreground">
          Track invoices that are funded or currently fundraising
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Active Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalActiveValue.toFixed(2)} MATIC
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {invoices.length} {invoices.length === 1 ? "invoice" : "invoices"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Funded Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalFundedAmount.toFixed(2)} MATIC
            </div>
            <p className="text-xs text-muted-foreground mt-1">Received upfront</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Days to Settlement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgDaysToSettlement > 0 ? `${avgDaysToSettlement} days` : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Expected timeline</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Active Invoice Tracker</CardTitle>
          <CardDescription>Invoices awaiting payment from buyers</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <p className="text-muted-foreground">No active invoices</p>
              <p className="text-sm text-muted-foreground text-center">
                You don't have any invoices that are currently fundraising or funded.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Buyer Address</TableHead>
                  <TableHead className="text-right">Invoice Value</TableHead>
                  <TableHead className="text-right">Funded Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-center">Days Remaining</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const daysRemaining = calculateDaysRemaining(invoice.dueDate)
                  const statusLabel = getStatusLabel(invoice.status)
                  const isLate = daysRemaining < 0 && invoice.status === 2

                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        #{invoice.id}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatAddress(invoice.buyer)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {parseFloat(invoice.amount).toFixed(2)} MATIC
                      </TableCell>
                      <TableCell className="text-right">
                        {parseFloat(invoice.fundedAmount).toFixed(2)} MATIC
                      </TableCell>
                      <TableCell>
                        {invoice.dueDate.toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={isLate ? "text-red-500 font-semibold" : ""}
                        >
                          {daysRemaining}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            statusLabel === "Fundraising"
                              ? "outline"
                              : isLate
                              ? "destructive"
                              : "default"
                          }
                        >
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
