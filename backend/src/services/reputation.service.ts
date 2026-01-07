import UserStats from "../models/UserStats.model";

export async function updateTrustScore(walletAddress: string) {
  const stats = await UserStats.findOne({ walletAddress });

  if (!stats) return;

  const { totalInvoicesCreated, totalInvoicesRepaid } = stats;

  const trustScore =
    totalInvoicesCreated === 0
      ? 0
      : Number(
          (totalInvoicesRepaid / totalInvoicesCreated).toFixed(2)
        );

  stats.trustScore = trustScore;
  await stats.save();
}
