// lib/contracts/useInvoiceContract.ts
import { usePublicClient, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import InvoiceMarketplaceABI from "./InvoiceMarketplace.json";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string;

export function useInvoiceContract() {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const getProvider = () => {
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://rpc-amoy.polygon.technology";
    return new ethers.JsonRpcProvider(rpcUrl);
  };

  const getContract = (provider?: ethers.Provider | ethers.Signer) => {
    const contractProvider = provider || getProvider();
    return new ethers.Contract(
      CONTRACT_ADDRESS,
      InvoiceMarketplaceABI.abi,
      contractProvider
    );
  };

  const getReadContract = () => {
    return getContract(getProvider());
  };

  const getWriteContract = async () => {
    if (!walletClient) {
      throw new Error("Wallet not connected");
    }
    // Convert viem wallet client to ethers signer
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return getContract(signer);
  };

  return {
    getReadContract,
    getWriteContract,
    getProvider,
    contractAddress: CONTRACT_ADDRESS,
  };
}

