"use client"

import { useEffect, useState } from "react"
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
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reputation</h2>
        <p className="text-muted-foreground">Your on-chain payment reliability and trust score</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="size-5 text-primary" />
              Buyer Reliability Score
            </CardTitle>
            <CardDescription>Based on payment history and punctuality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-6xl font-bold text-primary">{grade}</span>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Numeric Score</p>
                <p className="text-3xl font-bold">{reputationScore}</p>
                <p className="text-xs text-muted-foreground">out of 1000</p>
              </div>
            </div>
            <Progress value={(reputationScore / 1000) * 100} className="h-3" />
            <p className="text-sm text-muted-foreground">
              {totalInvoices === 0
                ? "No invoices yet"
                : `Based on ${totalInvoices} ${totalInvoices === 1 ? "invoice" : "invoices"}`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5 text-green-500" />
              Payment Summary
            </CardTitle>
            <CardDescription>Overview of your payment activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Invoices</span>
                <span className="text-sm font-semibold">{totalInvoices}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Repaid</span>
                <span className="text-sm font-semibold text-green-500">{repaidInvoices.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Defaulted</span>
                <span className="text-sm font-semibold text-red-500">{defaultedInvoices.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                <span className="text-sm font-semibold">{onTimeRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Success Rate</CardTitle>
            <CheckCircle2 className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onTimeRate}%</div>
            <p className="text-xs text-muted-foreground">
              {repaidInvoices.length} of {totalInvoices} {totalInvoices === 1 ? "invoice" : "invoices"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
            <p className="text-xs text-muted-foreground">All-time received</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repaid</CardTitle>
            <TrendingUp className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{repaidInvoices.length}</div>
            <p className="text-xs text-muted-foreground">Successfully paid</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MSMEs Served</CardTitle>
            <Award className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueMSMEs}</div>
            <p className="text-xs text-muted-foreground">Unique businesses</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Reputation Metrics</CardTitle>
          <CardDescription>Factors contributing to your buyer score</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {totalInvoices === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-2">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                No invoices yet. Your reputation will be calculated once you receive invoices.
              </p>
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Payment Success Rate</span>
                  <span className="text-sm font-semibold">{onTimeRate}%</span>
                </div>
                <Progress value={onTimeRate} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Total Invoices</span>
                  <span className="text-sm font-semibold">{totalInvoices}</span>
                </div>
                <Progress value={Math.min((totalInvoices / 100) * 100, 100)} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Reputation Score</span>
                  <span className="text-sm font-semibold">{reputationScore}/1000</span>
                </div>
                <Progress value={(reputationScore / 1000) * 100} className="h-2" />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
