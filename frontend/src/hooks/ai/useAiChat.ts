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
      const response = await axios.post(`${API_BASE}/api/ai/chat`, {
        message: text,
      });

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        type: response.data.type || "text",
        content: response.data.reply || response.data.message,
        title: response.data.title,
        rows: response.data.rows,
        action: response.data.action,
        payload: response.data.payload,
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