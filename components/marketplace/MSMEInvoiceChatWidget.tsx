"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Pusher from "pusher-js";
import { MessageCircle, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface ChatMessage {
  id: string;
  fromAddress: string;
  toAddress: string;
  message: string;
  createdAt: string;
}

interface MSMEInvoiceChatWidgetProps {
  invoiceId: number;
  invoiceMsmeAddress: string;
  currentMsmeAddress: string;
}

export function MSMEInvoiceChatWidget({
  invoiceId,
  invoiceMsmeAddress,
  currentMsmeAddress,
}: MSMEInvoiceChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  const [investorAddressInput, setInvestorAddressInput] = useState("");
  const [activeInvestorAddress, setActiveInvestorAddress] = useState<string | null>(
    null
  );
  const [addressError, setAddressError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lowerCurrentMsme = currentMsmeAddress?.toLowerCase();
  const lowerInvoiceMsme = invoiceMsmeAddress?.toLowerCase();

  useEffect(() => {
    if (!activeInvestorAddress || !lowerInvoiceMsme) return;

    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/chat/history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            invoiceId,
            investorAddress: activeInvestorAddress,
            msmeAddress: invoiceMsmeAddress,
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
  }, [invoiceId, activeInvestorAddress, invoiceMsmeAddress, lowerInvoiceMsme]);

  useEffect(() => {
    if (!activeInvestorAddress || !lowerInvoiceMsme) return;

    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!key || !cluster) {
      console.warn("Pusher env vars are not set. Real-time chat is disabled.");
      return;
    }

    const pusher = new Pusher(key, {
      cluster,
    });

    const participants = [
      activeInvestorAddress.toLowerCase(),
      lowerInvoiceMsme,
    ].sort();
    const conversationId = `invoice:${invoiceId}:${participants[0]}:${participants[1]}`;
    const channelName = `chat-${conversationId}`;

    const channel = pusher.subscribe(channelName);

    channel.bind("message", (data: ChatMessage) => {
      if (data.fromAddress.toLowerCase() === lowerCurrentMsme) {
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
        if (data.fromAddress.toLowerCase() === lowerCurrentMsme) return;
        setIsOtherTyping(data.isTyping);
      }
    );

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [
    invoiceId,
    activeInvestorAddress,
    lowerInvoiceMsme,
    lowerCurrentMsme,
  ]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const sendTypingSignal = async (isTyping: boolean) => {
    if (!activeInvestorAddress) return;

    try {
      await fetch("/api/chat/typing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceId,
          investorAddress: activeInvestorAddress,
          msmeAddress: invoiceMsmeAddress,
          fromAddress: currentMsmeAddress,
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

    if (!activeInvestorAddress || !lowerInvoiceMsme || !lowerCurrentMsme) return;

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
    if (!input.trim() || !activeInvestorAddress || !lowerInvoiceMsme) return;

    const messageText = input.trim();
    setInput("");
    setIsSending(true);

    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      fromAddress: lowerCurrentMsme,
      toAddress: activeInvestorAddress.toLowerCase(),
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
          investorAddress: activeInvestorAddress,
          msmeAddress: invoiceMsmeAddress,
          fromAddress: currentMsmeAddress,
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

  const validateAndStartConversation = () => {
    const value = investorAddressInput.trim();
    setAddressError(null);

    if (!value) {
      setAddressError("Please enter an investor wallet address");
      return;
    }

    const isValid = /^0x[a-fA-F0-9]{40}$/.test(value);
    if (!isValid) {
      setAddressError("Enter a valid 0x investor address");
      return;
    }

    setActiveInvestorAddress(value);
    setMessages([]);
  };

  if (!currentMsmeAddress) return null;

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
        {isOpen && (
          <div className="w-80 sm:w-96 rounded-xl border bg-background shadow-xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/60 backdrop-blur">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Chat with Investor</span>
                <span className="text-sm font-medium truncate">
                  {activeInvestorAddress
                    ? `${shortAddress(activeInvestorAddress)} · Invoice #${invoiceId}`
                    : `Select investor · Invoice #${invoiceId}`}
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

            {!activeInvestorAddress && (
              <div className="px-4 py-3 space-y-2 border-b bg-background/80">
                <p className="text-xs text-muted-foreground">
                  Enter the investor's wallet address to open the conversation for this invoice.
                </p>
                <Input
                  value={investorAddressInput}
                  onChange={(e) => setInvestorAddressInput(e.target.value)}
                  placeholder="0x... investor address"
                  className="h-8 text-xs"
                />
                {addressError && (
                  <p className="text-[11px] text-destructive mt-1">{addressError}</p>
                )}
                <Button
                  type="button"
                  size="sm"
                  className="h-8 text-xs mt-1 w-full"
                  onClick={validateAndStartConversation}
                >
                  Start chat
                </Button>
              </div>
            )}

            <div className="flex-1 flex flex-col px-3 py-2 space-y-2 overflow-y-auto max-h-80 bg-background">
              {(!activeInvestorAddress || messages.length === 0) && !isOtherTyping && (
                <p className="text-xs text-muted-foreground text-center mt-6">
                  {activeInvestorAddress
                    ? "No messages yet. Start the conversation with the investor."
                    : "Select an investor address above to load the conversation."}
                </p>
              )}

              {messages.map((msg) => {
                const isMine =
                  lowerCurrentMsme &&
                  msg.fromAddress.toLowerCase() === lowerCurrentMsme;
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
                    <span className="ml-1">Investor is typing...</span>
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
                  placeholder={
                    activeInvestorAddress
                      ? "Reply to the investor..."
                      : "Select an investor above to start chatting..."
                  }
                  className="min-h-[40px] max-h-[80px] text-xs resize-none"
                  rows={2}
                  disabled={!activeInvestorAddress}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey &&
                      activeInvestorAddress
                    ) {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  disabled={
                    isSending || !input.trim() || !activeInvestorAddress
                  }
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
          title="Chat with an investor about this invoice"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </div>
    </>
  );
}
