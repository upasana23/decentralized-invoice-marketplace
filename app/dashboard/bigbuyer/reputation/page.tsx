"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useAccount } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Award, TrendingUp, Clock, CheckCircle2, Wallet, FileText } from "lucide-react"
import { fetchInvoicesByBuyer, Invoice, getStatusLabel, calculateDaysRemaining } from "@/lib/invoice"
import { useToast } from "@/components/ui/use-toast"

export default function BigBuyerReputationPage() {
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
          description: "Failed to load reputation data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadInvoices()
  }, [address, isConnected, toast])

  // Calculate reputation metrics from blockchain data
  const totalInvoices = invoices.length
  const repaidInvoices = invoices.filter((inv) => inv.status === 3)
  const defaultedInvoices = invoices.filter((inv) => inv.status === 4)
  const onTimeRate = totalInvoices > 0 ? Math.round((repaidInvoices.length / totalInvoices) * 100) : 0
  
  // Calculate unique MSMEs
  const uniqueMSMEs = new Set(invoices.map((inv) => inv.msme.toLowerCase())).size

  // Calculate reputation score (0-1000, simple formula)
  const reputationScore = totalInvoices > 0
    ? Math.round((repaidInvoices.length / totalInvoices) * 1000)
    : 0

  // Grade mapping
  const getGrade = (score: number) => {
    if (score >= 950) return "A+"
    if (score >= 900) return "A"
    if (score >= 850) return "B+"
    if (score >= 800) return "B"
    if (score >= 750) return "C+"
    if (score >= 700) return "C"
    return "D"
  }

  const grade = getGrade(reputationScore)

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Wallet className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-medium">Connect your wallet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Connect your wallet to view your reputation metrics.
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
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="border-border/50">
              <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
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
            Reputation
          </h1>
          <p className="text-gray-400 mt-2">Your on-chain payment reliability and trust score</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-black/40 backdrop-blur-md border border-orange-500/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(255,77,0,0.05)] hover:shadow-[0_0_30px_rgba(255,77,0,0.15)] transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="size-5 text-[#FFD600]" />
                <span className="text-orange-400 font-bold">Buyer Reliability Score</span>
              </CardTitle>
              <CardDescription className="text-orange-300">Based on payment history and punctuality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-6xl font-extrabold text-white">{grade}</span>
                <div className="text-right">
                  <p className="text-sm text-orange-200">Numeric Score</p>
                  <p className="text-3xl font-extrabold text-white">{reputationScore}</p>
                  <p className="text-xs text-muted-foreground">out of 1000</p>
                </div>
              </div>
              <Progress value={(reputationScore / 1000) * 100} className="h-3" />
              <p className="text-sm text-orange-300">
                {totalInvoices === 0
                  ? "No invoices yet"
                  : `Based on ${totalInvoices} ${totalInvoices === 1 ? "invoice" : "invoices"}`}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-md border border-orange-500/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(255,77,0,0.05)] hover:shadow-[0_0_30px_rgba(255,77,0,0.15)] transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-5 text-[#FFD600]" />
                <span className="text-orange-400 font-bold">Payment Summary</span>
              </CardTitle>
              <CardDescription className="text-orange-300">Overview of your payment activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-orange-200">Total Invoices</span>
                <span className="text-sm font-semibold text-white">{totalInvoices}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-orange-200">Repaid</span>
                <span className="text-sm font-semibold text-green-400">{repaidInvoices.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-orange-200">Defaulted</span>
                <span className="text-sm font-semibold text-red-400">{defaultedInvoices.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-orange-200">Success Rate</span>
                <span className="text-sm font-semibold text-white">{onTimeRate}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-black/40 backdrop-blur-md border border-orange-500/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(255,77,0,0.05)] hover:shadow-[0_0_30px_rgba(255,77,0,0.15)] transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-400">Payment Success Rate</CardTitle>
              <CheckCircle2 className="size-4 text-[#FFD600]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-white">{onTimeRate}%</div>
              <p className="text-xs text-muted-foreground">
                {repaidInvoices.length} of {totalInvoices} {totalInvoices === 1 ? "invoice" : "invoices"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-md border border-orange-500/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(255,77,0,0.05)] hover:shadow-[0_0_30px_rgba(255,77,0,0.15)] transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-400">Total Invoices</CardTitle>
              <FileText className="size-4 text-[#FFD600]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-white">{totalInvoices}</div>
              <p className="text-xs text-muted-foreground">All-time received</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-md border border-orange-500/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(255,77,0,0.05)] hover:shadow-[0_0_30px_rgba(255,77,0,0.15)] transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-400">Repaid</CardTitle>
              <TrendingUp className="size-4 text-[#FFD600]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-green-400">{repaidInvoices.length}</div>
              <p className="text-xs text-muted-foreground">Successfully paid</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-md border border-orange-500/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(255,77,0,0.05)] hover:shadow-[0_0_30px_rgba(255,77,0,0.15)] transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-400">MSMEs Served</CardTitle>
              <Award className="size-4 text-[#FFD600]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-white">{uniqueMSMEs}</div>
              <p className="text-xs text-muted-foreground">Unique businesses</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-black/40 backdrop-blur-md border border-orange-500/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(255,77,0,0.05)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-[#FFD600]" />
              <span className="text-orange-400 font-bold">Reputation Metrics</span>
            </CardTitle>
            <CardDescription className="text-orange-300">Factors contributing to your buyer score</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {totalInvoices === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-2">
                <FileText className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-orange-200 text-center">
                  No invoices yet. Your reputation will be calculated once you receive invoices.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-orange-200">Payment Success Rate</span>
                    <span className="text-sm font-semibold text-white">{onTimeRate}%</span>
                  </div>
                  <Progress value={onTimeRate} className="h-3" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-orange-200">Total Invoices</span>
                    <span className="text-sm font-semibold text-white">{totalInvoices}</span>
                  </div>
                  <Progress value={Math.min((totalInvoices / 100) * 100, 100)} className="h-3" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-orange-200">Reputation Score</span>
                    <span className="text-sm font-semibold text-white">{reputationScore}/1000</span>
                  </div>
                  <Progress value={(reputationScore / 1000) * 100} className="h-3" />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
