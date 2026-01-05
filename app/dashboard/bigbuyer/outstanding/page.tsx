"use client"

import { useEffect, useState } from "react"
import { useAccount, useWalletClient } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Eye, CreditCard, Wallet, FileText } from "lucide-react"
import { fetchInvoicesByBuyer, Invoice, getStatusLabel, calculateDaysRemaining } from "@/lib/invoice"
import { useToast } from "@/components/ui/use-toast"
import { ethers } from "ethers"
import InvoiceMarketplaceABI from "@/lib/contracts/InvoiceMarketplace.json"

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string

function formatAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export default function BigBuyerOutstandingPage() {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [repaying, setRepaying] = useState<number | null>(null)
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
        // Filter for outstanding: Fundraising or Funded
        const outstanding = buyerInvoices.filter(
          (inv) => inv.status === 1 || inv.status === 2
        )
        setInvoices(outstanding)
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

  const handleRepay = async (invoiceId: number) => {
    if (!walletClient || !address) {
      toast({
        title: "Error",
        description: "Wallet not connected",
        variant: "destructive",
      })
      return
    }

    try {
      setRepaying(invoiceId)
      const provider = new ethers.BrowserProvider(walletClient as any)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        InvoiceMarketplaceABI.abi,
        signer
      )

      // Fetch latest on-chain invoice data to compute principal + yield
      const onchainInvoice = await contract.invoices(invoiceId)
      const principalWei: bigint = onchainInvoice.amount
      const discountRateBps: bigint = onchainInvoice.discountRate

      const tenThousand = BigInt(10000)
      const totalOwedWei = principalWei + (principalWei * discountRateBps) / tenThousand

      const tx = await contract.repayInvoice(invoiceId, { value: totalOwedWei })
      await tx.wait()

      toast({
        title: "Success",
        description: "Invoice repaid successfully",
      })

      // Reload invoices
      const buyerInvoices = await fetchInvoicesByBuyer(address!)
      const outstanding = buyerInvoices.filter(
        (inv) => inv.status === 1 || inv.status === 2
      )
      setInvoices(outstanding)
    } catch (error: any) {
      console.error("Repay error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to repay invoice",
        variant: "destructive",
      })
    } finally {
      setRepaying(null)
    }
  }

  const totalOutstanding = invoices.reduce(
    (sum, inv) => sum + parseFloat(inv.amount),
    0
  )

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Wallet className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-medium">Connect your wallet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Connect your wallet to view outstanding invoices.
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
        <h2 className="text-3xl font-bold tracking-tight">Outstanding Invoices</h2>
        <p className="text-muted-foreground">View and pay invoices owed to MSMEs</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOutstanding.toFixed(2)} MATIC</div>
            <p className="text-xs text-muted-foreground mt-1">
              {invoices.length} {invoices.length === 1 ? "invoice" : "invoices"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Fundraising</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoices.filter((inv) => inv.status === 1).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting funding</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Funded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoices.filter((inv) => inv.status === 2).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ready to repay</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Invoices Awaiting Payment</CardTitle>
          <CardDescription>
            Total outstanding: {totalOutstanding.toFixed(2)} MATIC across {invoices.length} {invoices.length === 1 ? "invoice" : "invoices"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">No outstanding invoices</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                You don't have any invoices that require payment.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>MSME Address</TableHead>
                  <TableHead className="text-right">Invoice Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-center">Days Remaining</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const daysRemaining = calculateDaysRemaining(invoice.dueDate)
                  const statusLabel = getStatusLabel(invoice.status)
                  const isLate = daysRemaining < 0 && invoice.status === 2
                  const canRepay = invoice.status === 2

                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium font-mono text-xs">#{invoice.id}</TableCell>
                      <TableCell className="font-mono text-xs">{formatAddress(invoice.msme)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {parseFloat(invoice.amount).toFixed(2)} MATIC
                      </TableCell>
                      <TableCell>{invoice.dueDate.toLocaleDateString()}</TableCell>
                      <TableCell className="text-center">
                        <span className={isLate ? "text-red-500 font-semibold" : ""}>
                          {daysRemaining}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={isLate ? "destructive" : statusLabel === "Funded" ? "default" : "outline"}>
                          {isLate ? "Late" : statusLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {canRepay && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleRepay(invoice.id)}
                              disabled={repaying === invoice.id}
                            >
                              <CreditCard className="size-3 mr-1" />
                              {repaying === invoice.id ? "Repaying..." : "Repay"}
                            </Button>
                          )}
                        </div>
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
