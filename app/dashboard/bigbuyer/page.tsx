"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useAccount } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, AlertCircle, TrendingUp, Users, Award, Shield, Calendar, DollarSign } from "lucide-react"
import { fetchInvoicesByBuyer, Invoice, getStatusLabel, calculateDaysRemaining } from "@/lib/invoice"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

function formatAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function formatDate(timestamp: any) {
    if (!timestamp) return "N/A"
    const date = new Date(Number(timestamp) * 1000) 
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function BigBuyerDashboard() {
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

  // Calculate reputation metrics
  const totalInvoices = invoices.length
  const approvedInvoices = invoices.filter(inv => inv.status >= 1).length
  const paidInvoices = invoices.filter(inv => inv.status === 3).length
  const onTimePaymentRate = totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 0
  
  // Get unique MSMEs worked with
  const uniqueMSMEs = [...new Set(invoices.map(inv => inv.msme))].length
  
  // Determine trust badge
  const getTrustBadge = () => {
    if (onTimePaymentRate >= 95 && totalInvoices >= 10) return { level: "Gold", color: "bg-yellow-500", textColor: "text-yellow-600" }
    if (onTimePaymentRate >= 85 && totalInvoices >= 5) return { level: "Silver", color: "bg-gray-400", textColor: "text-gray-600" }
    return { level: "Risk", color: "bg-red-500", textColor: "text-red-600" }
  }

  const trustBadge = getTrustBadge()

  // Pending invoice approvals (status 0 or 1)
  const pendingApprovals = invoices.filter(inv => inv.status === 0 || inv.status === 1)

  // Payment schedule timeline
  const paymentSchedule = invoices
    .filter(inv => inv.status === 1 || inv.status === 2)
    .sort((a, b) => Number(a.dueDate) - Number(b.dueDate))
    .slice(0, 8)

  // MSME relationship summary
  const msmeRelationships = invoices.reduce((acc, invoice) => {
    const msme = invoice.msme
    if (!acc[msme]) {
      acc[msme] = {
        invoiceCount: 0,
        totalValue: 0,
        paidCount: 0,
        avgDelay: 0
      }
    }
    acc[msme].invoiceCount++
    acc[msme].totalValue += parseFloat(invoice.amount)
    if (invoice.status === 3) acc[msme].paidCount++
    return acc
  }, {} as Record<string, any>)

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Shield className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-medium">Connect your wallet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Connect your wallet to manage your invoice responsibilities and reputation.
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
    <div className="min-h-screen bg-[#050505] relative overflow-hidden text-white">
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#FF4D00] opacity-[0.08] blur-[120px]" />
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-[#FF8A00] opacity-[0.05] blur-[100px]" />

      <main className="relative z-10 p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 bg-clip-text text-transparent">
            Invoice Responsibility & Trust Manager
          </h1>
          <p className="text-gray-400 mt-2">Manage your buyer reputation and invoice responsibilities</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="relative overflow-hidden rounded-2xl bg-neutral-900/50 border border-white/10 hover:border-orange-500/50 transition-all shadow-[inset_0_0_12px_rgba(255,77,0,0.05)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-transparent to-black/40" />
            <div className="relative z-10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-orange-400">Invoices Approved</h3>
                <CheckCircle className="size-4 text-[#FFD600]" />
              </div>
              <div className="text-2xl font-extrabold">{approvedInvoices}</div>
              <p className="text-xs text-muted-foreground">{approvedInvoices === 0 ? "No approvals yet" : `${approvedInvoices} approved`}</p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="relative overflow-hidden rounded-2xl bg-neutral-900/50 border border-white/10 hover:border-orange-500/50 transition-all shadow-[inset_0_0_12px_rgba(255,77,0,0.05)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-transparent to-black/40" />
            <div className="relative z-10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-orange-400">Paid On Time</h3>
                <TrendingUp className="size-4 text-[#FFD600]" />
              </div>
              <div className="text-2xl font-extrabold">{onTimePaymentRate}%</div>
              <p className="text-xs text-muted-foreground">{paidInvoices} of {totalInvoices} invoices</p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="relative overflow-hidden rounded-2xl bg-neutral-900/50 border border-white/10 hover:border-orange-500/50 transition-all shadow-[inset_0_0_12px_rgba(255,77,0,0.05)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-transparent to-black/40" />
            <div className="relative z-10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-orange-400">MSMEs Worked With</h3>
                <Users className="size-4 text-[#FFD600]" />
              </div>
              <div className="text-2xl font-extrabold">{uniqueMSMEs}</div>
              <p className="text-xs text-muted-foreground">{uniqueMSMEs === 0 ? "No partnerships yet" : `${uniqueMSMEs} partners`}</p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="relative overflow-hidden rounded-2xl bg-neutral-900/50 border border-white/10 hover:border-orange-500/50 transition-all shadow-[inset_0_0_12px_rgba(255,77,0,0.05)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-transparent to-black/40" />
            <div className="relative z-10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-orange-400">Trust Badge</h3>
                <Award className="size-4 text-[#FFD600]" />
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${trustBadge.color} ${trustBadge.level === 'Risk' ? 'animate-pulse' : ''}`} />
                <div className={`text-2xl font-extrabold ${trustBadge.textColor}`}>{trustBadge.level}</div>
              </div>
              <p className="text-xs text-muted-foreground">Based on payment history</p>
            </div>
          </motion.div>
        </div>

        <div className="bg-neutral-900/30 rounded-3xl p-10 border border-white/5">
          <div className="flex items-center gap-2 mb-6">
            <AlertCircle className="h-5 w-5 text-[#FFD600]" />
            <h2 className="text-xl font-bold text-orange-400">Pending Invoice Approvals</h2>
          </div>
          <p className="text-orange-300 mb-6">Approve invoices to trigger investor confidence</p>

          {pendingApprovals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <CheckCircle className="h-10 w-10 mb-3 text-green-500/50" />
              <p>No pending approvals</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-4 text-sm font-medium text-orange-300 border-b border-orange-500/20 pb-2">
                <div>Invoice</div>
                <div>MSME</div>
                <div>Amount</div>
                <div>Due Date</div>
                <div>Action</div>
              </div>
              {pendingApprovals.map((invoice) => {
                const daysLeft = calculateDaysRemaining(invoice.dueDate)
                return (
                  <div key={invoice.id} className="grid grid-cols-5 gap-4 items-center py-3 border-b border-orange-500/10">
                    <div className="font-mono text-sm text-white">#{invoice.id}</div>
                    <div className="text-sm text-orange-200">{formatAddress(invoice.msme)}</div>
                    <div className="font-semibold text-white">{parseFloat(invoice.amount).toFixed(2)} MATIC</div>
                    <div className="text-sm">
                      <span className={daysLeft < 0 ? "text-red-400" : "text-orange-300"}>{formatDate(invoice.dueDate)}</span>
                      <div className="text-xs text-muted-foreground">{daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days`}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive" className="shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-black/40 backdrop-blur-md border border-orange-500/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(255,77,0,0.05)]">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-[#FFD600]" />
              <h2 className="text-lg font-bold text-orange-400">Payment Schedule</h2>
            </div>
            {paymentSchedule.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <CheckCircle className="h-10 w-10 mb-3 text-green-500/50" />
                <p>No payment schedule</p>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentSchedule.map((invoice) => {
                  const isPaid = invoice.status === 3
                  const isOverdue = invoice.status === 2
                  const daysLeft = calculateDaysRemaining(invoice.dueDate)
                  return (
                    <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg border border-orange-500/10 bg-black/20 hover:bg-black/30 transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          isPaid ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" :
                          isOverdue ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse" :
                          "bg-orange-500 shadow-[0_0_8px_rgba(255,138,0,0.5)]"
                        }`} />
                        <div>
                          <div className="font-medium text-sm text-white">#{invoice.id}</div>
                          <div className="text-xs text-orange-200">{formatAddress(invoice.msme)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-white">{parseFloat(invoice.amount).toFixed(2)} MATIC</div>
                        <div className={`text-xs ${isPaid ? "text-green-400" : isOverdue ? "text-red-400" : "text-orange-400"}`}>
                          {isPaid ? "Paid ✓" : isOverdue ? "Overdue" : `Due in ${daysLeft} days`}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="bg-black/40 backdrop-blur-md border border-orange-500/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(255,77,0,0.05)]">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-[#FFD600]" />
              <h2 className="text-lg font-bold text-orange-400">MSME Relationships</h2>
            </div>
            {Object.keys(msmeRelationships).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Users className="h-10 w-10 mb-3 text-muted-foreground/50" />
                <p>No MSME relationships yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(msmeRelationships).slice(0, 5).map(([msme, data]: [string, any]) => {
                  const paymentRate = data.invoiceCount > 0 ? (data.paidCount / data.invoiceCount) * 100 : 0
                  const riskLevel = paymentRate >= 90 ? "Low" : paymentRate >= 70 ? "Medium" : "High"
                  const riskColor = paymentRate >= 90 ? "bg-green-500" : paymentRate >= 70 ? "bg-yellow-500" : "bg-red-500"
                  return (
                    <div key={msme} className="flex items-center justify-between p-3 rounded-lg border border-orange-500/10 bg-black/20 hover:bg-black/30 transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                          <Users className="h-4 w-4 text-[#FFD600]" />
                        </div>
                        <div>
                          <div className="font-medium text-sm text-white">{formatAddress(msme)}</div>
                          <div className="text-xs text-orange-200">{data.invoiceCount} invoices • {parseFloat(data.totalValue).toFixed(2)} MATIC total</div>
                        </div>
                      </div>
                      <Badge variant="outline" className={`${riskColor} text-white border-0 text-xs ${riskLevel === 'High' ? 'animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''}`}>
                        {riskLevel} Risk
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}