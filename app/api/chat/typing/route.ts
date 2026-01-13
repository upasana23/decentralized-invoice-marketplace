import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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
  isTyping: z.boolean(),
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

    const { invoiceId, investorAddress, msmeAddress, fromAddress, isTyping } =
      parseResult.data;

    const conversationId = getConversationId(
      invoiceId,
      investorAddress,
      msmeAddress
    );

    const channelName = `chat-${conversationId}`;

    try {
      await pusherServer.trigger(channelName, "typing", {
        fromAddress: fromAddress.toLowerCase(),
        isTyping,
      });
    } catch (pusherError) {
      console.error("Pusher typing trigger error", pusherError);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Chat typing error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
