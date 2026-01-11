import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import dbConnect from "@/lib/dbConnect";
import { recomputeTrustStatsForWallet } from "@/lib/trustScore";

const addressSchema = z.object({
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
});

type RouteContext = {
  params: {
    walletAddress: string;
  };
};

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    const parseResult = addressSchema.safeParse(params);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { walletAddress } = parseResult.data;

    await dbConnect();

    const stats = await recomputeTrustStatsForWallet(walletAddress);

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error("Trust score computation error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
