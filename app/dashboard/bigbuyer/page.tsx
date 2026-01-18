"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useAccount } from "wagmi"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, AlertCircle, TrendingUp, Users, Award, Shield, Calendar, DollarSign, ArrowUpRight } from "lucide-react"
import { fetchInvoicesByBuyer, Invoice, getStatusLabel, calculateDaysRemaining } from "@/lib/invoice"
import { useToast } from "@/components/ui/use-toast"

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
        toast({ title: "Error", description: "Failed to load invoices", variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }
    loadInvoices()
  }, [address, isConnected, toast])

  const totalInvoices = invoices.length
  const approvedInvoices = invoices.filter(inv => inv.status >= 1).length
  const paidInvoices = invoices.filter(inv => inv.status === 3).length
  const onTimePaymentRate = totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 0
  const uniqueMSMEs = [...new Set(invoices.map(inv => inv.msme))].length
  
  const getTrustBadge = () => {
    if (onTimePaymentRate >= 95 && totalInvoices >= 10) return { level: "Gold", color: "bg-yellow-500", glow: "shadow-[0_0_15px_rgba(234,179,8,0.4)]" }
    if (onTimePaymentRate >= 85 && totalInvoices >= 5) return { level: "Silver", color: "bg-gray-400", glow: "" }
    return { level: "Risk", color: "bg-red-600", glow: "shadow-[0_0_15px_rgba(220,38,38,0.5)] animate-pulse" }
  }

  const trustBadge = getTrustBadge()
  const pendingApprovals = invoices.filter(inv => inv.status === 0 || inv.status === 1)

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 bg-[#080808] min-h-screen">
        <Skeleton className="h-10 w-1/4 bg-white/5" />
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl bg-white/5" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white selection:bg-orange-500/30">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/25 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[40%] bg-yellow-600/15 blur-[100px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-[1600px] mx-auto p-8 space-y-10">
        {/* Header Section */}
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white uppercase italic">
              Invoice Responsibility and Trust Manager
            </h1>
            <p className="text-neutral-500 font-medium mt-1">Real-time reputation & invoice analytics</p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10">Export Data</Button>
             <Button className="bg-orange-600 hover:bg-orange-500 shadow-[0_0_20px_rgba(234,88,12,0.3)]">New Invoice</Button>
          </div>
        </header>

        {/* Top 4 Stat Cards */}
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Approved Invoices", value: approvedInvoices, icon: CheckCircle, sub: `${totalInvoices} Total` },
            { label: "Payment Rate", value: `${onTimePaymentRate}%`, icon: TrendingUp, sub: "On-time delivery" },
            { label: "Active Partners", value: uniqueMSMEs, icon: Users, sub: "Verified MSMEs" },
            { label: "Trust Score", value: trustBadge.level, icon: Award, sub: "Current Status", customColor: true },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className="group relative p-6 rounded-[2rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl transition-all hover:border-orange-500/40 hover:bg-white/[0.05]"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 rounded-2xl bg-white/5 group-hover:bg-orange-500/10 transition-colors">
                  <stat.icon className="size-5 text-orange-500" />
                </div>
                <ArrowUpRight className="size-4 text-neutral-600 group-hover:text-orange-400" />
              </div>
              <p className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">{stat.label}</p>
              <div className="flex items-center gap-2 mt-1">
                {stat.customColor && <div className={`size-3 rounded-full ${trustBadge.color} ${trustBadge.glow}`} />}
                <h2 className="text-3xl font-bold tracking-tighter">{stat.value}</h2>
              </div>
              <p className="text-xs text-neutral-500 mt-2 font-medium">{stat.sub}</p>
            </motion.div>
          ))}
        </section>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Approval Panel */}
          <section className="lg:col-span-2 space-y-6">
            <div className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-2xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="size-2 rounded-full bg-orange-500 shadow-[0_0_10px_orange]" />
                  <h3 className="text-xl font-bold tracking-tight">Pending Approvals</h3>
                </div>
                <Badge className="bg-orange-500/10 text-orange-500 border-none px-4 py-1">Action Required</Badge>
              </div>

              {pendingApprovals.length === 0 ? (
                <div className="py-20 text-center space-y-3 opacity-40">
                  <CheckCircle className="size-12 mx-auto text-orange-500" />
                  <p className="text-lg font-medium">All caught up! No pending tasks.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingApprovals.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-orange-500/20 transition-all group">
                       <div className="flex items-center gap-4">
                          <div className="size-12 rounded-xl bg-orange-600/20 flex items-center justify-center font-bold text-orange-500">#</div>
                          <div>
                            <p className="font-bold text-white leading-none mb-1">{parseFloat(inv.amount).toFixed(2)} MATIC</p>
                            <p className="text-xs text-neutral-500">{formatAddress(inv.msme)} • Due {formatDate(inv.dueDate)}</p>
                          </div>
                       </div>
                       <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" className="bg-white text-black hover:bg-orange-500 hover:text-white rounded-full px-6 transition-all">Approve</Button>
                          <Button size="icon" variant="ghost" className="rounded-full text-neutral-500 hover:text-red-500 hover:bg-red-500/10"><XCircle className="size-5" /></Button>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Sidebar Area: MSME Relationships & Schedule */}
          <aside className="space-y-8">
             <div className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Users className="size-5 text-orange-500" /> 
                  Top Partners
                </h3>
                <div className="space-y-6">
                  {Object.entries(invoices.reduce((acc: any, inv) => {
                    acc[inv.msme] = (acc[inv.msme] || 0) + 1; return acc;
                  }, {})).slice(0, 3).map(([msme, count]: any) => (
                    <div key={msme} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-gradient-to-br from-orange-500 to-yellow-600 p-[1px]">
                           <div className="size-full rounded-full bg-[#080808] flex items-center justify-center text-[10px] font-bold">
                             {msme.slice(2, 4).toUpperCase()}
                           </div>
                        </div>
                        <div>
                          <p className="text-sm font-bold">{formatAddress(msme)}</p>
                          <p className="text-[10px] text-neutral-500 uppercase font-black">{count} Invoices</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-orange-500/30 text-orange-400 text-[10px]">Verified</Badge>
                    </div>
                  ))}
                </div>
             </div>

             <div className="p-6 rounded-[2rem] bg-gradient-to-br from-orange-600 to-red-700 shadow-[0_20px_40px_rgba(234,88,12,0.2)]">
                <h3 className="text-lg font-bold text-white mb-2">Reputation Level</h3>
                <p className="text-white/70 text-sm mb-4">Maintain a 90%+ rate to unlock lower collateral fees.</p>
                <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white shadow-[0_0_10px_white]" style={{ width: `${onTimePaymentRate}%` }} />
                </div>
                <p className="text-right text-[10px] font-black text-white mt-2 uppercase tracking-tighter">
                  {onTimePaymentRate}% Accuracy
                </p>
             </div>
          </aside>
        </div>
      </main>
    </div>
  )
}