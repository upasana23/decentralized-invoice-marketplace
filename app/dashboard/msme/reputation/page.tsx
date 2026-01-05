"use client"

import { useEffect, useState } from "react"
import { useAccount, usePublicClient } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Award, CheckCircle2, AlertTriangle, Wallet, FileText } from "lucide-react"
import { fetchInvoicesByMSME, Invoice } from "@/lib/invoice"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function MSMEReputationPage() {
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
        setInvoices(msmeInvoices)
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

  // Calculate reputation metrics from blockchain data
  const totalInvoices = invoices.length
  const repaidInvoices = invoices.filter((inv) => inv.status === 3)
  const defaultedInvoices = invoices.filter((inv) => inv.status === 4)
  const settledInvoices = repaidInvoices.length + defaultedInvoices.length
  
  // Settlement success ratio (percentage of settled invoices that were repaid)
  const settlementSuccessRatio =
    settledInvoices > 0
      ? Math.round((repaidInvoices.length / settledInvoices) * 100)
      : 0
  
  // Default count
  const defaultCount = defaultedInvoices.length

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Wallet className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-medium">Connect your wallet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Connect your wallet to view your reputation metrics.
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
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reputation</h2>
        <p className="text-muted-foreground">
          Your creditworthiness and platform standing (blockchain-derived metrics)
        </p>
      </div>

      {totalInvoices === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">No invoices yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Create your first invoice to start building your reputation on the blockchain.
            </p>
            <Button asChild>
              <Link href="/dashboard/msme/tokenize">Create Invoice</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                <FileText className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalInvoices}</div>
                <p className="text-xs text-muted-foreground">
                  {totalInvoices === 1 ? "Invoice created" : "Invoices created"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Repaid Invoices</CardTitle>
                <CheckCircle2 className="size-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{repaidInvoices.length}</div>
                <p className="text-xs text-muted-foreground">
                  {repaidInvoices.length === 1 ? "Invoice repaid" : "Invoices repaid"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Default Count</CardTitle>
                <AlertTriangle className="size-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{defaultCount}</div>
                <p className="text-xs text-muted-foreground">
                  {defaultCount === 0 ? "No defaults" : defaultCount === 1 ? "Default recorded" : "Defaults recorded"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Settlement Success Ratio</CardTitle>
                <Award className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${settlementSuccessRatio >= 90 ? "text-green-500" : settlementSuccessRatio >= 70 ? "text-amber-500" : "text-red-500"}`}>
                  {settlementSuccessRatio}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {settledInvoices > 0
                    ? `${repaidInvoices.length} of ${settledInvoices} settled`
                    : "No settled invoices"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Reputation Summary</CardTitle>
              <CardDescription>
                Basic metrics derived from your blockchain invoice history
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Total Invoices</span>
                  <span className="text-sm font-semibold">{totalInvoices}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Repaid Invoices</span>
                  <span className="text-sm font-semibold">{repaidInvoices.length}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Defaulted Invoices</span>
                  <span className="text-sm font-semibold">{defaultCount}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Settlement Success Ratio</span>
                  <span className="text-sm font-semibold">{settlementSuccessRatio}%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground pt-2 border-t">
                Note: Advanced reputation metrics (credit score, buyer quality, etc.) will be available once an off-chain reputation engine is implemented.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
