import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import dbConnect from "@/lib/dbConnect";
import ChatMessage from "@/models/ChatMessage";

const querySchema = z.object({
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/i, "Invalid wallet address"),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const parseResult = querySchema.safeParse({
      walletAddress: searchParams.get("walletAddress"),
    });

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const walletLower = parseResult.data.walletAddress.toLowerCase();

    await dbConnect();

    const results = await ChatMessage.aggregate([
      {
        $match: {
          $or: [
            { fromAddress: walletLower },
            { toAddress: walletLower },
          ],
        },
      },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: "$conversationId",
          invoiceId: { $first: "$invoiceId" },
          lastMessage: { $last: "$message" },
          lastFrom: { $last: "$fromAddress" },
          lastAt: { $last: "$createdAt" },
          firstFrom: { $first: "$fromAddress" },
          firstTo: { $first: "$toAddress" },
        },
      },
      { $sort: { lastAt: -1 } },
    ]).exec();

    const conversations = results.map((row: any) => {
      const { invoiceId, lastMessage, lastFrom, lastAt, firstFrom, firstTo } =
        row;
      const from = String(firstFrom || "");
      const to = String(firstTo || "");
      const wallet = walletLower;

      let otherAddress = from;
      if (from === wallet) {
        otherAddress = to;
      }

      // Fallback: if still equal (should not happen), just use `to`.
      if (otherAddress === wallet && to) {
        otherAddress = to;
      }

      return {
        conversationId: String(row._id),
        invoiceId: Number(invoiceId),
        otherAddress,
        lastMessage,
        lastFrom,
        lastAt,
      };
    });

    return NextResponse.json({ conversations }, { status: 200 });
  } catch (error) {
    console.error("Chat conversations error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
