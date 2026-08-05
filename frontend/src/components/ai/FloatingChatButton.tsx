"use client";

import { MessageCircle } from "lucide-react";

interface Props {
  onClick: () => void;
}

export default function FloatingChatButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-[100] flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl transition-all duration-200 hover:scale-105 hover:bg-blue-700"
      aria-label="Open AI Assistant"
    >
      <MessageCircle className="h-7 w-7" />
    </button>
  );
}