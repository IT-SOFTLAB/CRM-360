export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    type?: "text" | "confirmation" | "table";
    content?: string; title?: string;
    rows?: any[]; action?: string;
    payload?: any;
}