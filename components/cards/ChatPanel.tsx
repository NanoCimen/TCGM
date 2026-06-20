"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type ChatMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
};

export default function ChatPanel({
  cardId,
  otherUserId,
  otherUserName,
  currentUserId,
  initialMessages = [],
}: {
  cardId: string;
  otherUserId: string;
  otherUserName: string;
  currentUserId: string;
  initialMessages?: ChatMessage[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [loading, setLoading] = useState(initialMessages.length === 0);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch messages if no initial data
  useEffect(() => {
    if (initialMessages.length > 0) {
      setLoading(false);
      return;
    }
    fetch(`/api/messages?card_id=${cardId}&with_user=${otherUserId}`)
      .then((r) => r.json())
      .then(({ data }) => {
        setMessages(data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId, otherUserId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Real-time subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat-${cardId}-${[currentUserId, otherUserId].sort().join("-")}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `card_id=eq.${cardId}`,
        },
        (payload) => {
          const msg = payload.new as ChatMessage;
          const isOurThread =
            (msg.sender_id === currentUserId && msg.receiver_id === otherUserId) ||
            (msg.sender_id === otherUserId && msg.receiver_id === currentUserId);
          if (!isOurThread) return;
          setMessages((prev) => {
            // Replace temp optimistic message if id matches, otherwise append
            const tempIdx = prev.findIndex(
              (m) => m.id.startsWith("temp-") && m.content === msg.content && m.sender_id === msg.sender_id
            );
            if (tempIdx !== -1) {
              const next = [...prev];
              next[tempIdx] = msg;
              return next;
            }
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cardId, currentUserId, otherUserId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;
    setError("");
    setInput("");
    setSending(true);

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    const tempMsg: ChatMessage = {
      id: tempId,
      sender_id: currentUserId,
      receiver_id: otherUserId,
      content,
      read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card_id: cardId, receiver_id: otherUserId, content }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setError(json.error ?? "Error al enviar");
        setInput(content);
      }
      // Real-time subscription will replace the temp message
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setError("Error de conexión");
      setInput(content);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="border border-white/[0.07] rounded-2xl overflow-hidden bg-white/[0.015]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
        <p className="text-xs font-bold text-gray-400 truncate">
          Chat con <span className="text-white">{otherUserName}</span>
        </p>
      </div>

      {/* Messages */}
      <div className="h-52 overflow-y-auto px-4 py-3 space-y-2 scroll-smooth">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-xs text-gray-600 text-center py-8">
            Empieza la conversación con {otherUserName}
          </p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === currentUserId;
            const isTemp = msg.id.startsWith("temp-");
            return (
              <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed transition-opacity ${
                    isOwn
                      ? "bg-brand text-black rounded-br-sm"
                      : "bg-white/[0.07] text-gray-200 rounded-bl-sm"
                  } ${isTemp ? "opacity-60" : "opacity-100"}`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/[0.06] p-3">
        {error && <p className="text-[11px] text-red-400 mb-2">{error}</p>}
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe un mensaje..."
            maxLength={1000}
            className="flex-1 bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-600 outline-none focus:border-brand/30 focus:ring-1 focus:ring-brand/10 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-brand text-black hover:bg-[#00c64b] transition-colors disabled:opacity-40 flex-shrink-0"
          >
            {sending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Send className="w-3 h-3" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
