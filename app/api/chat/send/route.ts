import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import dbConnect from "@/lib/dbConnect";
import ChatMessage from "@/models/ChatMessage";
import { getConversationId } from "@/lib/chat";
import { pusherServer } from "@/lib/pusher";

const bodySchema = z.object({
  invoiceId: z.number().int().nonnegative(),
  investorAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/i, "Invalid investor address"),
  msmeAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/i, "Invalid MSME address"),
  fromAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/i, "Invalid sender address"),
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message is too long"),
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

    const { invoiceId, investorAddress, msmeAddress, fromAddress, message } =
      parseResult.data;

    const lowerInvestor = investorAddress.toLowerCase();
    const lowerMsme = msmeAddress.toLowerCase();
    const lowerFrom = fromAddress.toLowerCase();

    if (lowerFrom !== lowerInvestor && lowerFrom !== lowerMsme) {
      return NextResponse.json(
        { error: "Sender must be either investor or MSME" },
        { status: 400 }
      );
    }

    const toAddress =
      lowerFrom === lowerInvestor ? lowerMsme : lowerInvestor;

    await dbConnect();

    const conversationId = getConversationId(
      invoiceId,
      investorAddress,
      msmeAddress
    );

    const created = await ChatMessage.create({
      conversationId,
      invoiceId,
      fromAddress: lowerFrom,
      toAddress,
      message,
    });

    const eventPayload = {
      id: created._id.toString(),
      fromAddress: created.fromAddress,
      toAddress: created.toAddress,
      message: created.message,
      createdAt: created.createdAt,
    };

    try {
      const channelName = `chat-${conversationId}`;
      await pusherServer.trigger(channelName, "message", eventPayload);
    } catch (pusherError) {
      console.error("Pusher trigger error", pusherError);
    }

    return NextResponse.json(eventPayload, { status: 201 });
  } catch (error) {
    console.error("Chat send error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
