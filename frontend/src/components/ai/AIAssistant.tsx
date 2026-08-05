"use client";

import { useState } from "react";
import FloatingChatButton from "@/components/ai/FloatingChatButton";
import ChatDrawer from "@/components/ai/ChatDrawer";

export default function AIAssistant() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {!open && (
        <FloatingChatButton onClick={() => setOpen(true)} />
      )}

      <ChatDrawer
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}