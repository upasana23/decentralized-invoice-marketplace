"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Wallet, ArrowLeft, FileText, ExternalLink } from "lucide-react"
import { fetchAllInvoices, Invoice, getStatusLabel, calculateDaysRemaining } from "@/lib/invoice"
import { MSMEInvoiceChatWidget } from "@/components/marketplace/MSMEInvoiceChatWidget"

const PINATA_GATEWAY_BASE =
  process.env.NEXT_PUBLIC_PINATA_GATEWAY_BASE_URL || "https://gateway.pinata.cloud/ipfs/"

function getMetadataUrl(metadataURI: string): string {
  if (!metadataURI) return "#"
  if (metadataURI.startsWith("ipfs://")) {
    const cid = metadataURI.slice("ipfs://".length).split("/")[0]
    return PINATA_GATEWAY_BASE.endsWith("/") ? `${PINATA_GATEWAY_BASE}${cid}` : `${PINATA_GATEWAY_BASE}/${cid}`
  }
  return metadataURI
}

interface InvoiceMetadataFile {
  cid: string
  uri: string
  gatewayUrl: string
  type: string
  name: string
}

interface InvoiceMetadataInvoice {
  buyerAddress: string
  msmeAddress: string | null
  amount: string
  currency: string
  dueDate: string
  discountRate: string | null
  description: string | null
  externalId: string | null
}

interface InvoiceMetadata {
  version: number
  type: string
  createdAt: string
  invoice: InvoiceMetadataInvoice
  file: InvoiceMetadataFile
}

export default function MSMEInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const invoiceId = Number(id)

  const router = useRouter()
  const { address, isConnected } = useAccount()

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [metadata, setMetadata] = useState<InvoiceMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadInvoiceAndMetadata = async () => {
      if (invoiceId === null || Number.isNaN(invoiceId)) {
        setError("Invalid invoice id")
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const all = await fetchAllInvoices()
        const found = all.find((inv) => inv.id === invoiceId) || null

        if (!found) {
          setError("Invoice not found")
          setIsLoading(false)
          return
        }

        setInvoice(found)

        const metadataUrl = getMetadataUrl(found.metadataURI)
        if (metadataUrl === "#") {
          setIsLoading(false)
          return
        }

        const res = await fetch(metadataUrl)
        if (!res.ok) {
          setError("Failed to load invoice metadata from IPFS")
          setIsLoading(false)
          return
        }

        const json = (await res.json()) as InvoiceMetadata
        setMetadata(json)
      } catch (err) {
        console.error("Error loading invoice metadata:", err)
        setError("Unexpected error while loading invoice metadata")
      } finally {
        setIsLoading(false)
      }
    }

    loadInvoiceAndMetadata()
  }, [invoiceId])

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Wallet className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-medium">Connect your wallet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Connect your wallet to view your invoice details.
        </p>
      </div>
    )
  }

  if (isLoading || !invoice) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Button variant="ghost" className="flex items-center gap-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const daysRemaining = calculateDaysRemaining(invoice.dueDate)
  const statusLabel = getStatusLabel(invoice.status)

  const pdfUrl = metadata?.file?.gatewayUrl || ""
  const createdAt = metadata ? new Date(metadata.createdAt).toLocaleString() : null

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Button variant="ghost" className="flex items-center gap-2" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" /> Back to active invoices
      </Button>

      <Card className="border-border/50 bg-card/50">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">Invoice #{invoice.id}</CardTitle>
              <CardDescription>
                {metadata?.invoice.description || "View the on-chain invoice details and the original uploaded PDF."}
              </CardDescription>
            </div>
            <Badge variant={statusLabel === "Fundraising" ? "default" : "secondary"}>{statusLabel}</Badge>
          </div>
          {createdAt && (
            <p className="text-xs text-muted-foreground">Metadata created at {createdAt}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.45fr)]">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Invoice Amount</p>
                  <p className="text-lg font-semibold">{parseFloat(invoice.amount).toFixed(2)} MATIC</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Funded Amount</p>
                  <p className="text-lg font-semibold">{parseFloat(invoice.fundedAmount).toFixed(2)} MATIC</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Due Date</p>
                  <p className="text-lg font-semibold">{invoice.dueDate.toLocaleDateString()}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Days Remaining</p>
                  <p className={`text-lg font-semibold ${daysRemaining < 0 ? "text-destructive" : ""}`}>
                    {daysRemaining}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <p className="font-medium">Parties</p>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Buyer Address</p>
                  <p className="font-mono text-xs break-all">{metadata?.invoice.buyerAddress || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">MSME Address</p>
                  <p className="font-mono text-xs break-all">{metadata?.invoice.msmeAddress || "-"}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <p className="font-medium">Invoice Details</p>
                <p className="text-xs text-muted-foreground">Currency: {metadata?.invoice.currency || "MATIC"}</p>
                <p className="text-xs text-muted-foreground">
                  Discount Rate: {metadata?.invoice.discountRate ?? "N/A"}
                </p>
                <p className="text-xs text-muted-foreground">External ID: {metadata?.invoice.externalId ?? "N/A"}</p>
              </div>

              {pdfUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="mt-2 w-fit gap-2"
                  aria-label="Open invoice PDF in a new tab"
                >
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4" />
                    Open PDF in new tab
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              )}

              {metadata && (
                <div className="mt-4">
                  <p className="text-xs font-medium mb-1">Metadata (JSON)</p>
                  <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-[11px] leading-snug">
                    {JSON.stringify(metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="w-full h-[600px] border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
              {pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full border-0"
                  title="Invoice PDF"
                />
              ) : (
                <p className="text-sm text-muted-foreground px-4 text-center">
                  Invoice PDF preview is not available. Use the button on the left to open the document if provided.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {address && (
        <MSMEInvoiceChatWidget
          invoiceId={invoice.id}
          invoiceMsmeAddress={invoice.msme}
          currentMsmeAddress={address}
        />
      )}
    </div>
  )
}
