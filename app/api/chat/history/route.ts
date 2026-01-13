import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import dbConnect from "@/lib/dbConnect";
import ChatMessage from "@/models/ChatMessage";
import { getConversationId } from "@/lib/chat";

const bodySchema = z.object({
  invoiceId: z.number().int().nonnegative(),
  investorAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/i, "Invalid investor address"),
  msmeAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/i, "Invalid MSME address"),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parseResult = bodySchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { invoiceId, investorAddress, msmeAddress } = parseResult.data;

    await dbConnect();

    const conversationId = getConversationId(
      invoiceId,
      investorAddress,
      msmeAddress
    );

    const messages = await ChatMessage.find({ conversationId })
      .sort({ createdAt: 1 })
      .lean();

    const payload = messages.map((m) => ({
      id: m._id.toString(),
      fromAddress: m.fromAddress,
      toAddress: m.toAddress,
      message: m.message,
      createdAt: m.createdAt,
    }));

    return NextResponse.json({ messages: payload }, { status: 200 });
  } catch (error) {
    console.error("Chat history error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
