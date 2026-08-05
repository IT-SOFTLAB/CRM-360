export default function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm bg-white text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-white/5">
        <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:120ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:240ms]" />
        <span className="ml-1 text-gray-500 dark:text-slate-400">AI is thinking</span>
      </div>
    </div>
  );
}