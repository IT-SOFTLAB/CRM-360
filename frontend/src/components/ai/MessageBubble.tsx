import { ChatMessage } from "@/types/ai";

interface Props {
  message: ChatMessage;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
          isUser
            ? "bg-blue-600 text-white rounded-br-md"
            : "bg-white text-gray-900 border border-gray-200 rounded-bl-md dark:bg-slate-800 dark:text-slate-100 dark:border-white/5"
        }`}
      >
        <p className="whitespace-pre-wrap leading-6">
          {message.content}
        </p>
      </div>
    </div>
  );
}