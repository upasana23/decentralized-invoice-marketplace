"use client"

import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DollarSign, Clock, TrendingUp, CheckCircle2, Wallet, FileText, Calendar, Timer, AlertCircle } from "lucide-react"
import { fetchInvoicesByBuyer, Invoice, getStatusLabel, calculateDaysRemaining } from "@/lib/invoice"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

function formatAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function formatDate(timestamp: any) {
    if (!timestamp) return "N/A"
    const date = new Date(Number(timestamp) * 1000) 
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function BigBuyerOverviewPage() {
  const { address, isConnected } = useAccount()
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
        const buyerInvoices = await fetchInvoicesByBuyer(address)
        setInvoices(buyerInvoices)
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
  }, [address, isConnected, toast])

  // Stats calculation
  const totalInvoices = invoices.length
  const outstandingInvoices = invoices.filter(
    (inv) => inv.status === 1 || inv.status === 2
  )
  const outstandingAmount = outstandingInvoices.reduce(
    (sum, inv) => sum + parseFloat(inv.amount),
    0
  )
  const repaidInvoices = invoices.filter((inv) => inv.status === 3)
  const onTimeRate =
    repaidInvoices.length > 0 && totalInvoices > 0
      ? Math.round((repaidInvoices.length / totalInvoices) * 100)
      : 0

  // Filter and Sort for Timeline (Pending/Overdue only, sorted by date)
  const timelineInvoices = invoices
    .filter(inv => inv.status === 1 || inv.status === 2)
    .sort((a: any, b: any) => Number(a.dueDate) - Number(b.dueDate))
    .slice(0, 5);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Wallet className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-medium">Connect your wallet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Connect your wallet to view your payment obligations.
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-border/50">
              <CardHeader><Skeleton className="h-4 w-32 mb-2" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-24" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
        <p className="text-muted-foreground">Monitor your payment obligations and reputation</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices Received</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
            <p className="text-xs text-muted-foreground">
              {totalInvoices === 0 ? "No invoices yet" : `${totalInvoices} ${totalInvoices === 1 ? "invoice" : "invoices"}`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Amount</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outstandingAmount.toFixed(2)} MATIC</div>
            <p className="text-xs text-muted-foreground">
              {outstandingInvoices.length} {outstandingInvoices.length === 1 ? "invoice" : "invoices"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repaid Invoices</CardTitle>
            <TrendingUp className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{repaidInvoices.length}</div>
            <p className="text-xs text-muted-foreground">Successfully repaid</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Success Rate</CardTitle>
            <CheckCircle2 className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${onTimeRate >= 90 ? "text-green-500" : ""}`}>
              {onTimeRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {repaidInvoices.length} of {totalInvoices} {totalInvoices === 1 ? "invoice" : "invoices"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        
        {/* ENHANCED FEATURE: Payment Timeline with Timer */}
        <Card className="border-border/50 h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Timer className="h-5 w-5 text-primary" />
                    Payment Deadline Tracker
                </CardTitle>
                <CardDescription>Real-time countdown for upcoming dues</CardDescription>
            </CardHeader>
            <CardContent>
                {timelineInvoices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <CheckCircle2 className="h-10 w-10 mb-3 text-green-500/50" />
                        <p>No pending payments!</p>
                    </div>
                ) : (
                    <div className="relative pl-2 space-y-6">
                        {/* Vertical Line */}
                        <div className="absolute left-[19px] top-2 bottom-4 w-0.5 bg-border/60" />

                        {timelineInvoices.map((invoice: any, index) => {
                            const daysLeft = calculateDaysRemaining(invoice.dueDate);
                            const isOverdue = invoice.status === 2 || (typeof daysLeft === 'number' && daysLeft < 0);
                            const isUrgent = !isOverdue && typeof daysLeft === 'number' && daysLeft <= 3;
                            
                            // Determine color scheme based on urgency
                            let statusColor = "bg-blue-500/10 text-blue-600 border-blue-200/50";
                            let iconColor = "bg-blue-500";
                            if (isOverdue) {
                                statusColor = "bg-red-500/10 text-red-600 border-red-200/50";
                                iconColor = "bg-red-500";
                            } else if (isUrgent) {
                                statusColor = "bg-amber-500/10 text-amber-600 border-amber-200/50";
                                iconColor = "bg-amber-500";
                            }

                            return (
                                <div key={invoice.id} className="relative pl-10">
                                    {/* Timeline Dot */}
                                    <div className={`absolute left-[13px] top-3 h-3 w-3 rounded-full border-2 border-background ${iconColor} z-10`} />
                                    
                                    {/* Invoice Card */}
                                    <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors shadow-sm">
                                        
                                        {/* Left Side: Info */}
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold">#{invoice.id}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    (Due {formatDate(invoice.dueDate)})
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold">
                                                {parseFloat(invoice.amount).toFixed(2)} MATIC
                                            </p>
                                        </div>

                                        {/* Right Side: Enhanced Timer Badge */}
                                        <div className={`flex flex-col items-end justify-center px-3 py-1.5 rounded-md border ${statusColor}`}>
                                            <div className="flex items-center gap-1.5">
                                                {isOverdue ? <AlertCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                                                <span className="text-xs font-bold uppercase tracking-wider">
                                                    {isOverdue ? "Overdue" : "Time Left"}
                                                </span>
                                            </div>
                                            <span className="text-sm font-mono font-bold">
                                                {isOverdue 
                                                    ? `${Math.abs(Number(daysLeft))} Days Late` 
                                                    : `${daysLeft} Days`
                                                }
                                            </span>
                                        </div>

                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Recent Invoices Card */}
        <Card className="border-border/50 h-full">
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>Your recent invoice activity</CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-medium">No invoices yet</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  You haven't received any invoices yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {invoices.slice(0, 5).map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between border-b border-border/30 pb-3 last:border-0"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium font-mono text-xs">Invoice #{invoice.id}</p>
                      <p className="text-xs text-muted-foreground">MSME: {formatAddress(invoice.msme)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{parseFloat(invoice.amount).toFixed(2)} MATIC</p>
                      <p className={`text-xs ${invoice.status === 3 ? "text-green-500" : ""}`}>
                        {getStatusLabel(invoice.status)}
                      </p>
                    </div>
                  </div>
                ))}
                {invoices.length > 5 && (
                  <div className="text-center pt-2">
                    <Link href="/dashboard/bigbuyer/outstanding" className="text-sm text-primary hover:underline">
                      View all invoices →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}