"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useAccount, useWalletClient } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Eye, CreditCard, Wallet, FileText, ExternalLink } from "lucide-react"
import { fetchInvoicesByBuyer, Invoice, getStatusLabel, calculateDaysRemaining } from "@/lib/invoice"
import { useToast } from "@/components/ui/use-toast"
import { ethers } from "ethers"
import InvoiceMarketplaceABI from "@/lib/contracts/InvoiceMarketplace.json"

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string

const PINATA_GATEWAY_BASE =
  process.env.NEXT_PUBLIC_PINATA_GATEWAY_BASE_URL || "https://gateway.pinata.cloud/ipfs/"

function getInvoiceDocumentUrl(invoice: Invoice): string {
  const uri = invoice.metadataURI
  if (!uri) return "#"
  if (uri.startsWith("ipfs://")) {
    const cid = uri.slice("ipfs://".length).split("/")[0]
    return PINATA_GATEWAY_BASE.endsWith("/") ? `${PINATA_GATEWAY_BASE}${cid}` : `${PINATA_GATEWAY_BASE}/${cid}`
  }
  return uri
}

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

      let message = "Failed to repay invoice"

      if (error.code === 4001) {
        message = "Transaction was rejected"
      } else {
        const rawMessage = typeof error.message === "string" ? error.message : ""

        if (rawMessage && rawMessage.toLowerCase().includes("insufficient funds")) {
          message = "Insufficient funds for transaction"
        } else {
          const reasonMatch =
            rawMessage.match(/reason:\"([^\"]*)\"/) ||
            rawMessage.match(/reverted with reason string '([^']*)'/) ||
            []

          if (reasonMatch[1]) {
            message = reasonMatch[1]
          } else {
            const nestedMessage =
              error?.info?.error?.message ||
              error?.error?.message ||
              error?.shortMessage ||
              ""

            if (nestedMessage) {
              message = nestedMessage
            } else if (rawMessage && rawMessage.includes("Internal JSON-RPC error")) {
              message =
                "Transaction failed on-chain. Please double-check invoice status and the amount owed, then try again."
            } else if (rawMessage) {
              message = rawMessage
            }
          }
        }
      }

      toast({
        title: "Error",
        description: message,
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
    <div className="min-h-screen bg-[#050505] relative overflow-hidden text-white">
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#FF4D00] opacity-[0.08] blur-[120px]" />
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-[#FF8A00] opacity-[0.05] blur-[100px]" />

      <main className="relative z-10 p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 bg-clip-text text-transparent">
            Outstanding Invoices
          </h1>
          <p className="text-gray-400 mt-2">View and pay invoices owed to MSMEs</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-black/40 backdrop-blur-md border border-orange-500/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(255,77,0,0.05)] hover:shadow-[0_0_30px_rgba(255,77,0,0.15)] transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-400">Total Outstanding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-white">{totalOutstanding.toFixed(2)} MATIC</div>
              <p className="text-xs text-muted-foreground mt-1">
                {invoices.length} {invoices.length === 1 ? "invoice" : "invoices"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-md border border-orange-500/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(255,77,0,0.05)] hover:shadow-[0_0_30px_rgba(255,77,0,0.15)] transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-400">Fundraising</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-white">
                {invoices.filter((inv) => inv.status === 1).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting funding</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-md border border-orange-500/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(255,77,0,0.05)] hover:shadow-[0_0_30px_rgba(255,77,0,0.15)] transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-400">Funded</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-white">
                {invoices.filter((inv) => inv.status === 2).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Ready to repay</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-black/40 backdrop-blur-md border border-orange-500/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(255,77,0,0.05)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#FFD600]" />
              <span className="text-orange-400 font-bold">Invoices Awaiting Payment</span>
            </CardTitle>
            <CardDescription className="text-orange-300">
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
              <div className="rounded-lg border border-orange-500/10 bg-black/20 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-orange-500/20">
                      <TableHead className="text-orange-300">Invoice ID</TableHead>
                      <TableHead className="text-orange-300">MSME Address</TableHead>
                      <TableHead className="text-orange-300 text-right">Invoice Amount</TableHead>
                      <TableHead className="text-orange-300">Due Date</TableHead>
                      <TableHead className="text-orange-300 text-center">Days Remaining</TableHead>
                      <TableHead className="text-orange-300 text-center">Status</TableHead>
                      <TableHead className="text-orange-300 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => {
                      const daysRemaining = calculateDaysRemaining(invoice.dueDate)
                      const statusLabel = getStatusLabel(invoice.status)
                      const isLate = daysRemaining < 0 && invoice.status === 2
                      const canRepay = invoice.status === 2

                      return (
                        <TableRow key={invoice.id} className="border-b border-orange-500/10 hover:bg-black/30 transition-colors">
                          <TableCell className="font-medium font-mono text-xs text-white">#{invoice.id}</TableCell>
                          <TableCell className="font-mono text-xs text-orange-200">{formatAddress(invoice.msme)}</TableCell>
                          <TableCell className="text-right font-semibold text-white">
                            {parseFloat(invoice.amount).toFixed(2)} MATIC
                          </TableCell>
                          <TableCell className="text-orange-200">{invoice.dueDate.toLocaleDateString()}</TableCell>
                          <TableCell className="text-center">
                            <span className={isLate ? "text-red-400 font-semibold" : "text-orange-300"}>
                              {daysRemaining}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={isLate ? "destructive" : statusLabel === "Funded" ? "default" : "outline"} 
                                   className={`${isLate ? 'animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''}`}>
                              {isLate ? "Late" : statusLabel}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                asChild
                                title="Opens the original invoice uploaded by MSME for verification"
                                className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                              >
                                <a 
                                  href={getInvoiceDocumentUrl(invoice)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1"
                                >
                                  <FileText className="size-3" />
                                  View
                                  <ExternalLink className="size-2.5" />
                                </a>
                              </Button>
                              {canRepay && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleRepay(invoice.id)}
                                  disabled={repaying === invoice.id}
                                  className="shadow-[0_0_10px_rgba(255,138,0,0.3)] hover:shadow-[0_0_15px_rgba(255,138,0,0.5)]"
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
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
