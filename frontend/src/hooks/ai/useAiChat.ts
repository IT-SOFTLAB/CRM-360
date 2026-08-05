"use client";

import { useState } from "react";
import axios from "axios";
import { ChatMessage } from "@/types/ai";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function useAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  async function sendMessage(text: string) {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      type: "text",
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/ai/chat`, {
        message: text,
      });
console.log("RAW RESPONSE =>", response.data);
      const ai = response.data.result.ai;

const aiMessage: ChatMessage = {
  id: crypto.randomUUID(),
  role: "assistant",
  type: ai.type || "text",
  content: ai.reply || ai.message,
  title: ai.title,
  rows: ai.rows,
  action: ai.action,
  payload: ai.payload,
};

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          type: "text",
          content: "❌ Unable to contact AI server.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return {
    messages,
    loading,
    sendMessage,
    setMessages,
  };
}