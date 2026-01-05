"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount, useBalance } from "wagmi"
import { formatEther } from "viem"
import { Skeleton } from "@/components/ui/skeleton"

function WalletBalance() {
  const { address, isConnected } = useAccount()
  const { data: balance, isLoading } = useBalance({
    address: address,
    query: {
      enabled: isConnected && !!address,
    },
  })

  if (!isConnected || !address) return null

  if (isLoading) {
    return <Skeleton className="h-4 w-16" />
  }

  if (!balance || balance.value === undefined) return null

  const formattedBalance = parseFloat(formatEther(balance.value)).toFixed(4)

  return (
    <span className="text-sm font-medium mr-2">
      {formattedBalance} {balance.symbol || "POL"}
    </span>
  )
}

export function WalletDropdown() {
  return (
    <div className="flex items-center gap-2">
      <WalletBalance />
      <ConnectButton 
        showBalance={false}
        chainStatus="icon"
        accountStatus="address"
      />
    </div>
  )
}
