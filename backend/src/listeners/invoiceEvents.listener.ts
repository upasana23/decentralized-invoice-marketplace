import { ethers } from "ethers";
import InvoiceMarketplaceABI from "../../../artifacts/contracts/InvoiceMarketplace.sol/InvoiceMarketplace.json";
import UserStats from "../models/UserStats.model";
import { updateTrustScore } from "../services/reputation.service";

const RPC_URL = process.env.RPC_URL as string;
const CONTRACT_ADDRESS = process.env.INVOICE_CONTRACT_ADDRESS as string;

let initialized = false;

export function startInvoiceEventListeners() {
  if (initialized) return;
  initialized = true;

  const provider = new ethers.WebSocketProvider(RPC_URL);

  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    InvoiceMarketplaceABI.abi,
    provider
  );

  console.log("📡 Invoice event listeners running...");

  contract.on("InvoiceCreated", async (_id, owner) => {
    const wallet = owner.toLowerCase();

    await UserStats.findOneAndUpdate(
      { walletAddress: wallet },
      { $inc: { totalInvoicesCreated: 1 } },
      { upsert: true }
    );

    await updateTrustScore(wallet);
  });

  contract.on("InvoiceRepaid", async (_id, owner) => {
    const wallet = owner.toLowerCase();

    await UserStats.findOneAndUpdate(
      { walletAddress: wallet },
      { $inc: { totalInvoicesRepaid: 1 } }
    );

    await updateTrustScore(wallet);
  });

  contract.on("InvoiceDefaulted", async (_id, owner) => {
    const wallet = owner.toLowerCase();

    await UserStats.findOneAndUpdate(
      { walletAddress: wallet },
      { $inc: { totalInvoicesDefaulted: 1 } }
    );

    await updateTrustScore(wallet);
  });
}
