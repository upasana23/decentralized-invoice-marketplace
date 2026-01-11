"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useWalletClient } from "wagmi";
import { ethers } from "ethers";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Wallet, ArrowLeft, FileText, ExternalLink, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { fetchAllInvoices, Invoice, getStatusLabel, calculateDaysRemaining } from "@/lib/invoice";
import InvoiceMarketplaceABI from "@/lib/contracts/InvoiceMarketplace.json";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string;

const PINATA_GATEWAY_BASE =
  process.env.NEXT_PUBLIC_PINATA_GATEWAY_BASE_URL || "https://gateway.pinata.cloud/ipfs/";

function getInvoiceDocumentUrl(invoice: Invoice): string {
  const uri = invoice.metadataURI;
  if (!uri) return "#";
  if (uri.startsWith("ipfs://")) {
    const cid = uri.slice("ipfs://".length).split("/")[0];
    return PINATA_GATEWAY_BASE.endsWith("/")
      ? `${PINATA_GATEWAY_BASE}${cid}`
      : `${PINATA_GATEWAY_BASE}/${cid}`;
  }
  return uri;
}

export default function InvestorInvestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const invoiceId = Number(id);

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { toast } = useToast();
  const router = useRouter();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    const loadInvoice = async () => {
      if (invoiceId === null || Number.isNaN(invoiceId)) return;

      try {
        setIsLoading(true);
        const all = await fetchAllInvoices();
        const found = all.find((inv) => inv.id === invoiceId) || null;
        setInvoice(found);
      } catch (error) {
        console.error("Error loading invoice:", error);
        toast({
          title: "Error",
          description: "Failed to load invoice details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoice();
  }, [invoiceId, toast]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Wallet className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-medium">Connect your wallet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Connect your wallet to invest in this invoice.
        </p>
      </div>
    );
  }

  if (isLoading || !invoice) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" className="flex items-center gap-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Card className="border-border/50">
          <CardHeader>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const remainingToFund = Math.max(
    0,
    parseFloat(invoice.amount) - parseFloat(invoice.fundedAmount)
  );

  const daysRemaining = calculateDaysRemaining(invoice.dueDate);
  const statusLabel = getStatusLabel(invoice.status);

  const invoiceDocumentUrl = getInvoiceDocumentUrl(invoice);

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!walletClient || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to invest.",
        variant: "destructive",
      });
      return;
    }

    if (!CONTRACT_ADDRESS) {
      toast({
        title: "Configuration error",
        description: "Contract address is not configured.",
        variant: "destructive",
      });
      return;
    }

    const valueNumber = Number(amount);
    if (!valueNumber || valueNumber <= 0) {
      toast({
        title: "Invalid amount",
        description: "Enter a valid investment amount.",
        variant: "destructive",
      });
      return;
    }

    if (valueNumber > remainingToFund) {
      toast({
        title: "Amount too high",
        description: "Investment exceeds remaining funding required.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const provider = new ethers.BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        InvoiceMarketplaceABI.abi,
        signer
      );

      const valueWei = ethers.parseEther(amount);
      const tx = await contract.investInInvoice(invoiceId as number, { value: valueWei });
      await tx.wait();

      toast({
        title: "Investment successful",
        description: `You invested ${amount} MATIC into Invoice #${invoiceId}.`,
      });

      router.push("/dashboard/investor/portfolio");
    } catch (error: any) {
      console.error("Investment error:", error);

      let message = "Failed to complete investment";

      if (error.code === 4001) {
        message = "Transaction was rejected";
      } else {
        const rawMessage = typeof error.message === "string" ? error.message : "";

        if (rawMessage && rawMessage.toLowerCase().includes("insufficient funds")) {
          message = "Insufficient funds for transaction";
        } else {
          const reasonMatch =
            rawMessage.match(/reason:\"([^\"]*)\"/) ||
            rawMessage.match(/reverted with reason string '([^']*)'/) ||
            [];

          if (reasonMatch[1]) {
            message = reasonMatch[1];
          } else {
            const nestedMessage =
              error?.info?.error?.message ||
              error?.error?.message ||
              error?.shortMessage ||
              "";

            if (nestedMessage) {
              message = nestedMessage;
            } else if (rawMessage && rawMessage.includes("Internal JSON-RPC error")) {
              message =
                "Transaction failed on-chain. Please double-check the invoice status and your investment amount, then try again.";
            } else if (rawMessage) {
              message = rawMessage;
            }
          }
        }
      }

      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Button variant="ghost" className="flex items-center gap-2" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" /> Back to marketplace
      </Button>

      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Invoice #{invoice.id}</h2>
              <Badge variant={statusLabel === "Fundraising" ? "default" : "secondary"}>
                {statusLabel}
              </Badge>
            </div>
            
            {/* View Document Button - Clear and Accessible */}
            <div className="flex flex-col gap-2">
              <Button
                asChild
                variant="outline"
                className="w-fit gap-2 hover:bg-accent transition-colors"
                aria-label="View the original invoice document in a new tab"
              >
                <a 
                  href={invoiceDocumentUrl} 
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileText className="h-4 w-4" />
                  View Original Invoice
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                Opens the original invoice uploaded by the MSME for verification.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Invoice Amount</p>
                <p className="text-xl font-semibold">{parseFloat(invoice.amount).toFixed(2)} MATIC</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Funded</p>
                <p className="text-xl font-semibold">{parseFloat(invoice.fundedAmount).toFixed(2)} MATIC</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="text-xl font-semibold">{invoice.dueDate.toLocaleDateString()}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Days Remaining</p>
                <p className={`text-xl font-semibold ${daysRemaining < 0 ? "text-destructive" : ""}`}>
                  {daysRemaining}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Interest Rate</p>
                <p className="text-xl font-semibold text-green-500">
                  {parseFloat(invoice.interestRate).toFixed(2)}%
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Buyer Status</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-semibold">
                    {invoice.buyerVerified ? "Verified" : "Not Verified"}
                  </p>
                  {invoice.buyerVerified ? (
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleInvest} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Investment Amount (MATIC)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.0001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.50"
                  className="bg-background/50"
                />
                <p className="text-xs text-muted-foreground">
                  You can invest up to {remainingToFund.toFixed(4)} MATIC.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || remainingToFund <= 0}>
                  {isSubmitting ? "Confirming..." : "Confirm Investment"}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}