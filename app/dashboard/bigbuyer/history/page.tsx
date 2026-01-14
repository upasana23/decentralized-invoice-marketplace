"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useAccount } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle2, Wallet, FileText, ExternalLink } from "lucide-react"
import { fetchInvoicesByBuyer, Invoice, getStatusLabel } from "@/lib/invoice"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"

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
    <div className="min-h-screen bg-[#050505] relative overflow-hidden text-white">
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#FF4D00] opacity-[0.08] blur-[120px]" />
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-[#FF8A00] opacity-[0.05] blur-[100px]" />

      <main className="relative z-10 p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 bg-clip-text text-transparent">
            Payment History
          </h1>
          <p className="text-gray-400 mt-2">Complete record of all invoice payments</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-black/40 backdrop-blur-md border border-orange-500/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(255,77,0,0.05)] hover:shadow-[0_0_30px_rgba(255,77,0,0.15)] transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-400">Total Payments Made</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-white">{totalPayments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalPayments === 0 ? "No payments yet" : `${totalPayments} ${totalPayments === 1 ? "payment" : "payments"}`}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-md border border-orange-500/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(255,77,0,0.05)] hover:shadow-[0_0_30px_rgba(255,77,0,0.15)] transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-400">Total Amount Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-white">{totalAmountPaid.toFixed(2)} MATIC</div>
              <p className="text-xs text-muted-foreground mt-1">All-time transaction volume</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-md border border-orange-500/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(255,77,0,0.05)] hover:shadow-[0_0_30px_rgba(255,77,0,0.15)] transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-400">Average Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-white">
                {totalPayments > 0 ? (totalAmountPaid / totalPayments).toFixed(2) : "0.00"} MATIC
              </div>
              <p className="text-xs text-muted-foreground mt-1">Per invoice payment</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-black/40 backdrop-blur-md border border-orange-500/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(255,77,0,0.05)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[#FFD600]" />
              <span className="text-orange-400 font-bold">Payment History</span>
            </CardTitle>
            <CardDescription className="text-orange-300">All completed invoice payments</CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-medium">No payment history</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
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
                      <TableHead className="text-orange-300 text-right">Actions</TableHead>
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
                          <div className="flex items-center justify-center gap-1">
                            <CheckCircle2 className="size-4 text-green-400" />
                            <Badge variant="outline" className="border-green-500 text-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]">
                              {getStatusLabel(invoice.status)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            title="Opens the original invoice uploaded by MSME for verification"
                            className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                          >
                            <a 
                              href={`https://ipfs.io/ipfs/sample-invoice-${invoice.id}.pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1"
                            >
                              <FileText className="size-3" />
                              View
                              <ExternalLink className="size-2.5" />
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
