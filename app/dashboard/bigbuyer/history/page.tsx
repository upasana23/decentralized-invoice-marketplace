"use client"

import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle2, Wallet, FileText, DollarSign, TrendingUp, ArrowUpRight } from "lucide-react"
import { fetchInvoicesByBuyer, Invoice, getStatusLabel } from "@/lib/invoice"
import { useToast } from "@/components/ui/use-toast"

function formatAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export default function BigBuyerHistoryPage() {
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
        // Filter for repaid invoices only (status === 3)
        const repaid = buyerInvoices.filter((inv) => inv.status === 3)
        setInvoices(repaid)
      } catch (error) {
        console.error(error)
        toast({
          title: "Error",
          description: "Failed to load payment history",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadInvoices()
  }, [address, isConnected, toast])

  // Calculate stats from blockchain data
  const totalPayments = invoices.length
  const totalAmountPaid = invoices.reduce(
    (sum, inv) => sum + parseFloat(inv.amount),
    0
  )

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Wallet className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-medium">Connect your wallet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Connect your wallet to view payment history.
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
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
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
    <div className="min-h-screen bg-[#080808] relative overflow-hidden text-white selection:bg-orange-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/25 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[40%] bg-yellow-600/15 blur-[100px] rounded-full" />
      </div>

      <main className="relative z-10 p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">Payment History</h1>
          <p className="text-neutral-500 font-medium mt-1">Complete record of all invoice payments</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-3xl transition-all duration-300 hover:border-orange-500/50 hover:bg-white/[0.05] hover:shadow-[0_0_30px_rgba(234,88,12,0.15)] group p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 rounded-2xl bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                <CheckCircle2 className="size-6 text-orange-500" />
              </div>
              <ArrowUpRight className="size-5 text-neutral-600 group-hover:text-orange-400" />
            </div>
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Total Payments</p>
            <div className="text-3xl font-bold tracking-tighter text-white mt-2">{totalPayments}</div>
            <p className="text-xs text-neutral-500 mt-2">
              {totalPayments === 0 ? "No payments yet" : `${totalPayments} ${totalPayments === 1 ? "payment" : "payments"}`}
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-3xl transition-all duration-300 hover:border-orange-500/50 hover:bg-white/[0.05] hover:shadow-[0_0_30px_rgba(234,88,12,0.15)] group p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 rounded-2xl bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                <DollarSign className="size-6 text-orange-500" />
              </div>
              <ArrowUpRight className="size-5 text-neutral-600 group-hover:text-orange-400" />
            </div>
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Total Paid</p>
            <div className="text-3xl font-bold tracking-tighter text-white mt-2">{totalAmountPaid.toFixed(2)} MATIC</div>
            <p className="text-xs text-neutral-500 mt-2">All-time transaction volume</p>
          </div>

          <div className="relative overflow-hidden rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-3xl transition-all duration-300 hover:border-orange-500/50 hover:bg-white/[0.05] hover:shadow-[0_0_30px_rgba(234,88,12,0.15)] group p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 rounded-2xl bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                <TrendingUp className="size-6 text-orange-500" />
              </div>
              <ArrowUpRight className="size-5 text-neutral-600 group-hover:text-orange-400" />
            </div>
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Average Payment</p>
            <div className="text-3xl font-bold tracking-tighter text-white mt-2">
              {totalPayments > 0 ? (totalAmountPaid / totalPayments).toFixed(2) : "0.00"} MATIC
            </div>
            <p className="text-xs text-neutral-500 mt-2">Per invoice payment</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-3xl transition-all duration-300 hover:border-orange-500/50 hover:bg-white/[0.05] hover:shadow-[0_0_30px_rgba(234,88,12,0.15)] p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="size-2 rounded-full bg-orange-500 shadow-[0_0_10px_orange]" />
              <h3 className="text-xl font-bold tracking-tight text-white">Payment History</h3>
            </div>
            <Badge className="bg-orange-500/10 text-orange-500 border-none px-4 py-1">{totalPayments} Completed</Badge>
          </div>

          <div className="mt-6">
            {invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4 opacity-70">
                <FileText className="h-12 w-12 text-orange-500" />
                <h3 className="text-lg font-medium text-white">No payment history</h3>
                <p className="text-sm text-neutral-500 text-center max-w-md">
                  You haven't repaid any invoices yet.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-orange-500/10 bg-black/20 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-orange-500/20">
                      <TableHead className="text-orange-300">Invoice ID</TableHead>
                      <TableHead className="text-orange-300">MSME Address</TableHead>
                      <TableHead className="text-orange-300 text-right">Amount Paid</TableHead>
                      <TableHead className="text-orange-300">Due Date</TableHead>
                      <TableHead className="text-orange-300 text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id} className="border-b border-orange-500/10 hover:bg-black/30 transition-colors">
                        <TableCell className="font-medium font-mono text-xs text-white">#{invoice.id}</TableCell>
                        <TableCell className="font-mono text-xs text-orange-200">{formatAddress(invoice.msme)}</TableCell>
                        <TableCell className="text-right font-semibold text-white">
                          {parseFloat(invoice.amount).toFixed(2)} MATIC
                        </TableCell>
                        <TableCell className="text-orange-200">{invoice.dueDate.toLocaleDateString()}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1 text-green-400">
                            <CheckCircle2 className="size-4" />
                            <Badge variant="outline" className="border-green-500/40 text-green-400">
                              {getStatusLabel(invoice.status)}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
