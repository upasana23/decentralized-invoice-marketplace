import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { uploadFileToIPFS, uploadJSONToIPFS } from "@/lib/pinata";

const invoiceFormSchema = z.object({
  buyerAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid buyer address"),
  msmeAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid MSME address")
    .optional(),
  amount: z.string().min(1, "Amount is required"),
  currency: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
  discountRate: z.string().optional(),
  description: z.string().optional(),
  externalId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Invoice PDF file is required (field name: 'file')" },
        { status: 400 }
      );
    }

    const rawFields: Record<string, string> = {};

    formData.forEach((value, key) => {
      if (key === "file") {
        return;
      }
      if (typeof value === "string") {
        rawFields[key] = value;
      }
    });

    const parseResult = invoiceFormSchema.safeParse(rawFields);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    const pdfPin = await uploadFileToIPFS(file, (file as File).name || "invoice.pdf");

    const metadata = {
      version: 1,
      type: "decentralized-invoice",
      createdAt: new Date().toISOString(),
      invoice: {
        buyerAddress: data.buyerAddress,
        msmeAddress: data.msmeAddress ?? null,
        amount: data.amount,
        currency: data.currency ?? "MATIC",
        dueDate: data.dueDate,
        discountRate: data.discountRate ?? null,
        description: data.description ?? null,
        externalId: data.externalId ?? null,
      },
      file: {
        cid: pdfPin.cid,
        uri: pdfPin.uri,
        gatewayUrl: pdfPin.gatewayUrl,
        type: (file as File).type,
        name: (file as File).name,
      },
    };

    const metadataName =
      data.externalId || `invoice-${pdfPin.cid.substring(0, 8)}`;

    const jsonPin = await uploadJSONToIPFS(metadata, {
      name: metadataName,
    });

    return NextResponse.json(
      {
        pdfCid: pdfPin.cid,
        pdfUri: pdfPin.uri,
        pdfGatewayUrl: pdfPin.gatewayUrl,
        metadataCid: jsonPin.cid,
        metadataUri: jsonPin.uri,
        metadataGatewayUrl: jsonPin.gatewayUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("/api/invoices/ipfs error", error);
    return NextResponse.json(
      { error: "Failed to upload invoice to IPFS" },
      { status: 500 }
    );
  }
}
