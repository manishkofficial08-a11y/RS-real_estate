import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Inbox,
  LifeBuoy,
  MessageSquare,
  RefreshCw,
  Send,
} from "lucide-react";
import {
  addClientSupportMessage,
  createSupportTicket,
  getMySupportTickets,
  type CreateSupportTicketPayload,
  type SupportTicket,
  type SupportTicketCategory,
  type SupportTicketPriority,
} from "../lib/clientApi";

interface SupportProps {
  darkMode: boolean;
}

const categories: Array<{ label: string; value: SupportTicketCategory }> = [
  { label: "General", value: "general" },
  { label: "Billing", value: "billing" },
  { label: "Technical", value: "technical" },
  { label: "CRM", value: "crm" },
  { label: "Properties", value: "properties" },
  { label: "AI Agents", value: "ai_agents" },
  { label: "Other", value: "other" },
];

const priorities: Array<{ label: string; value: SupportTicketPriority }> = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Urgent", value: "urgent" },
];

const emptyForm: CreateSupportTicketPayload = {
  subject: "",
  category: "general",
  priority: "medium",
  message: "",
};

function formatLabel(value?: string | null) {
  if (!value) return "General";
  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return "Just now";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusColor(status: string) {
  if (status === "open") return "#1D4ED8";
  if (status === "in_progress") return "#f59e0b";
  if (status === "resolved") return "#10b981";
  if (status === "closed") return "#64748b";
  return "#94a3b8";
}

function priorityColor(priority: string) {
  if (priority === "urgent") return "#ef4444";
  if (priority === "high") return "#f97316";
  if (priority === "medium") return "#f59e0b";
  return "#10b981";
}

export function Support({ darkMode }: SupportProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [form, setForm] = useState<CreateSupportTicketPayload>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const cardBase = {
    background: darkMode ? "rgba(15,23,42,0.8)" : "#ffffff",
    borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.06)",
  };

  async function loadTickets() {
    try {
      setLoading(true);
      setMessage(null);
      const data = await getMySupportTickets();
      setTickets(data);
      setSelectedTicketId((current) => current || data[0]?.id || null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to load tickets");
      setTickets([]);
      setSelectedTicketId(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) || tickets[0],
    [selectedTicketId, tickets],
  );

  const counts = useMemo(
    () => ({
      open: tickets.filter((ticket) => ticket.status === "open").length,
      inProgress: tickets.filter((ticket) => ticket.status === "in_progress")
        .length,
      resolved: tickets.filter((ticket) => ticket.status === "resolved").length,
    }),
    [tickets],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.subject.trim() || !form.message.trim()) {
      setMessage("Subject and message are required.");
      return;
    }

    try {
      setSubmitting(true);
      setMessage(null);
      const created = await createSupportTicket({
        ...form,
        subject: form.subject.trim(),
        message: form.message.trim(),
      });

      setTickets((prev) => [created, ...prev]);
      setSelectedTicketId(created.id);
      setForm(emptyForm);
      setMessage("Ticket submitted successfully.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTicket || !reply.trim()) return;

    try {
      setSendingReply(true);
      setMessage(null);
      const updated = await addClientSupportMessage(selectedTicket.id, reply.trim());
      setTickets((current) =>
        current.map((ticket) => (ticket.id === updated.id ? updated : ticket)),
      );
      setReply("");
      setMessage("Reply sent successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #1D4ED8, #2563EB)",
                  color: "#ffffff",
                }}
              >
                <LifeBuoy size={17} />
              </div>
              <div>
                <h1
                  className="font-semibold"
                  style={{
                    fontSize: "1.5rem",
                    color: darkMode ? "#e2e8f0" : "#0f172a",
                  }}
                >
                  Support
                </h1>
                <p
                  className="text-sm mt-0.5"
                  style={{ color: darkMode ? "#64748b" : "#64748b" }}
                >
                  Raise issues and track founder team replies.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={loadTickets}
            className="p-2 rounded-xl border transition-all hover:bg-primary/5"
            style={{
              borderColor: cardBase.borderColor,
              color: darkMode ? "#94a3b8" : "#475569",
            }}
            title="Refresh tickets"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {message && (
          <div
            className="rounded-xl border px-4 py-3 text-sm"
            style={{
              background: message.includes("success")
                ? "rgba(16,185,129,0.08)"
                : "rgba(245,158,11,0.08)",
              borderColor: message.includes("success")
                ? "rgba(16,185,129,0.22)"
                : "rgba(245,158,11,0.22)",
              color: message.includes("success") ? "#10b981" : "#f59e0b",
            }}
          >
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border p-5 space-y-4"
            style={cardBase}
          >
            <div>
              <h2
                className="text-base font-semibold"
                style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}
              >
                New Ticket
              </h2>
              <p
                className="text-xs mt-1"
                style={{ color: darkMode ? "#64748b" : "#64748b" }}
              >
                Send a clear issue to the founder support team.
              </p>
            </div>

            <div>
              <label
                className="text-xs"
                style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
              >
                Subject
              </label>
              <input
                value={form.subject}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, subject: event.target.value }))
                }
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{
                  background: darkMode ? "rgba(29,78,216,0.06)" : "#f8fafc",
                  borderColor: cardBase.borderColor,
                  color: darkMode ? "#e2e8f0" : "#0f172a",
                }}
                placeholder="Need help with CRM leads"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className="text-xs"
                  style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                >
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      category: event.target.value as SupportTicketCategory,
                    }))
                  }
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{
                    background: darkMode ? "#0F172A" : "#ffffff",
                    borderColor: cardBase.borderColor,
                    color: darkMode ? "#e2e8f0" : "#0f172a",
                  }}
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className="text-xs"
                  style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                >
                  Priority
                </label>
                <select
                  value={form.priority}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      priority: event.target.value as SupportTicketPriority,
                    }))
                  }
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{
                    background: darkMode ? "#0F172A" : "#ffffff",
                    borderColor: cardBase.borderColor,
                    color: darkMode ? "#e2e8f0" : "#0f172a",
                  }}
                >
                  {priorities.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                className="text-xs"
                style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
              >
                Message
              </label>
              <textarea
                value={form.message}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, message: event.target.value }))
                }
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm min-h-32 resize-none outline-none"
                style={{
                  background: darkMode ? "rgba(29,78,216,0.06)" : "#f8fafc",
                  borderColor: cardBase.borderColor,
                  color: darkMode ? "#e2e8f0" : "#0f172a",
                }}
                placeholder="Explain what happened, where you saw it, and what you expected."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #1D4ED8, #2563EB)",
                color: "#ffffff",
              }}
            >
              <Send size={14} />
              {submitting ? "Submitting..." : "Submit Ticket"}
            </button>
          </form>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Open", value: counts.open, icon: Inbox, color: "#1D4ED8" },
                {
                  label: "In Progress",
                  value: counts.inProgress,
                  icon: Clock,
                  color: "#f59e0b",
                },
                {
                  label: "Resolved",
                  value: counts.resolved,
                  icon: CheckCircle2,
                  color: "#10b981",
                },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border p-4" style={cardBase}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs" style={{ color: darkMode ? "#64748b" : "#64748b" }}>
                        {item.label}
                      </p>
                      <p className="text-xl font-semibold mt-1" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                        {item.value}
                      </p>
                    </div>
                    <item.icon size={18} style={{ color: item.color }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-4">
              <div className="rounded-2xl border overflow-hidden" style={cardBase}>
                <div
                  className="px-4 py-3 border-b"
                  style={{ borderColor: cardBase.borderColor }}
                >
                  <p className="text-sm font-semibold" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                    Your Tickets
                  </p>
                </div>

                <div className="max-h-[520px] overflow-y-auto p-2 space-y-2">
                  {loading ? (
                    <div className="p-6 text-sm" style={{ color: "#64748b" }}>
                      Loading tickets...
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="p-6 text-sm" style={{ color: "#64748b" }}>
                      No support tickets yet.
                    </div>
                  ) : (
                    tickets.map((ticket) => {
                      const isActive = selectedTicket?.id === ticket.id;
                      return (
                        <button
                          key={ticket.id}
                          onClick={() => setSelectedTicketId(ticket.id)}
                          className="w-full rounded-xl border p-3 text-left transition-all"
                          style={{
                            background: isActive
                              ? "rgba(29,78,216,0.12)"
                              : "transparent",
                            borderColor: isActive
                              ? "rgba(29,78,216,0.35)"
                              : cardBase.borderColor,
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium line-clamp-1" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                              {ticket.subject}
                            </p>
                            <span
                              className="text-xs px-2 py-0.5 rounded-full capitalize"
                              style={{
                                background: `${statusColor(ticket.status)}18`,
                                color: statusColor(ticket.status),
                              }}
                            >
                              {formatLabel(ticket.status)}
                            </span>
                          </div>
                          <p className="text-xs mt-2 line-clamp-2" style={{ color: "#64748b" }}>
                            {ticket.message}
                          </p>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="rounded-2xl border p-5 min-h-[360px]" style={cardBase}>
                {selectedTicket ? (
                  <div className="space-y-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-semibold" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                          {selectedTicket.subject}
                        </h2>
                        <p className="text-xs mt-1" style={{ color: "#64748b" }}>
                          Created {formatDate(selectedTicket.created_at)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <span
                          className="text-xs px-2.5 py-1 rounded-full capitalize"
                          style={{
                            background: `${priorityColor(selectedTicket.priority)}18`,
                            color: priorityColor(selectedTicket.priority),
                          }}
                        >
                          {formatLabel(selectedTicket.priority)}
                        </span>
                        <span
                          className="text-xs px-2.5 py-1 rounded-full capitalize"
                          style={{
                            background: `${statusColor(selectedTicket.status)}18`,
                            color: statusColor(selectedTicket.status),
                          }}
                        >
                          {formatLabel(selectedTicket.status)}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl border overflow-hidden" style={{ borderColor: cardBase.borderColor }}>
                      <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: cardBase.borderColor }}>
                        <div className="flex items-center gap-2">
                          <MessageSquare size={14} style={{ color: "#1D4ED8" }} />
                          <span className="text-sm font-medium" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                            Conversation
                          </span>
                        </div>
                        <span className="text-xs" style={{ color: "#64748b" }}>
                          {formatLabel(selectedTicket.category)}
                        </span>
                      </div>
                      <div className="max-h-[360px] space-y-3 overflow-y-auto p-4">
                        {(selectedTicket.messages?.length
                          ? selectedTicket.messages
                          : [{ id: "legacy", author_type: "client", message: selectedTicket.message, created_at: selectedTicket.created_at }]
                        ).map((item) => {
                          const fromFounder = item.author_type === "admin";
                          return (
                            <div key={item.id} className={`flex ${fromFounder ? "justify-start" : "justify-end"}`}>
                              <div
                                className="max-w-[86%] rounded-2xl px-4 py-3"
                                style={{
                                  background: fromFounder
                                    ? darkMode ? "rgba(16,185,129,0.10)" : "rgba(16,185,129,0.08)"
                                    : "rgba(29,78,216,0.12)",
                                  border: `1px solid ${fromFounder ? "rgba(16,185,129,0.20)" : "rgba(29,78,216,0.20)"}`,
                                }}
                              >
                                <p className="mb-1 text-[11px] font-medium" style={{ color: fromFounder ? "#10b981" : "#1D4ED8" }}>
                                  {fromFounder ? item.author_name || "Founder Support" : item.author_name || "Your team"}
                                </p>
                                <p className="whitespace-pre-wrap text-sm leading-6" style={{ color: darkMode ? "#cbd5e1" : "#334155" }}>
                                  {item.message}
                                </p>
                                <p className="mt-1.5 text-[10px]" style={{ color: "#64748b" }}>
                                  {formatDate(item.created_at)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <form onSubmit={handleReply} className="flex gap-2 border-t p-3" style={{ borderColor: cardBase.borderColor }}>
                        <input
                          value={reply}
                          onChange={(event) => setReply(event.target.value)}
                          placeholder="Reply to founder support..."
                          className="min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm outline-none"
                          style={{
                            background: darkMode ? "rgba(2,6,23,0.35)" : "#f8fafc",
                            borderColor: cardBase.borderColor,
                            color: darkMode ? "#e2e8f0" : "#0f172a",
                          }}
                        />
                        <button
                          type="submit"
                          disabled={sendingReply || !reply.trim()}
                          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                          style={{ background: "#1D4ED8" }}
                        >
                          <Send size={13} /> {sendingReply ? "Sending" : "Send"}
                        </button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm" style={{ color: "#64748b" }}>
                    Select a ticket to view details.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
