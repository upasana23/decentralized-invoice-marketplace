import mongoose from "mongoose";

const UserStatsSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    totalInvoicesCreated: {
      type: Number,
      default: 0,
    },

    totalInvoicesRepaid: {
      type: Number,
      default: 0,
    },

    totalInvoicesDefaulted: {
      type: Number,
      default: 0,
    },

    trustScore: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("UserStats", UserStatsSchema);
