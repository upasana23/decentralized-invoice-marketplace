"use client"

import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Filter, Clock, Landmark, FileText, Wallet } from "lucide-react"
import { fetchFundraisingInvoices, Invoice, getStatusLabel, calculateDaysRemaining } from "@/lib/invoice"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

function formatAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export default function InvoiceMarketplace() {
  const { isConnected } = useAccount()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        setIsLoading(true)
        const fundraisingInvoices = await fetchFundraisingInvoices()
        setInvoices(fundraisingInvoices)
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
  }, [toast])

  const filteredInvoices = invoices.filter((inv) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      inv.id.toString().toLowerCase().includes(searchLower) ||
      inv.msme.toLowerCase().includes(searchLower) ||
      inv.buyer.toLowerCase().includes(searchLower)
    )
  })

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Wallet className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-medium">Connect your wallet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Connect your wallet to view available invoices to invest in.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoice Marketplace</h1>
          <p className="text-muted-foreground">Discover and fund tokenized RWA invoices.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search issuers or ratings..."
              className="pl-9 w-[250px] bg-background/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="size-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-border/50">
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredInvoices.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">No invoices available</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {search
                ? "No invoices match your search criteria."
                : "There are currently no invoices available for investment. Check back later."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {filteredInvoices.map((invoice) => {
            const daysRemaining = calculateDaysRemaining(invoice.dueDate)
            const fundingProgress = parseFloat(invoice.fundedAmount) / parseFloat(invoice.amount)
            const progressPercent = Math.min(fundingProgress * 100, 100)

            return (
              <Card
                key={invoice.id}
                className="border-border/50 bg-card/50 hover:border-primary/50 transition-colors group"
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">Invoice #{invoice.id}</CardTitle>
                      <CardDescription className="font-mono text-xs">
                        MSME: {formatAddress(invoice.msme)}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      {getStatusLabel(invoice.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-background/50 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Landmark className="size-3" /> Face Value
                      </p>
                      <p className="text-xl font-bold">{parseFloat(invoice.amount).toFixed(2)} MATIC</p>
                    </div>
                    <div className="p-3 rounded-lg bg-background/50 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">Funded</p>
                      <p className="text-xl font-bold">{parseFloat(invoice.fundedAmount).toFixed(2)} MATIC</p>
                      <p className="text-xs text-muted-foreground mt-1">{progressPercent.toFixed(1)}% funded</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Funding Progress</span>
                      <span>{progressPercent.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground text-[10px] uppercase">Due Date</span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" /> {invoice.dueDate.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground text-[10px] uppercase">Days Remaining</span>
                      <span className={daysRemaining < 0 ? "text-red-500 font-semibold" : ""}>
                        {daysRemaining} days
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">
                      Buyer: {formatAddress(invoice.buyer)}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button className="w-full group-hover:scale-[1.01] transition-transform" asChild>
                    <Link href={`/dashboard/investor/invest/${invoice.id}`}>Invest Now</Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
