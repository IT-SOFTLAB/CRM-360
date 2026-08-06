"use client";

import { useState } from "react";
import { X, Sparkles } from "lucide-react";
import { useAiChat } from "@/hooks/ai/useAiChat";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import ConfirmationCard from "./ConfirmationCard";
import Image from "next/image";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ChatDrawer({ open, onClose }: Props) {
  const [input, setInput] = useState("");
  const { messages, loading, sendMessage } = useAiChat();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div
        className="
          flex h-[90vh] w-full flex-col overflow-hidden
          rounded-3xl border shadow-2xl transition-colors
          bg-white border-gray-200 text-gray-900
          dark:bg-[#0f172a] dark:border-white/10 dark:text-white
          md:w-[92vw]
          lg:w-[78vw]
          xl:w-[65vw]
          2xl:w-[58vw]
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4 border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/10">
              <Image
                src="/ai-avatar.jpg"
                alt="CRM AI"
                fill
                className="object-cover"
                priority
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold">CRM AI Assistant</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Ask anything about leads, activities, pipeline and reports
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 bg-gray-50 dark:bg-transparent">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <div className="max-w-md text-center text-gray-500 dark:text-slate-400">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-600/15 dark:text-blue-400">
                  <Sparkles className="h-8 w-8" />
                </div>

                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                  Welcome to CRM AI
                </h3>


              </div>
            </div>
          )}

          {messages.map(msg =>
            msg.type === "confirmation" ? (
              <ConfirmationCard key={msg.id} message={msg} />
            ) : (
              <MessageBubble key={msg.id} message={msg} />
            )
          )}

          {loading && <TypingIndicator />}
        </div>

        {/* Input */}
        <div className="border-t p-4 border-gray-200 bg-white dark:border-white/10 dark:bg-[#111827]">
          <div className="flex items-end gap-3 rounded-2xl border p-3 border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-[#1e293b]">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();

                  if (input.trim()) {
                    sendMessage(input);
                    setInput("");
                  }
                }
              }}
              placeholder="Ask CRM AI anything..."
              rows={1}
              className="max-h-40 flex-1 resize-none bg-transparent px-1 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none dark:text-white dark:placeholder:text-slate-500"
            />

            <button
              onClick={() => {
                if (input.trim()) {
                  sendMessage(input);
                  setInput("");
                }
              }}
              disabled={!input.trim()}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </div>

          <p className="mt-2 text-center text-[11px] text-gray-400 dark:text-slate-500">
            Press Enter to send • Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}