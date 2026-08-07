"use client";

import { useEffect, useRef, useState } from "react";
import aiService from "@/services/ai.service";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Message = {
  role: "user" | "assistant";
  text: string;
};

export default function ChatDrawer({ open, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "👋 Hello! I am your CRM-360 AI Assistant.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  if (!open) return null;

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;

    setMessages((prev) => [
      ...prev,
      { role: "user", text: userMessage },
    ]);

    setInput("");
    setLoading(true);

    try {
      const data = await aiService.sendMessage(userMessage);

      const result = data.result;

      let reply = "Action completed.";

      if (result?.results?.steps) {
        reply = result.results.steps
          .map((step: any) => {
            if (step.result?.message) return `• ${step.result.message}`;
            if (step.message) return `• ${step.message}`;
            return null;
          })
          .filter(Boolean)
          .join("\n");
      } else if (result?.confirmation) {
        reply = result.message;
      } else if (result?.message) {
        reply = result.message;
      } else if (result?.ai?.reply) {
        reply = result.ai.reply;
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: reply },
      ]);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "❌ Unable to connect to AI server.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: 420,
        height: "100vh",
        background: "#ffffff",
        borderLeft: "1px solid #e5e7eb",
        boxShadow: "-10px 0 25px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        zIndex: 2000,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: 16,
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: 600,
        }}
      >
        CRM-360 AI Assistant

        <button
          onClick={onClose}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: 20,
          }}
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 16,
          background: "#f9fafb",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent:
                m.role === "user" ? "flex-end" : "flex-start",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                maxWidth: "80%",
                padding: "10px 14px",
                borderRadius: 14,
                whiteSpace: "pre-wrap",
                background:
                  m.role === "user" ? "#2563eb" : "#ffffff",
                color: m.role === "user" ? "#ffffff" : "#111827",
                border:
                  m.role === "assistant"
                    ? "1px solid #e5e7eb"
                    : "none",
              }}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ color: "#6b7280", fontSize: 14 }}>
            AI is thinking...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: 16,
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          gap: 8,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask CRM AI..."
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #d1d5db",
            outline: "none",
          }}
        />

        <button
          onClick={handleSend}
          disabled={loading}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "none",
            background: loading ? "#9ca3af" : "#2563eb",
            color: "white",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}