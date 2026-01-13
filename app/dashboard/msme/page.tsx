// app/dashboard/msme/page.tsx
"use client";
import ReputationSection from "@/components/msme/ReputationSection";
import { DashboardChatSection } from "@/components/chat/DashboardChatSection";

import { useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { FileText, TrendingUp, Clock, Wallet, PlusCircle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchInvoicesByMSME, Invoice, getStatusLabel } from "@/lib/invoice";
import { useToast } from "@/components/ui/use-toast";

export default function MSMEDashboard() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadInvoices = async () => {
      if (!isConnected || !address) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const msmeInvoices = await fetchInvoicesByMSME(address, publicClient || undefined);
        setInvoices(msmeInvoices);
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Failed to load invoices",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoices();
  }, [address, isConnected, publicClient, toast]);

  // Calculate stats
  const stats = [
    {
      label: "Total Invoices",
      value: invoices.length.toString(),
      icon: FileText,
      color: "text-blue-500",
    },
    {
      label: "Total Value",
      value: `${invoices
        .reduce((sum, inv) => sum + parseFloat(inv.amount), 0)
        .toFixed(2)} MATIC`,
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      label: "Fundraising",
      value: invoices.filter((inv) => inv.status === 1).length.toString(),
      icon: Clock,
      color: "text-amber-500",
    },
    {
      label: "Funded",
      value: `${invoices
        .filter((inv) => inv.status === 2)
        .reduce((sum, inv) => sum + parseFloat(inv.fundedAmount), 0)
        .toFixed(2)} MATIC`,
      icon: Wallet,
      color: "text-purple-500",
    },
  ];

  const getStatusBadge = (status: number) => {
    const statusLabel = getStatusLabel(status);
    const statusMap = {
      "Fundraising": { variant: "outline" as const },
      "Funded": { variant: "default" as const },
      "Repaid": { variant: "secondary" as const },
      "Defaulted": { variant: "destructive" as const },
    };
    const { variant } = statusMap[statusLabel] || { variant: "outline" as const };
    return <Badge variant={variant}>{statusLabel}</Badge>;
  };

  const formatAddress = (addr: string) => 
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Wallet className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-medium">Connect your wallet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Connect your wallet to view your MSME dashboard and manage invoices.
        </p>
        <Button asChild>
          <Link href="/connect">Connect Wallet</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    
   <div className="space-y-8">

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

        {stats.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invoices */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Your Invoices</h2>
            <p className="text-sm text-muted-foreground">
              Manage your tokenized invoices
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/msme/tokenize">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Invoice
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">No invoices yet</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Get started by creating your first invoice to receive early payments.
              </p>
              <Button asChild>
                <Link href="/dashboard/msme/tokenize">Create Invoice</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">Invoice #{invoice.id}</h3>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Buyer: {formatAddress(invoice.buyer)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Due: {invoice.dueDate.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{invoice.amount} MATIC</p>
                    <p className="text-sm text-muted-foreground">
                      Funded: {invoice.fundedAmount} MATIC
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {address && (
        <DashboardChatSection walletAddress={address} role="msme" />
      )}

      {/* MSME Reputation Section - MUST be at bottom */}
  {/* Reputation & Investor Trust - Full Width Section */}
      <div className="pt-10">
        <ReputationSection walletAddress={address} />
      </div>

    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full mb-4" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}