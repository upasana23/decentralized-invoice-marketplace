"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function ConnectWalletPage() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/signin");
    }
  }, [user, authLoading, router]);

  // Redirect if user already has wallet bound
  useEffect(() => {
    if (!authLoading && user?.walletAddress && isConnected) {
      redirectToDashboard();
    }
  }, [user, authLoading, isConnected]);

  // Handle wallet connection and save
  useEffect(() => {
    const saveWalletAddress = async () => {
      // Only proceed if user doesn't have walletAddress yet
      if (!isConnected || !address || !user || user.walletAddress) return;

      setIsSaving(true);
      setError(null);

      try {
        const response = await fetch("/api/user/wallet", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            walletAddress: address.toLowerCase(),
            userId: user.id,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to save wallet address");
        }

        // Update local user data
        const updatedUser = { ...user, walletAddress: address.toLowerCase() };
        localStorage.setItem("invochain_user", JSON.stringify(updatedUser));

        // Redirect to dashboard
        redirectToDashboard();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save wallet address");
        setIsSaving(false);
      }
    };

    saveWalletAddress();
  }, [isConnected, address, user]);

  const redirectToDashboard = () => {
    if (!user) return;
    if (user.role === "msme") {
      router.push("/dashboard/msme");
    } else if (user.role === "investor") {
      router.push("/dashboard/investor");
    } else if (user.role === "bigbuyer") {
      router.push("/dashboard/bigbuyer");
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
          <CardDescription>
            To continue, connect the wallet you will use for all on-chain actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isSaving && (
            <Alert>
              <AlertDescription>Saving your wallet address...</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-center">
            <ConnectButton
              showBalance={false}
              chainStatus="icon"
              accountStatus="address"
            />
          </div>

          {isConnected && address && (
            <div className="text-center text-sm text-muted-foreground">
              <p>Connected: {address.slice(0, 6)}...{address.slice(-4)}</p>
              {isSaving && <p className="mt-2">Please wait...</p>}
            </div>
          )}

          {isConnected && !isSaving && (
            <div className="text-center">
              <button
                onClick={() => disconnect()}
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                Disconnect and switch wallet
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

