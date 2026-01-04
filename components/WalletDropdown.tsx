"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Check, Copy, ExternalLink, Wallet } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

declare global {
  interface Window {
    ethereum?: any
  }
}

// Polygon Amoy Testnet configuration
const AMOY_CHAIN_ID = '0x13882' // 80002 in decimal
const AMOY_PARAMS = {
  chainId: AMOY_CHAIN_ID,
  chainName: 'Polygon Amoy',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  rpcUrls: ['https://rpc-amoy.polygon.technology/'],
  blockExplorerUrls: ['https://amoy.polygonscan.com/'],
}

export function WalletDropdown() {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true)
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false)
  const router = useRouter()

  // Check if wallet is connected and on the correct network
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const accounts = await window.ethereum.request({ method: 'eth_accounts' })
          
          if (accounts.length > 0) {
            setAddress(accounts[0])
            setIsConnected(true)
            
            const chainId = await window.ethereum.request({ method: 'eth_chainId' })
            setIsCorrectNetwork(chainId === AMOY_CHAIN_ID)
          }
        } catch (error) {
          console.error('Error checking connection:', error)
        }
      }
    }

    checkConnection()

    // Listen for account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAddress(null)
        setIsConnected(false)
      } else {
        setAddress(accounts[0])
      }
    }

    // Listen for chain changes
    const handleChainChanged = (chainId: string) => {
      setIsCorrectNetwork(chainId === AMOY_CHAIN_ID)
      // Reload the page when network changes
      window.location.reload()
    }

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  // Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: 'MetaMask not found',
        description: 'Please install MetaMask to connect your wallet.',
        variant: 'destructive',
      })
      return
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      
      if (accounts.length > 0) {
        setAddress(accounts[0])
        setIsConnected(true)
        
        const chainId = await window.ethereum.request({ method: 'eth_chainId' })
        const isCorrect = chainId === AMOY_CHAIN_ID
        setIsCorrectNetwork(isCorrect)
        
        if (!isCorrect) {
          toast({
            title: 'Wrong Network',
            description: 'Please switch to Polygon Amoy Testnet',
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Wallet Connected',
            description: 'Your wallet has been connected successfully',
          })
        }
      }
    } catch (error) {
      console.error('Error connecting wallet:', error)
      toast({
        title: 'Connection Error',
        description: 'Failed to connect wallet. Please try again.',
        variant: 'destructive',
      })
    }
  }

  // Switch to Amoy network
  const switchToAmoy = async () => {
    if (!window.ethereum) return
    
    setIsSwitchingNetwork(true)
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: AMOY_CHAIN_ID }],
      })
      setIsCorrectNetwork(true)
      toast({
        title: 'Network Switched',
        description: 'Successfully switched to Polygon Amoy Testnet',
      })
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [AMOY_PARAMS],
          })
          setIsCorrectNetwork(true)
        } catch (addError) {
          console.error('Error adding Amoy network:', addError)
          toast({
            title: 'Error',
            description: 'Failed to add Polygon Amoy network to MetaMask',
            variant: 'destructive',
          })
        }
      } else {
        console.error('Error switching network:', switchError)
        toast({
          title: 'Error',
          description: 'Failed to switch network',
          variant: 'destructive',
        })
      }
    } finally {
      setIsSwitchingNetwork(false)
    }
  }

  const copyAddress = () => {
    if (!address) return
    navigator.clipboard.writeText(address)
    toast({
      title: 'Address Copied',
      description: 'Wallet address copied to clipboard',
    })
  }

  const viewOnExplorer = () => {
    if (!address) return
    window.open(`https://amoy.polygonscan.com/address/${address}`, '_blank')
  }

  const disconnect = () => {
    setAddress(null)
    setIsConnected(false)
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected',
    })
  }

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`
  }

  // If not connected
  if (!isConnected || !address) {
    return (
      <Button onClick={connectWallet} className="gap-2">
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
    )
  }

  // If connected but wrong network
  if (!isCorrectNetwork) {
    return (
      <Button 
        onClick={switchToAmoy} 
        disabled={isSwitchingNetwork}
        variant="destructive"
        className="gap-2"
      >
        {isSwitchingNetwork ? (
          <>
            <span className="h-4 w-4 animate-spin">⟳</span>
            Switching...
          </>
        ) : (
          'Switch to Amoy Testnet'
        )}
      </Button>
    )
  }

  // Connected and on correct network
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500"></div>
          {formatAddress(address)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuItem onClick={copyAddress} className="cursor-pointer">
          <Copy className="mr-2 h-4 w-4" />
          <span>Copy Address</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={viewOnExplorer} className="cursor-pointer">
          <ExternalLink className="mr-2 h-4 w-4" />
          <span>View on Explorer</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={disconnect} className="cursor-pointer text-red-600">
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
