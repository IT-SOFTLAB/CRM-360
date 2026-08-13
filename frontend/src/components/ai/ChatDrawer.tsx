"use client";

import { useEffect, useRef, useState } from "react";
import aiService from "@/services/ai.service";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Message = {
  role: "user" | "assistant";
  text: string;
};

export default function ChatDrawer({ open, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "👋 Hello! I am your CRM-360 AI Agent.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  if (!open) return null;

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;

    setMessages((prev) => [
      ...prev,
      { role: "user", text: userMessage },
    ]);

    setInput("");
    setLoading(true);

    try {
      const data = await aiService.sendMessage(userMessage);

      const result = data.result;

      let reply = "Action completed.";

      if (result?.results?.steps) {
        reply = result.results.steps
          .map((step: any) => {
            if (step.result) {
              let msg = `• ${step.result.message || "Action completed."}`;
              
              if (step.result.data) {
                const data = step.result.data;
                
                if (step.tool === "dashboard" && step.action === "summary") {
                  msg += `\n\n📊 Key Metrics:` +
                         `\n- Total Leads: ${data.totalLeads ?? 0}` +
                         `\n- Total Opportunities: ${data.totalOpportunities ?? 0}` +
                         `\n- Won Deals: ${data.wonDeals ?? 0}` +
                         `\n- Lost Deals: ${data.lostDeals ?? 0}` +
                         `\n- Win Rate: ${data.winRate ?? 0}%` +
                         `\n- Pipeline Value: ₹${(data.pipelineValue ?? 0).toLocaleString()}` +
                         `\n- Average Deal Size: ₹${(data.averageDealSize ?? 0).toLocaleString()}` +
                         `\n- Largest Deal: ₹${(data.largestDeal ?? 0).toLocaleString()}` +
                         `\n- Smallest Deal: ₹${(data.smallestDeal ?? 0).toLocaleString()}` +
                         `\n- Today's Activities: ${data.todayActivities ?? 0}` +
                         `\n- Pending Activities: ${data.pendingActivities ?? 0}`;

                  if (data.pipelineStages && Object.keys(data.pipelineStages).length > 0) {
                    msg += `\n\n📈 Pipeline Stages:`;
                    Object.entries(data.pipelineStages).forEach(([stage, count]) => {
                      msg += `\n- ${stage}: ${count}`;
                    });
                  }

                  if (data.leadCategories && Object.keys(data.leadCategories).length > 0) {
                    msg += `\n\n🏷️ Lead Categories:`;
                    Object.entries(data.leadCategories).forEach(([category, count]) => {
                      msg += `\n- ${category}: ${count}`;
                    });
                  }
                } else if (step.tool === "lead" && step.action === "search" && Array.isArray(data)) {
                  if (data.length > 0) {
                    msg += `\n\n🔍 Found Leads:`;
                    data.forEach((lead: any) => {
                      msg += `\n- ${lead.contactName || lead.name || "Unnamed"} (${lead.company || "No Company"})` +
                             `\n  Status: ${lead.status || "N/A"} | Category: ${lead.category || "None"}` +
                             `\n  Value: ₹${(lead.dealValue ?? 0).toLocaleString()}`;
                    });
                  }
                } else if ((step.tool === "client" || step.tool === "customer") && Array.isArray(data)) {
                  if (data.length > 0) {
                    msg += `\n\n💼 Client Details:`;
                    data.forEach((client: any) => {
                      const name = client.customerName || client.name || "Unnamed Client";
                      const company = client.company ? ` (${client.company})` : "";
                      const val = client.dealValue !== undefined && client.dealValue !== null ? `₹${Number(client.dealValue).toLocaleString()}` : "N/A";
                      const status = client.status ? ` | Status: ${client.status}` : "";
                      const salesperson = client.assignedSalesperson ? ` | Salesperson: ${client.assignedSalesperson}` : "";
                      const contactInfo = [client.email, client.phone].filter(Boolean).join(" | ");

                      msg += `\n- ${name}${company}` +
                             `\n  Deal Value: ${val}${status}${salesperson}` +
                             (contactInfo ? `\n  Contact: ${contactInfo}` : "");
                    });
                  }
                } else if (step.tool === "report" && step.action === "generate" && data) {
                  const summary = data.summary;
                  msg += `\n\n📋 ${data.title || "CRM Performance Report"}` +
                         `\nGenerated at: ${new Date(data.generatedAt).toLocaleString()}` +
                         `\n\n📊 Performance Summary:` +
                         `\n- Total Leads: ${summary.totalLeads ?? 0}` +
                         `\n- Total Opportunities: ${summary.totalOpportunities ?? 0}` +
                         `\n- Won / Lost Deals: ${summary.wonDeals ?? 0} / ${summary.lostDeals ?? 0}` +
                         `\n- Win Rate: ${summary.winRate ?? 0}%` +
                         `\n- Pipeline Value: ₹${(summary.pipelineValue ?? 0).toLocaleString()}` +
                         `\n- Average Deal Size: ₹${(summary.averageDealSize ?? 0).toLocaleString()}` +
                         `\n- Today's Activities: ${summary.todayActivities ?? 0}` +
                         `\n- Pending Activities: ${summary.pendingActivities ?? 0}`;

                  if (summary.pipelineStages && Object.keys(summary.pipelineStages).length > 0) {
                    msg += `\n\n📈 Pipeline Stages:`;
                    Object.entries(summary.pipelineStages).forEach(([stage, count]) => {
                      msg += `\n- ${stage}: ${count}`;
                    });
                  }
                } else if (Array.isArray(data) && data.length > 0) {
                  msg += `\n\n📋 Details:`;
                  data.forEach((item: any) => {
                    const name = item.customerName || item.contactName || item.name || item.title || "Item";
                    const company = item.company && item.company !== name ? ` (${item.company})` : "";
                    const val = item.dealValue !== undefined && item.dealValue !== null ? ` | Deal Value: ₹${Number(item.dealValue).toLocaleString()}` : "";
                    const status = item.status ? ` | Status: ${item.status}` : "";

                    msg += `\n- ${name}${company}${val}${status}`;
                  });
                }
              }
              return msg;
            }
            if (step.message) return `• ${step.message}`;
            return null;
          })
          .filter(Boolean)
          .join("\n\n");
      } else if (result?.confirmation) {
        reply = result.message;
      } else if (result?.message) {
        reply = result.message;
      } else if (result?.ai?.reply) {
        reply = result.ai.reply;
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: reply },
      ]);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "❌ Unable to connect to AI server.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: 420,
        height: "100vh",
        background: "#ffffff",
        borderLeft: "1px solid #e5e7eb",
        boxShadow: "-10px 0 25px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        zIndex: 2000,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: 16,
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: 600,
        }}
      >
        CRM-360 AI Agent

        <button
          onClick={onClose}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: 20,
          }}
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 16,
          background: "#f9fafb",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent:
                m.role === "user" ? "flex-end" : "flex-start",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                maxWidth: "80%",
                padding: "10px 14px",
                borderRadius: 14,
                whiteSpace: "pre-wrap",
                background:
                  m.role === "user" ? "#2563eb" : "#ffffff",
                color: m.role === "user" ? "#ffffff" : "#111827",
                border:
                  m.role === "assistant"
                    ? "1px solid #e5e7eb"
                    : "none",
              }}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ color: "#6b7280", fontSize: 14 }}>
            AI is thinking...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: 16,
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          gap: 8,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask CRM AI..."
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #d1d5db",
            outline: "none",
          }}
        />

        <button
          onClick={handleSend}
          disabled={loading}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "none",
            background: loading ? "#9ca3af" : "#2563eb",
            color: "white",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}