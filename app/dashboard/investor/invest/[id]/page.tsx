"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useWalletClient } from "wagmi";
import { ethers } from "ethers";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Wallet, Landmark, Clock, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { fetchAllInvoices, Invoice, getStatusLabel, calculateDaysRemaining } from "@/lib/invoice";
import InvoiceMarketplaceABI from "@/lib/contracts/InvoiceMarketplace.json";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string;

export default function InvestorInvestPage({ params }: { params: { id: string } }) {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { toast } = useToast();
  const router = useRouter();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amount, setAmount] = useState("");

  const invoiceId = Number(params.id);

  useEffect(() => {
    const loadInvoice = async () => {
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

    if (!Number.isNaN(invoiceId)) {
      loadInvoice();
    }
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
      const tx = await contract.investInInvoice(invoiceId, { value: valueWei });
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
      } else if (error.message) {
        message = error.message;
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Invoice #{invoice.id}</CardTitle>
              <CardDescription className="mt-1">
                Fund this MSME invoice and earn yield on repayment.
              </CardDescription>
            </div>
            <Badge variant={statusLabel === "Fundraising" ? "outline" : "default"}>
              {statusLabel}
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
              <p className="text-xs text-muted-foreground mb-1">Remaining to Fund</p>
              <p className="text-xl font-bold">{remainingToFund.toFixed(2)} MATIC</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
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
        </CardContent>
      </Card>
    </div>
  );
}
