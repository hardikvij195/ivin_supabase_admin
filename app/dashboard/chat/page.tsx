"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MessageUnit = {
  id: string;
  role: string;
  content: string;
  created_at: string;
  sender_id?: string | null;
};

export default function ChatPage() {
  const searchParams = useSearchParams();
  const dealerId = searchParams.get("dealerId");
  const reportId = searchParams.get("reportId");
  const vehicle = searchParams.get("vehicle");

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageUnit[]>([]);
  const [draft, setDraft] = useState("");
  const draftRef = useRef<HTMLInputElement | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabaseBrowser.auth.getUser().then((res) => {
      if (res.data?.user) setCurrentUserId(res.data.user.id);
    });
  }, []);

  // Load existing conversation if needed
  useEffect(() => {
    if (!dealerId || !reportId || !currentUserId) return;

    const load = async () => {
      const { data: existing } = await supabaseBrowser
        .from("messages")
        .select("*")
        .eq("user_id", currentUserId)
        .eq("metadata->>dealer_id", dealerId)
        .eq("metadata->>report_id", reportId)
        .maybeSingle();

      if (existing) {
        setConversationId(existing.conversation_id);
        setMessages(existing.thread || []);
      }
    };

    load();
  }, [dealerId, reportId, currentUserId]);

  const sendMessage = async () => {
    if (!draft.trim() || !currentUserId) return;

    const convId = conversationId ?? crypto.randomUUID();
    if (!conversationId) {
      await supabaseBrowser.from("messages").insert({
        user_id: currentUserId,
        conversation_id: convId,
        thread: [],
        metadata: { dealer_id: dealerId, report_id: reportId },
        title: vehicle,
      });
      setConversationId(convId);
    }

    const newMsg: MessageUnit = {
      id: crypto.randomUUID(),
      role: "superadmin",
      content: draft,
      created_at: new Date().toISOString(),
      sender_id: currentUserId,
    };

    const updatedThread = [...messages, newMsg];
    await supabaseBrowser
      .from("messages")
      .update({ thread: updatedThread, updated_at: new Date().toISOString() })
      .eq("conversation_id", convId);

    setMessages(updatedThread);
    setDraft("");
    draftRef.current?.focus();
  };

  return (
      <div className=" w-full bg-white p-10 flex flex-col h-full rounded-xl">
          <h2 className="text-lg font-semibold mb-3">Chat about {vehicle}</h2>
          <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
            {messages.map((msg) => {
              const mine = msg.sender_id === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "p-2 rounded-lg text-sm max-w-[75%]",
                    mine
                      ? "bg-purple-600 text-white self-end ml-auto"
                      : "bg-gray-100 text-gray-800 self-start"
                  )}
                >
                  {msg.content}
                  <div className="text-[10px] mt-1 opacity-70">{new Date(msg.created_at).toLocaleString()}</div>
                </div>
              );
            })}
          </div>
          <div className="flex mt-3 gap-2">
            <Input
              ref={draftRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button onClick={sendMessage} disabled={!draft.trim()} className="text-white">
              Send
            </Button>
          </div>
        </div>

  );
}
