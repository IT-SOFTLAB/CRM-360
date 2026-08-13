"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import FloatingChatButton from "@/components/ai/FloatingChatButton";
import ChatDrawer from "@/components/ai/ChatDrawer";

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/accept-invitation") {
    return null;
  }

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