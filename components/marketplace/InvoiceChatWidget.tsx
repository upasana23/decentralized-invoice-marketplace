"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Pusher from "pusher-js";
import { MessageCircle, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatMessage {
  id: string;
  fromAddress: string;
  toAddress: string;
  message: string;
  createdAt: string;
}

interface InvoiceChatWidgetProps {
  invoiceId: number;
  investorAddress: string;
  msmeAddress: string;
}

export function InvoiceChatWidget({
  invoiceId,
  investorAddress,
  msmeAddress,
}: InvoiceChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lowerInvestor = investorAddress?.toLowerCase();
  const lowerMsme = msmeAddress?.toLowerCase();

  useEffect(() => {
    if (!lowerInvestor || !lowerMsme) return;

    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/chat/history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            invoiceId,
            investorAddress,
            msmeAddress,
          }),
        });

        if (!res.ok) return;

        const data = await res.json();
        const history: ChatMessage[] = (data.messages || []).map((m: any) => ({
          id: m.id,
          fromAddress: m.fromAddress,
          toAddress: m.toAddress,
          message: m.message,
          createdAt: m.createdAt,
        }));
        setMessages(history);
      } catch (error) {
        console.error("Failed to load chat history", error);
      }
    };

    fetchHistory();
  }, [invoiceId, investorAddress, msmeAddress, lowerInvestor, lowerMsme]);

  useEffect(() => {
    if (!lowerInvestor || !lowerMsme) return;

    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!key || !cluster) {
      console.warn("Pusher env vars are not set. Real-time chat is disabled.");
      return;
    }

    const pusher = new Pusher(key, {
      cluster,
    });

    const participants = [lowerInvestor, lowerMsme].sort();
    const conversationId = `invoice:${invoiceId}:${participants[0]}:${participants[1]}`;
    const channelName = `chat-${conversationId}`;

    const channel = pusher.subscribe(channelName);

    channel.bind("message", (data: ChatMessage) => {
      // Ignore our own messages (we already add them optimistically)
      if (data.fromAddress.toLowerCase() === lowerInvestor) {
        return;
      }

      setMessages((prev) => {
        const exists = prev.some((m) => m.id === data.id);
        if (exists) return prev;
        return [...prev, data];
      });
    });

    channel.bind(
      "typing",
      (data: { fromAddress: string; isTyping: boolean }) => {
        if (data.fromAddress.toLowerCase() === lowerInvestor) return;
        setIsOtherTyping(data.isTyping);
      }
    );

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [invoiceId, lowerInvestor, lowerMsme]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const sendTypingSignal = async (isTyping: boolean) => {
    try {
      await fetch("/api/chat/typing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceId,
          investorAddress,
          msmeAddress,
          fromAddress: investorAddress,
          isTyping,
        }),
      });
    } catch (error) {
      console.error("Failed to send typing event", error);
    }
  };

  const handleInputChange = (
    event: ChangeEvent<HTMLTextAreaElement>
  ) => {
    const value = event.target.value;
    setInput(value);

    if (!lowerInvestor || !lowerMsme) return;

    if (!typingTimeoutRef.current) {
      void sendTypingSignal(true);
    } else if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
      void sendTypingSignal(false);
    }, 2000);
  };

  const handleSend = async () => {
    if (!input.trim() || !lowerInvestor || !lowerMsme) return;

    const messageText = input.trim();
    setInput("");
    setIsSending(true);

    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      fromAddress: lowerInvestor,
      toAddress: lowerMsme,
      message: messageText,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceId,
          investorAddress,
          msmeAddress,
          fromAddress: investorAddress,
          message: messageText,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      console.error("Failed to send chat message", error);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
    } finally {
      setIsSending(false);
      void sendTypingSignal(false);
    }
  };

  const shortAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!investorAddress || !msmeAddress) return null;

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
        {isOpen && (
          <div className="w-80 sm:w-96 rounded-xl border bg-background shadow-xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/60 backdrop-blur">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Chat with MSME</span>
                <span className="text-sm font-medium truncate">
                  {shortAddress(msmeAddress)} · Invoice #{invoiceId}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 flex flex-col px-3 py-2 space-y-2 overflow-y-auto max-h-80 bg-background">
              {messages.length === 0 && !isOtherTyping && (
                <p className="text-xs text-muted-foreground text-center mt-6">
                  Start a conversation with the MSME about this invoice.
                </p>
              )}

              {messages.map((msg) => {
                const isMine = msg.fromAddress.toLowerCase() === lowerInvestor;
                return (
                  <div
                    key={msg.id}
                    className={`flex w-full ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs shadow-sm ${
                        isMine
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {msg.message}
                      </p>
                      <span className="mt-1 block text-[10px] opacity-70 text-right">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {isOtherTyping && (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">
                    <span className="inline-flex h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70" />
                    <span className="inline-flex h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:80ms]" />
                    <span className="inline-flex h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:160ms]" />
                    <span className="ml-1">MSME is typing...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t bg-background/95 px-3 py-2">
              <div className="flex items-end gap-2">
                <Textarea
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask a question about this invoice..."
                  className="min-h-[40px] max-h-[80px] text-xs resize-none"
                  rows={2}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  disabled={isSending || !input.trim()}
                  onClick={() => void handleSend()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        <Button
          type="button"
          size="icon"
          className="h-11 w-11 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => setIsOpen((open) => !open)}
          title="Chat with the MSME about this invoice"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </div>
    </>
  );
}
