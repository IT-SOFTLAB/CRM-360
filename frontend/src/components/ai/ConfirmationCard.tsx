"use client";

import axios from "axios";
import { ChatMessage } from "@/types/ai";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Props {
  message: ChatMessage;
}

export default function ConfirmationCard({ message }: Props) {
  async function confirmAction() {
    try {
      await axios.post(`${API_BASE}/api/ai/execute`, {
        action: message.action,
        payload: message.payload,
      });

      alert("Action completed successfully.");
    } catch (error) {
      alert("Failed to execute action.");
    }
  }

  return (
    <div className="rounded-xl border p-4 bg-yellow-50 border-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/20">
      <p className="mb-3 text-sm font-medium text-gray-800 dark:text-yellow-100">
        {message.content}
      </p>

      <div className="flex gap-2">
        <button
          onClick={confirmAction}
          className="rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
        >
          Confirm
        </button>

        <button className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-100 border-gray-300 text-gray-700 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
          Cancel
        </button>
      </div>
    </div>
  );
}