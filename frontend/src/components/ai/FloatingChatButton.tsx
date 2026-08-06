"use client";

import Image from "next/image";

interface Props {
  onClick: () => void;
}

export default function FloatingChatButton({ onClick }: Props) {
  return (<button
  onClick={onClick}
  className="
    fixed bottom-6 right-6 z-50
    rounded-full
    bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400
    p-[4px] shadow-xl
    transition hover:scale-105 hover:shadow-blue-400/50
  "
>
  <div className="h-16 w-16 overflow-hidden rounded-full bg-white">
    <img
      src="/ai-avatar.jpg"
      alt="CRM AI Assistant"
      className="h-full w-full object-cover"
    />
  </div>
</button>
  );
}

