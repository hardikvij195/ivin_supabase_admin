"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { formatDistanceToNow } from "date-fns";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Modal from "@/app/dashboard/_components/Modal";
import { cn } from "@/lib/utils";

// Types
type CarfaxReport = {
  id: string;
  created_at: string;
  vin: string | null;
  data: any | null;
  report_type: string | null;
  user_id: string | null; // Dealer who owns the report
};

type MessageUnit = {
  id: string;
  role: string;
  content: string;
  created_at: string;
  sender_id?: string | null;
};

type ConversationRow = {
  conversation_id: string;
  thread: MessageUnit[] | null;
  updated_at: string | null;
  user_id?: string | null;
  metadata?: { dealer_id: string; report_id: string };
  title?: string | null;
};

// Helpers
const newId = () =>
  (crypto as any)?.randomUUID
    ? (crypto as any).randomUUID()
    : Math.random().toString(36).slice(2);

const ensureArray = <T,>(v: T[] | null | undefined): T[] =>
  Array.isArray(v) ? v : [];

// Simple skeleton loader
function ReportSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 animate-pulse">
      <div className="h-4 w-1/2 bg-gray-200 rounded mb-3"></div>
      <div className="h-3 w-2/3 bg-gray-200 rounded mb-2"></div>
      <div className="h-3 w-1/3 bg-gray-200 rounded mb-2"></div>
      <div className="h-3 w-1/4 bg-gray-200 rounded mb-2"></div>
      <div className="h-8 w-full bg-gray-200 rounded mt-4"></div>
    </div>
  );
}

export default function CarfaxWallPage() {
  const [reports, setReports] = useState<CarfaxReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [conversation, setConversation] = useState<ConversationRow | null>(null);
  const [draft, setDraft] = useState("");
  const draftRef = useRef<HTMLInputElement | null>(null);
  const [activeVehicle, setActiveVehicle] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [pendingDealer, setPendingDealer] = useState<string | null>(null);
  const [pendingReport, setPendingReport] = useState<string | null>(null);

  // Load reports + user
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const { data } = await supabaseBrowser
          .from("carfax_reports")
          .select("*")
          .order("created_at", { ascending: false });
        setReports(data || []);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();

    supabaseBrowser.auth.getUser().then((res) => {
      if (res.data?.user) setCurrentUserId(res.data.user.id);
    });
  }, []);

  const filtered = reports.filter((r) =>
    (r.vin || "").toLowerCase().includes(search.toLowerCase())
  );

  // Open chat modal
  const handleChat = async (dealerId: string, reportId: string, vehicleLabel: string) => {
    const { data: userRes } = await supabaseBrowser.auth.getUser();
    const currentUser = userRes?.user;
    if (!currentUser) {
      alert("You must be logged in to chat.");
      return;
    }

    // reset draft on open
    setDraft("");

    // 1. Check if conversation exists
    const { data: existing } = await supabaseBrowser
      .from("messages")
      .select("*")
      .eq("user_id", currentUser.id)
      .eq("metadata->>dealer_id", dealerId)
      .eq("metadata->>report_id", reportId)
      .maybeSingle();

    if (existing) {
      setConversation({
        conversation_id: existing.conversation_id,
        thread: existing.thread,
        updated_at: existing.updated_at,
        user_id: existing.user_id,
        metadata: existing.metadata,
        title: existing.title,
      });
    } else {
      // ⚡ Do not create yet — wait until user sends a message
      setConversation(null);
      setPendingDealer(dealerId);
      setPendingReport(reportId);
    }

    setActiveVehicle(vehicleLabel);
    setIsChatOpen(true);
  };

  // Send message
  const sendMessage = async () => {
    if (!draft.trim() || !currentUserId) return;

    let convId = conversation?.conversation_id;

    // If no conversation exists yet, create one now with vehicle name as title
    if (!convId) {
      convId = newId();
      const { data: created } = await supabaseBrowser
        .from("messages")
        .insert({
          user_id: currentUserId,
          conversation_id: convId,
          thread: [],
          metadata: { dealer_id: pendingDealer, report_id: pendingReport },
          title: activeVehicle, // ✅ Save vehicle name as title
        })
        .select()
        .single();

      setConversation({
        conversation_id: created.conversation_id,
        thread: created.thread,
        updated_at: created.updated_at,
        user_id: created.user_id,
        metadata: created.metadata,
        title: created.title,
      });
    }

    const newMsg: MessageUnit = {
      id: newId(),
      role: "superadmin", // ✅ wall user is superadmin
      content: draft,
      created_at: new Date().toISOString(),
      sender_id: currentUserId,
    };

    const freshThread = ensureArray(conversation?.thread);
    const updatedThread = [...freshThread, newMsg];

    await supabaseBrowser
      .from("messages")
      .update({ thread: updatedThread, updated_at: new Date().toISOString() })
      .eq("conversation_id", convId);

    // Optimistic update
    setConversation((prev) =>
      prev
        ? { ...prev, thread: updatedThread, updated_at: new Date().toISOString() }
        : prev
    );

    setDraft("");
    draftRef.current?.focus();
  };

  const activeThread = useMemo(() => ensureArray(conversation?.thread), [conversation]);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3 gap-3 pt-4 shrink-0 sticky top-0 z-10 ">
        <h1 className="text-xl sm:text-2xl font-semibold">The Wall</h1>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3 shrink-0 sticky top-[56px] z-10 pb-3 ">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="pl-10 rounded-3xl bg-white"
          />
        </div>
      </div>

      {/* Scrollable Cards grid */}
      <div className="flex-1 overflow-y-auto lg:pb-[12%] md:pb-[12%] pb-[30%]">
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-5">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <ReportSkeleton key={i} />)
            : filtered.map((report) => {
                const vehicle = report.data?.VehicleDetailsViewModel || {};
                const make = vehicle.VehicleMake || "Unknown";
                const model = vehicle.VehicleModel || "";
                const year = vehicle.VehicleYear || "";
                const vehicleLabel = `${year} ${make} ${model}`;
                const generatedAgo = formatDistanceToNow(new Date(report.created_at), { addSuffix: true });

                return (
                  <div
                    key={report.id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col justify-between"
                  >
                    {/* Top info */}
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h2 className="text-sm font-semibold text-purple-700 uppercase">
                          {vehicleLabel}
                        </h2>
                        <span className="text-xs text-gray-500">{generatedAgo}</span>
                      </div>

                      <p className="text-sm font-mono tracking-wide mb-2">
                        {report.vin?.slice(0, 3) + "************" + report.vin?.slice(-3)}
                      </p>

                      <div className="mt-3 text-sm text-gray-600 space-y-0.5">
                        <p>Make: {make}</p>
                        <p>Model: {model}</p>
                        <p>Year: {year}</p>
                      </div>
                    </div>

                    {/* Bottom action */}
                    <div className="mt-4">
                      <p className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-lg mb-3">
                        Looking to Sell this {vehicleLabel} Soon
                      </p>
                      <Button
                        variant="outline"
                        className="w-full rounded-full border-purple-600 text-purple-700 hover:bg-purple-50"
                        onClick={() => handleChat(report.user_id!, report.id, vehicleLabel)}
                      >
                        Chat with Dealer
                      </Button>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>

      {/* Chat Modal */}
      <Modal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)}>
        <div className="max-w-lg w-full bg-white p-5 flex flex-col h-[70vh]">
          <h2 className="text-lg font-semibold mb-3">Chat about {activeVehicle}</h2>
          <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
            {activeThread.map((msg) => {
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
      </Modal>
    </div>
  );
}
