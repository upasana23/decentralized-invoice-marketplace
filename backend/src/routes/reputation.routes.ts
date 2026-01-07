import express from "express";
import UserStats from "../models/UserStats.model";

const router = express.Router();

router.get("/:walletAddress", async (req, res) => {
  const walletAddress = req.params.walletAddress.toLowerCase();

  const stats = await UserStats.findOne({ walletAddress });

  if (!stats) {
    return res.status(404).json({ message: "No reputation data found" });
  }

  res.json(stats);
});

export default router;
