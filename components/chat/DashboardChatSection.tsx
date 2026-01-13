"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import Pusher from "pusher-js";
import {
  MessageCircle,
  RefreshCw,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { getConversationId } from "@/lib/chat";

interface ConversationPreview {
  conversationId: string;
  invoiceId: number;
  otherAddress: string;
  lastMessage: string;
  lastFrom: string;
  lastAt: string;
}

interface ChatMessage {
  id: string;
  fromAddress: string;
  toAddress: string;
  message: string;
  createdAt: string;
}

interface DashboardChatSectionProps {
  walletAddress: string;
  role: "msme" | "investor";
}

export function DashboardChatSection({
  walletAddress,
  role,
}: DashboardChatSectionProps) {
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [selected, setSelected] = useState<ConversationPreview | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const [newInvoiceId, setNewInvoiceId] = useState("");
  const [newCounterparty, setNewCounterparty] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lowerWallet = walletAddress?.toLowerCase();
  const isMsme = role === "msme";

  useEffect(() => {
    if (!walletAddress) return;

    const fetchConversations = async () => {
      try {
        setIsLoadingConversations(true);
        const res = await fetch(
          `/api/chat/conversations?walletAddress=${walletAddress}`
        );
        if (!res.ok) return;
        const data = await res.json();
        const convs: ConversationPreview[] = (data.conversations || []).map(
          (c: any) => ({
            conversationId: c.conversationId,
            invoiceId: c.invoiceId,
            otherAddress: c.otherAddress,
            lastMessage: c.lastMessage,
            lastFrom: c.lastFrom,
            lastAt: c.lastAt,
          })
        );
        setConversations(convs);
        if (!selected && convs.length > 0) {
          setSelected(convs[0]);
        }
      } catch (error) {
        console.error("Failed to load conversations", error);
      } finally {
        setIsLoadingConversations(false);
      }
    };

    void fetchConversations();
  }, [walletAddress, reloadKey]);

  useEffect(() => {
    if (!selected) {
      setMessages([]);
      return;
    }

    const investorAddress = isMsme
      ? selected.otherAddress
      : walletAddress;
    const msmeAddress = isMsme ? walletAddress : selected.otherAddress;

    if (!investorAddress || !msmeAddress) return;

    const fetchHistory = async () => {
      try {
        setIsLoadingMessages(true);
        const res = await fetch("/api/chat/history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            invoiceId: selected.invoiceId,
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
      } finally {
        setIsLoadingMessages(false);
      }
    };

    void fetchHistory();
  }, [selected, isMsme, walletAddress]);

  useEffect(() => {
    if (!selected) return;

    const investorAddress = isMsme
      ? selected.otherAddress
      : walletAddress;
    const msmeAddress = isMsme ? walletAddress : selected.otherAddress;

    if (!investorAddress || !msmeAddress || !lowerWallet) return;

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
      investorAddress.toLowerCase(),
      msmeAddress.toLowerCase(),
    ].sort();
    const convId = getConversationId(
      selected.invoiceId,
      participants[0],
      participants[1]
    );
    const channelName = `chat-${convId}`;

    const channel = pusher.subscribe(channelName);

    channel.bind("message", (data: ChatMessage) => {
      if (data.fromAddress.toLowerCase() === lowerWallet) {
        return;
      }
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === data.id);
        if (exists) return prev;
        return [...prev, data];
      });
      setConversations((prev) =>
        prev.map((conv) =>
          conv.invoiceId === selected.invoiceId &&
          conv.otherAddress.toLowerCase() ===
            selected.otherAddress.toLowerCase()
            ? {
                ...conv,
                lastMessage: data.message,
                lastFrom: data.fromAddress,
                lastAt: data.createdAt,
              }
            : conv
        )
      );
    });

    channel.bind(
      "typing",
      (data: { fromAddress: string; isTyping: boolean }) => {
        if (data.fromAddress.toLowerCase() === lowerWallet) return;
        setIsOtherTyping(data.isTyping);
      }
    );

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [
    selected,
    isMsme,
    walletAddress,
    lowerWallet,
  ]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendTypingSignal = async (isTyping: boolean) => {
    if (!selected) return;

    const investorAddress = isMsme
      ? selected.otherAddress
      : walletAddress;
    const msmeAddress = isMsme ? walletAddress : selected.otherAddress;

    if (!investorAddress || !msmeAddress) return;

    try {
      await fetch("/api/chat/typing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceId: selected.invoiceId,
          investorAddress,
          msmeAddress,
          fromAddress: walletAddress,
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

    if (!selected || !lowerWallet) return;

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

  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!selected || !input.trim()) return;

    const investorAddress = isMsme
      ? selected.otherAddress
      : walletAddress;
    const msmeAddress = isMsme ? walletAddress : selected.otherAddress;

    if (!investorAddress || !msmeAddress || !lowerWallet) return;

    const messageText = input.trim();
    setInput("");
    setIsSending(true);

    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      fromAddress: lowerWallet,
      toAddress:
        lowerWallet === investorAddress.toLowerCase()
          ? msmeAddress.toLowerCase()
          : investorAddress.toLowerCase(),
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
          invoiceId: selected.invoiceId,
          investorAddress,
          msmeAddress,
          fromAddress: walletAddress,
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

  const handleStartNewConversation = () => {
    setFormError(null);
    const invoiceNumeric = Number(newInvoiceId);
    if (!invoiceNumeric || Number.isNaN(invoiceNumeric) || invoiceNumeric <= 0) {
      setFormError("Enter a valid invoice ID");
      return;
    }

    const addr = newCounterparty.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
      setFormError("Enter a valid 0x wallet address");
      return;
    }

    const investorAddress = isMsme ? addr : walletAddress;
    const msmeAddress = isMsme ? walletAddress : addr;

    const convId = getConversationId(
      invoiceNumeric,
      investorAddress,
      msmeAddress
    );

    const preview: ConversationPreview = {
      conversationId: convId,
      invoiceId: invoiceNumeric,
      otherAddress: addr,
      lastMessage: "",
      lastFrom: "",
      lastAt: new Date().toISOString(),
    };

    setConversations((prev) => {
      const exists = prev.some(
        (c) => c.conversationId === preview.conversationId
      );
      if (exists) return prev;
      return [preview, ...prev];
    });
    setSelected(preview);
    setMessages([]);
    setNewInvoiceId("");
    setNewCounterparty("");
  };

  const otherLabel = isMsme ? "Investor" : "MSME";

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-4 w-4" />
            Messages
          </CardTitle>
          <CardDescription className="text-xs">
            View all your invoice conversations and continue chatting in one
            place.
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7"
          disabled={isLoadingConversations}
          onClick={() => {
            setReloadKey((v) => v + 1);
          }}
          title="Refresh conversations"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 rounded-md border bg-muted/40 p-3">
          <p className="text-xs font-medium">Start a new conversation</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={newInvoiceId}
              onChange={(e) => setNewInvoiceId(e.target.value)}
              placeholder="Invoice ID"
              className="h-8 text-xs sm:max-w-[110px]"
            />
            <Input
              value={newCounterparty}
              onChange={(e) => setNewCounterparty(e.target.value)}
              placeholder={`${otherLabel} wallet (0x...)`}
              className="h-8 text-xs flex-1"
            />
            <Button
              type="button"
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={handleStartNewConversation}
            >
              Start
            </Button>
          </div>
          {formError && (
            <p className="text-[11px] text-destructive mt-1">{formError}</p>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.5fr)]">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Conversations
            </p>
            <div className="flex flex-col gap-1 max-h-72 overflow-y-auto rounded-md border bg-background/60 p-1">
              {isLoadingConversations ? (
                <p className="text-xs text-muted-foreground p-3">
                  Loading conversations...
                </p>
              ) : conversations.length === 0 ? (
                <p className="text-xs text-muted-foreground p-3">
                  No conversations yet. Start a new chat above or from an
                  invoice.
                </p>
              ) : (
                conversations.map((conv) => {
                  const isActive =
                    selected &&
                    selected.conversationId === conv.conversationId;
                  const lastAt = conv.lastAt
                    ? new Date(conv.lastAt).toLocaleString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                        month: "short",
                        day: "2-digit",
                      })
                    : "";
                  return (
                    <button
                      key={conv.conversationId}
                      type="button"
                      onClick={() => setSelected(conv)}
                      className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-xs transition-colors ${
                        isActive
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-accent/60"
                      }`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">
                          Invoice #{conv.invoiceId}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {shortAddress(conv.otherAddress)}
                        </span>
                        {conv.lastMessage && (
                          <span className="line-clamp-1 text-[11px] text-muted-foreground">
                            {conv.lastMessage}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {lastAt && (
                          <span className="text-[10px] text-muted-foreground">
                            {lastAt}
                          </span>
                        )}
                        <Badge
                          variant={"outline"}
                          className="px-1 py-0 text-[10px] font-normal"
                        >
                          {otherLabel}
                        </Badge>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              Conversation
            </p>
            <div className="flex flex-col rounded-md border bg-background/60">
              {selected ? (
                <div className="flex items-center justify-between border-b px-3 py-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium">
                      Invoice #{selected.invoiceId}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {shortAddress(selected.otherAddress)}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="px-2 py-0 text-[10px] font-normal"
                  >
                    Chat with {otherLabel}
                  </Badge>
                </div>
              ) : (
                <div className="px-3 py-4 text-xs text-muted-foreground">
                  Select a conversation from the left or start a new one above.
                </div>
              )}

              {selected && (
                <>
                  <div className="flex-1 min-h-[220px] max-h-[320px] overflow-y-auto px-3 py-2 space-y-2">
                    {isLoadingMessages && messages.length === 0 ? (
                      <p className="text-xs text-muted-foreground mt-4">
                        Loading messages...
                      </p>
                    ) : messages.length === 0 && !isOtherTyping ? (
                      <p className="text-xs text-muted-foreground mt-4">
                        No messages yet. Start the conversation with the
                        {" "}
                        {otherLabel.toLowerCase()}.
                      </p>
                    ) : null}

                    {messages.map((msg) => {
                      const isMine =
                        lowerWallet &&
                        msg.fromAddress.toLowerCase() === lowerWallet;
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
                              {new Date(msg.createdAt).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
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
                          <span className="ml-1">{otherLabel} is typing...</span>
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
                          selected
                            ? `Message the ${otherLabel.toLowerCase()}...`
                            : "Select a conversation to start chatting..."
                        }
                        className="min-h-[40px] max-h-[80px] text-xs resize-none"
                        rows={2}
                        disabled={!selected}
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter" &&
                            !event.shiftKey &&
                            selected
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
                          isSending || !input.trim() || !selected
                        }
                        onClick={() => void handleSend()}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
