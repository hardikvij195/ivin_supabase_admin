"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Send, Loader2, MessageSquare, ChevronLeft } from "lucide-react";

/** ===== Types ===== */
type MessageUnit = {
  id: string;
  role: "user" | "superadmin" | "system" | string;
  content: string;
  created_at: string;
  sender_id?: string | null;
};

export type ConversationRow = {
  id: string;
  user_id: string | null;
  conversation_id: string | null;
  thread: MessageUnit[] | null;
  title: string | null;
  created_at: string;
  updated_at: string | null;
  metadata: Record<string, any> | null;
};

/** Helpers */
const newId = () =>
  (crypto as any)?.randomUUID ? (crypto as any).randomUUID() : Math.random().toString(36).slice(2);
const ensureArray = <T,>(v: T[] | null | undefined): T[] => (Array.isArray(v) ? v : []);

/** ===== Component ===== */
export default function AdminMessagesPage() {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showListOnMobile, setShowListOnMobile] = useState(true);

  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);

  const [draft, setDraft] = useState("");
  const draftRef = useRef<HTMLTextAreaElement | null>(null);

  /** Load conversations */
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      try {
        const { data, error } = await supabaseBrowser
          .from("messages")
          .select("*")
          .order("updated_at", { ascending: false, nullsFirst: false });

        if (error) throw error;
        if (cancelled) return;

        const rows = (data ?? []) as ConversationRow[];
        setConversations(rows);
        setActiveConversation(rows[0]?.conversation_id ?? null);

        supabaseBrowser
          .channel("admin-messages")
          .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, (payload: any) => {
            const row = payload.new as ConversationRow;
            setConversations((prev) => upsertRow(prev, row));
          })
          .subscribe();
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load conversations");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
      try {
        supabaseBrowser.removeAllChannels();
      } catch {}
    };
  }, []);

  const activeThread: MessageUnit[] = useMemo(() => {
    if (!activeConversation) return [];
    const row = conversations.find((c) => c.conversation_id === activeConversation);
    return ensureArray<MessageUnit>(row?.thread).sort(
      (a, b) => +new Date(a.created_at) - +new Date(b.created_at)
    );
  }, [conversations, activeConversation]);

  async function handleSend() {
    if (!activeConversation) return;
    const content = draft.trim();
    if (!content) return;

    const newMsg: MessageUnit = {
      id: newId(),
      role: "superadmin", // ✅ superadmin role
      content,
      created_at: new Date().toISOString(),
      sender_id: "superadmin", // ✅ sender_id as superadmin
    };

    setSending(true);
    setError(null);

    // Optimistic update
    setConversations((prev) =>
      prev.map((c) =>
        c.conversation_id === activeConversation
          ? { ...c, thread: [...ensureArray<MessageUnit>(c.thread), newMsg], updated_at: new Date().toISOString() }
          : c
      )
    );
    setDraft("");

    try {
      const { data: fresh } = await supabaseBrowser
        .from("messages")
        .select("thread")
        .eq("conversation_id", activeConversation)
        .single();

      const freshThread = ensureArray<MessageUnit>(fresh?.thread as MessageUnit[]);
      const updatedThread = [...freshThread, newMsg];

      await supabaseBrowser
        .from("messages")
        .update({ thread: updatedThread, updated_at: new Date().toISOString() })
        .eq("conversation_id", activeConversation);
    } catch (e: any) {
      setError(e?.message || "Failed to send message");
    } finally {
      setSending(false);
      draftRef.current?.focus();
    }
  }

  const sidebarItems = useMemo(() => {
    return conversations
      .map((c) => {
        const thread = ensureArray<MessageUnit>(c.thread);
        const last = thread[thread.length - 1];
        return {
          conversation_id: (c.conversation_id ?? c.id) as string,
          title: c.title || "Conversation",
          preview: last?.content || "",
          last_created_at: last ? new Date(last.created_at).getTime() : new Date(c.created_at).getTime(),
        };
      })
      .sort((a, b) => b.last_created_at - a.last_created_at);
  }, [conversations]);

  return (
    <div className="h-[85vh] grid grid-cols-1 md:grid-cols-[320px_1fr] lg:grid-cols-[320px_1fr] bg-white border border-gray-200 rounded-lg overflow-hidden">
      <aside
        className={cn(
          "border-r border-r-gray-200 bg-white p-3 md:p-4 overflow-y-auto",
          !showListOnMobile && "hidden md:block"
        )}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Conversations
          </h2>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 rounded-md bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : sidebarItems.length === 0 ? (
          <div className="text-sm text-gray-500 bg-white rounded-md p-4 text-center">
            No conversations yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {sidebarItems.map((c) => (
              <li key={c.conversation_id}>
                <div
                  className={cn(
                    "w-full text-left rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition",
                    c.conversation_id === activeConversation && "border-purple-600 bg-purple-50"
                  )}
                  onClick={() => {
                    setActiveConversation(c.conversation_id);
                    setShowListOnMobile(false);
                  }}
                >
                  <div className="font-medium truncate">{c.title}</div>
                  <div className="text-xs text-gray-500 truncate">{c.preview}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <section className="flex flex-col h-full bg-white">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between p-3 border-b border-b-gray-200 bg-white">
          <Button variant="ghost" size="icon" onClick={() => setShowListOnMobile(true)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-sm font-medium truncate">
            {sidebarItems.find((c) => c.conversation_id === activeConversation)?.title || "Conversation"}
          </div>
          <div className="w-9" />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3 bg-white">
          {!activeConversation ? (
            <div className="h-full grid place-items-center text-gray-500">Select a conversation</div>
          ) : activeThread.length === 0 ? (
            <div className="h-full grid place-items-center text-gray-500">No messages yet</div>
          ) : (
            activeThread.map((m) => (
              <MessageBubble key={m.id} content={m.content} created_at={m.created_at} mine={m.role === "superadmin"} />
            ))
          )}
        </div>

        {activeConversation && (
          <div className="border-t border-t-gray-200 bg-white p-3 md:p-4">
            <div className="flex items-end gap-2">
              <Textarea
                ref={draftRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type your reply…"
                className="min-h-[44px] border-gray-200 max-h-40 h-12 resize-y"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button onClick={handleSend} disabled={sending || !draft.trim()}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 text-white" />}
              </Button>
            </div>
            {error && <div className="text-xs text-red-600 mt-2">{error}</div>}
          </div>
        )}
      </section>
    </div>
  );
}

function MessageBubble({ content, created_at, mine }: { content: string; created_at: string; mine: boolean }) {
  return (
    <div className={cn("w-full flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] md:max-w-[70%] rounded-2xl border px-3 py-2 text-sm leading-relaxed",
          mine
            ? "bg-purple-600 text-white border-purple-600"
            : "bg-gray-100 text-gray-900 border border-gray-200"
        )}
      >
        <div className="whitespace-pre-wrap break-words">{content}</div>
        <div className={cn("mt-1 text-[10px]", mine ? "text-purple-100" : "text-gray-500")}>
          {new Date(created_at).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

/** Utils */
function upsertRow(list: ConversationRow[], row: ConversationRow) {
  const idx = list.findIndex((r) => r.id === row.id);
  if (idx === -1) return [row, ...list];
  const copy = [...list];
  copy[idx] = row;
  return copy;
}
