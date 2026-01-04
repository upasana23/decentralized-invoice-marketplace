// lib/invoice.ts
import { ethers } from "ethers";
import InvoiceMarketplaceABI from "./contracts/InvoiceMarketplace.json";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string;

export interface Invoice {
  id: number;
  msme: string;
  buyer: string;
  amount: string; // in MATIC
  fundedAmount: string; // in MATIC
  dueDate: Date;
  status: number; // 1: Fundraising, 2: Funded, 3: Repaid, 4: Defaulted
  metadataURI: string;
}

export async function fetchInvoicesByMSME(msmeAddress: string): Promise<Invoice[]> {
  if (!window.ethereum) return [];
  
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      InvoiceMarketplaceABI.abi,
      provider
    );

    const nextId = await contract.nextInvoiceId();
    const invoicePromises = [];

    for (let i = 1; i < Number(nextId); i++) {
      invoicePromises.push(
        contract.invoices(i).catch(() => null)
      );
    }

    const invoiceResults = await Promise.all(invoicePromises);
    
    return invoiceResults
      .filter((inv, index) => {
        if (!inv) return false;
        return inv.msme.toLowerCase() === msmeAddress.toLowerCase();
      })
      .map((inv, index) => ({
        id: index + 1,
        msme: inv.msme,
        buyer: inv.buyer,
        amount: ethers.formatEther(inv.amount),
        fundedAmount: ethers.formatEther(inv.fundedAmount),
        dueDate: new Date(Number(inv.dueDate) * 1000),
        status: Number(inv.status),
        metadataURI: inv.metadataURI
      }))
      .sort((a, b) => b.id - a.id);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    throw new Error("Failed to fetch invoices from blockchain");
  }
}