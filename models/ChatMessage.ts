import mongoose, { Schema, Document, Model } from "mongoose";

export interface IChatMessage extends Document {
  conversationId: string;
  invoiceId: number;
  fromAddress: string;
  toAddress: string;
  message: string;
  createdAt: Date;
}

const ChatMessageSchema: Schema<IChatMessage> = new Schema<IChatMessage>(
  {
    conversationId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    invoiceId: {
      type: Number,
      required: true,
      index: true,
    },
    fromAddress: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    toAddress: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

const ChatMessage: Model<IChatMessage> =
  (mongoose.models.ChatMessage as Model<IChatMessage>) ||
  mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);

export default ChatMessage;
