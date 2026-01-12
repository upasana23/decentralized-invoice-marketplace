// lib/invoice.ts
import { ethers } from "ethers";
import InvoiceMarketplaceABI from "./contracts/InvoiceMarketplace.json";
import type { PublicClient } from "viem";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://rpc-amoy.polygon.technology";

// PERSON A: Added missing exports for UI Filters
export type YieldRange = 'low' | 'medium' | 'high';
export type DurationRange = 'short' | 'medium' | 'long';

export interface Invoice {
  id: number;
  msme: string;
  buyer: string;
  amount: string; // in MATIC
  fundedAmount: string; // in MATIC
  dueDate: Date;
  status: number; // 1: Fundraising, 2: Funded, 3: Repaid, 4: Defaulted
  metadataURI: string;
  interestRate: string; // PERSON A: Added to match UI page.tsx expectations
  buyerVerified: boolean; // PERSON A: Added for UI badges
  riskScore: number;      // PERSON A: Added for UI sorting
  discountRate?: string; 
}

export type InvoiceStatus = "Fundraising" | "Funded" | "Repaid" | "Defaulted";

export function getStatusLabel(status: number): InvoiceStatus {
  const statusMap: Record<number, InvoiceStatus> = {
    1: "Fundraising",
    2: "Funded",
    3: "Repaid",
    4: "Defaulted",
  };
  return statusMap[status] || "Fundraising";
}

export function calculateDaysRemaining(dueDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Fetch all invoices from blockchain
export async function fetchAllInvoices(): Promise<Invoice[]> {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      InvoiceMarketplaceABI.abi,
      provider
    );

    const nextId = await contract.nextInvoiceId();
    const invoicePromises: Array<Promise<[number, any | null]>> = [];

    // nextInvoiceId in the contract is the latest created invoice ID,
    // so we need to iterate inclusively from 1..nextId.
    for (let i = 1; i <= Number(nextId); i++) {
      const invoiceId = i;
      invoicePromises.push(
        contract.invoices(i)
          .then((inv: any): [number, any] => [invoiceId, inv])
          .catch((): [number, null] => [invoiceId, null])
      );
    }

    const invoiceResults = await Promise.all(invoicePromises);
    
    return invoiceResults
      .filter(([id, inv]) => inv !== null)
      .map(([id, inv]) => ({
        id: id,
        msme: inv.msme,
        buyer: inv.buyer,
        amount: ethers.formatEther(inv.amount),
        fundedAmount: ethers.formatEther(inv.fundedAmount),
        dueDate: new Date(Number(inv.dueDate) * 1000),
        status: Number(inv.status),
        metadataURI: inv.metadataURI,
        // Mapping discountRate to interestRate for UI consistency
        interestRate: inv.discountRate ? (Number(inv.discountRate) / 100).toString() : "10", 
        buyerVerified: true, // Mocking true for UI display; update if contract has this
        riskScore: 50,       // Mocking middle risk; update if contract has this
        discountRate: inv.discountRate ? ethers.formatUnits(inv.discountRate, 18) : undefined,
      }))
      .sort((a, b) => b.id - a.id);
  } catch (error) {
    console.error("Error fetching all invoices:", error);
    throw new Error("Failed to fetch invoices from blockchain");
  }
}

// Fetch invoices by MSME address
export async function fetchInvoicesByMSME(
  msmeAddress: string,
  publicClient?: PublicClient
): Promise<Invoice[]> {
  try {
    const allInvoices = await fetchAllInvoices();
    return allInvoices.filter(
      (inv) => inv.msme.toLowerCase() === msmeAddress.toLowerCase()
    );
  } catch (error) {
    console.error("Error fetching invoices by MSME:", error);
    throw new Error("Failed to fetch invoices from blockchain");
  }
}

// Fetch invoices by buyer address
export async function fetchInvoicesByBuyer(
  buyerAddress: string
): Promise<Invoice[]> {
  try {
    const allInvoices = await fetchAllInvoices();
    return allInvoices.filter(
      (inv) => inv.buyer.toLowerCase() === buyerAddress.toLowerCase()
    );
  } catch (error) {
    console.error("Error fetching invoices by buyer:", error);
    throw new Error("Failed to fetch invoices from blockchain");
  }
}

// Fetch invoices that are fundraising (for investors)
export async function fetchFundraisingInvoices(): Promise<Invoice[]> {
  try {
    const allInvoices = await fetchAllInvoices();
    return allInvoices.filter((inv) => inv.status === 1);
  } catch (error) {
    console.error("Error fetching fundraising invoices:", error);
    throw new Error("Failed to fetch invoices from blockchain");
  }
}

// Fetch investment amount for a specific invoice and investor
export async function fetchInvestmentAmount(
  invoiceId: number,
  investorAddress: string
): Promise<string> {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      InvoiceMarketplaceABI.abi,
      provider
    );

    const investment = await contract.investments(invoiceId, investorAddress);
    return ethers.formatEther(investment);
  } catch (error) {
    console.error("Error fetching investment amount:", error);
    return "0";
  }
}

// Fetch all investors for a specific invoice
export async function fetchInvoiceInvestors(
  invoiceId: number
): Promise<string[]> {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      InvoiceMarketplaceABI.abi,
      provider
    );

    const investors = await contract.getInvestors(invoiceId);
    return investors;
  } catch (error) {
    console.error("Error fetching invoice investors:", error);
    return [];
  }
}