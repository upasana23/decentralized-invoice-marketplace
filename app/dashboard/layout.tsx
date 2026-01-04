"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/sidebar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamically import WalletDropdown with SSR disabled
const WalletDropdown = dynamic(
  () => import('@/components/WalletDropdown').then(mod => mod.WalletDropdown),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-10 w-32 rounded-md" />
  }
);

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Set mounted state after component mounts
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // 🔐 Protect dashboard routes
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/signin");
    }
  }, [user, isLoading, router]);

  // ⏳ Loading state
  if (isLoading || !user || !mounted) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      {/* Sidebar */}
      <AppSidebar role={user.role} />

      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 bg-background">
          {/* Left: Sidebar trigger + breadcrumb */}
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4 mx-2" />

            <Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbPage>
        {user.role === "msme"
          ? "MSME Portal"
          : user.role === "investor"
          ? "Investor Portal"
          : "Big Buyer Portal"}
      </BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>

          </div>

          {/* Right: Wallet */}
          <div className="flex items-center">
            <WalletDropdown />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-8 bg-accent/5 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}