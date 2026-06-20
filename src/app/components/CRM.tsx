import { useEffect, useMemo, useState } from "react";
import type { ElementType } from "react";
import {
  Brain,
  Calendar,
  Edit3,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import {
  createClientLead,
  deleteClientLead,
  getArchivedClientLeads,
  getClientLeads,
  restoreClientLead,
  updateClientLead,
  type ClientLead,
  type CreateClientLeadPayload,
} from "../lib/clientApi";

type UiLead = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  source: string;
  status: string;
  notes?: string | null;
  score: number;
  stage: "Prospecting" | "Discovery" | "Proposal" | "Negotiation" | "Closing";
  value: string;
  lastContact: string;
  tags: string[];
  avatar: string;
  color: string;
};

type LeadForm = {
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  score: number;
  notes: string;
};

const emptyLeadForm: LeadForm = {
  name: "",
  email: "",
  phone: "",
  source: "website",
  status: "new",
  score: 50,
  notes: "",
};

const stageColors: Record<UiLead["stage"], string> = {
  Prospecting: "#94a3b8",
  Discovery: "#1D4ED8",
  Proposal: "#2563EB",
  Negotiation: "#f59e0b",
  Closing: "#10b981",
};

const leadSources = [
  { label: "Website", value: "website" },
  { label: "Instagram", value: "instagram" },
  { label: "Facebook", value: "facebook" },
  { label: "Referral", value: "referral" },
  { label: "WhatsApp", value: "whatsapp" },
  { label: "Other", value: "other" },
];

const leadStatuses = [
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Qualified", value: "qualified" },
  { label: "Lost", value: "lost" },
  { label: "Won", value: "won" },
];

function getAvatar(name: string) {
  return (
    name
      .trim()
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "LD"
  );
}

function formatLabel(value?: string | null) {
  if (!value) return "Website";
  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function mapStatusToStage(status: string): UiLead["stage"] {
  const normalized = status.toLowerCase();

  const stageMap: Record<string, UiLead["stage"]> = {
    new: "Prospecting",
    contacted: "Discovery",
    qualified: "Proposal",
    proposal: "Negotiation",
    lost: "Prospecting",
    won: "Closing",
    converted: "Closing",
  };

  return stageMap[normalized] || "Prospecting";
}

function mapApiLeadToUiLead(lead: ClientLead, index: number): UiLead {
  const colorList = ["#1D4ED8", "#2563EB", "#06b6d4", "#10b981", "#f59e0b"];
  const stage = mapStatusToStage(lead.status || "new");

  return {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    source: lead.source || "website",
    status: lead.status || "new",
    notes: lead.notes,
    score: lead.score || 50,
    stage,
    value: "₹0",
    lastContact: "Recently",
    tags: [
      formatLabel(lead.status || "new"),
      formatLabel(lead.source || "website"),
    ],
    avatar: getAvatar(lead.name),
    color: colorList[index % colorList.length],
  };
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 16;
  const circ = 2 * Math.PI * r;

  return (
    <div className="relative w-10 h-10 flex-shrink-0">
      <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke="rgba(29,78,216,0.1)"
          strokeWidth="3"
        />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={`${(circ * score) / 100} ${circ}`}
          strokeLinecap="round"
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <span style={{ fontSize: "9px", fontWeight: 700, color }}>{score}</span>
      </div>
    </div>
  );
}

interface CRMProps {
  darkMode: boolean;
}

export function CRM({ darkMode }: CRMProps) {
  const [leads, setLeads] = useState<UiLead[]>([]);
  const [leadViewMode, setLeadViewMode] = useState<"active" | "archived">(
    "active",
  );
  const [restoringLeadId, setRestoringLeadId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<UiLead | null>(null);
  const [activeStage, setActiveStage] = useState<"All" | UiLead["stage"]>(
    "All",
  );
  const [searchQ, setSearchQ] = useState("");
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);

  const [showLeadModal, setShowLeadModal] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [leadForm, setLeadForm] = useState<LeadForm>(emptyLeadForm);
  const [savingLead, setSavingLead] = useState(false);
  const [deletingLead, setDeletingLead] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function loadLeads() {
    try {
      setLoadingLeads(true);
      setLeadError(null);

      const apiLeads =
        leadViewMode === "archived"
          ? await getArchivedClientLeads()
          : await getClientLeads();
      const mappedLeads = apiLeads.map(mapApiLeadToUiLead);

      setLeads(mappedLeads);
      setSelectedLead((current) => {
        if (!mappedLeads.length) return null;
        if (!current) return mappedLeads[0];
        return (
          mappedLeads.find((lead) => lead.id === current.id) || mappedLeads[0]
        );
      });
    } catch (err) {
      setLeadError(err instanceof Error ? err.message : "Failed to load leads");
      setLeads([]);
      setSelectedLead(null);
    } finally {
      setLoadingLeads(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, [leadViewMode]);

  function openCreateLeadModal() {
    setEditingLeadId(null);
    setLeadForm(emptyLeadForm);
    setFormError(null);
    setShowLeadModal(true);
  }

  function openEditLeadModal(lead: UiLead) {
    setEditingLeadId(lead.id);
    setLeadForm({
      name: lead.name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      source: lead.source || "website",
      status: lead.status || "new",
      score: lead.score || 50,
      notes: lead.notes || "",
    });
    setFormError(null);
    setShowLeadModal(true);
  }

  function closeLeadModal() {
    if (savingLead || deletingLead) return;
    setShowLeadModal(false);
    setEditingLeadId(null);
    setLeadForm(emptyLeadForm);
    setFormError(null);
  }

  function buildPayload(): CreateClientLeadPayload {
    return {
      name: leadForm.name.trim(),
      email: leadForm.email.trim() || undefined,
      phone: leadForm.phone.trim() || undefined,
      source: leadForm.source,
      status: leadForm.status,
      score: Math.max(0, Math.min(100, Number(leadForm.score) || 50)),
      notes: leadForm.notes.trim() || undefined,
    };
  }

  async function handleSaveLead() {
    try {
      setFormError(null);

      const payload = buildPayload();

      if (!payload.name) {
        setFormError("Lead name is required.");
        return;
      }

      if (!payload.email && !payload.phone) {
        setFormError("Email ya phone me se ek required hai.");
        return;
      }

      setSavingLead(true);

      if (editingLeadId) {
        const updatedLead = await updateClientLead(editingLeadId, payload);
        const mappedLead = mapApiLeadToUiLead(updatedLead, 0);

        setLeads((prev) =>
          prev.map((lead, index) =>
            lead.id === editingLeadId
              ? mapApiLeadToUiLead(updatedLead, index)
              : lead,
          ),
        );

        setSelectedLead(mappedLead);
      } else {
        const createdLead = await createClientLead(payload);
        const mappedLead = mapApiLeadToUiLead(createdLead, 0);

        setLeads((prev) => [mappedLead, ...prev]);
        setSelectedLead(mappedLead);
      }

      setLeadForm(emptyLeadForm);
      setEditingLeadId(null);
      setShowLeadModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save lead");
    } finally {
      setSavingLead(false);
    }
  }

  async function handleDeleteLead() {
    if (!editingLeadId) return;

    const confirmed = window.confirm(
      "Archive this lead? It will be removed from active CRM.",
    );
    if (!confirmed) return;

    try {
      setDeletingLead(true);
      setFormError(null);

      await deleteClientLead(editingLeadId);

      setLeads((prev) => {
        const next = prev.filter((lead) => lead.id !== editingLeadId);
        setSelectedLead(next[0] || null);
        return next;
      });

      setLeadForm(emptyLeadForm);
      setEditingLeadId(null);
      setShowLeadModal(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to archive lead",
      );
    } finally {
      setDeletingLead(false);
    }
  }
  async function handleRestoreLead(lead: UiLead) {
    try {
      setRestoringLeadId(lead.id);
      setFormError(null);

      await restoreClientLead(lead.id);

      setLeads((prev) => {
        const next = prev.filter((item) => item.id !== lead.id);
        setSelectedLead(next[0] || null);
        return next;
      });

      setLeadViewMode("active");
    } catch (err) {
      setLeadError(
        err instanceof Error ? err.message : "Failed to restore lead",
      );
    } finally {
      setRestoringLeadId(null);
    }
  }

  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      const matchStage = activeStage === "All" || lead.stage === activeStage;
      const query = searchQ.toLowerCase();

      const matchSearch =
        lead.name.toLowerCase().includes(query) ||
        formatLabel(lead.source).toLowerCase().includes(query) ||
        (lead.email || "").toLowerCase().includes(query) ||
        (lead.phone || "").toLowerCase().includes(query);

      return matchStage && matchSearch;
    });
  }, [activeStage, leads, searchQ]);

  const pipelineSummary = useMemo(() => {
    return {
      Prospecting: leads.filter((lead) => lead.stage === "Prospecting").length,
      Discovery: leads.filter((lead) => lead.stage === "Discovery").length,
      Proposal: leads.filter((lead) => lead.stage === "Proposal").length,
      Negotiation: leads.filter((lead) => lead.stage === "Negotiation").length,
      Closing: leads.filter((lead) => lead.stage === "Closing").length,
    };
  }, [leads]);

  const cardBase = {
    background: darkMode ? "rgba(15,23,42,0.8)" : "#ffffff",
    borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.06)",
  };

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <div className="p-6 pb-0 flex-shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                color: darkMode ? "#e2e8f0" : "#0f172a",
              }}
            >
              CRM
            </h1>

            <p
              className="text-sm mt-0.5"
              style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}
            >
              {loadingLeads
                ? "Loading real leads..."
                : leadError
                  ? `Backend error · ${leadError}`
                  : `${leads.length} leads · Real backend data`}
            </p>
          </div>

          {leadViewMode === "active" && (
            <button
              onClick={openCreateLeadModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
              style={{
                background: "linear-gradient(135deg, #1D4ED8, #2563EB)",
                color: "#ffffff",
                boxShadow: "0 4px 14px rgba(29,78,216,0.3)",
              }}
            >
              <Plus size={14} /> Add Lead
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mb-4">
          {[
            { label: "Active Leads", value: "active" },
            { label: "Archived Leads", value: "archived" },
          ].map((tab) => {
            const isActive = leadViewMode === tab.value;

            return (
              <button
                key={tab.value}
                onClick={() => {
                  setLeadViewMode(tab.value as "active" | "archived");
                  setActiveStage("All");
                  setSearchQ("");
                }}
                className="px-4 py-2 rounded-xl text-sm border transition-all"
                style={{
                  background: isActive
                    ? "linear-gradient(135deg, #1D4ED8, #2563EB)"
                    : darkMode
                      ? "rgba(29,78,216,0.04)"
                      : "#ffffff",
                  borderColor: isActive
                    ? "rgba(29,78,216,0.35)"
                    : cardBase.borderColor,
                  color: isActive
                    ? "#ffffff"
                    : darkMode
                      ? "#94a3b8"
                      : "#64748b",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-5 gap-3 mb-5">
          {Object.entries(pipelineSummary).map(([stage, count]) => {
            const typedStage = stage as UiLead["stage"];

            return (
              <button
                key={typedStage}
                onClick={() =>
                  setActiveStage(
                    typedStage === activeStage ? "All" : typedStage,
                  )
                }
                className="p-3 rounded-xl border transition-all hover:border-primary/20"
                style={{
                  background:
                    activeStage === typedStage
                      ? `${stageColors[typedStage]}12`
                      : cardBase.background,
                  borderColor:
                    activeStage === typedStage
                      ? `${stageColors[typedStage]}30`
                      : cardBase.borderColor,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="text-xs"
                    style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}
                  >
                    {typedStage}
                  </span>
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: stageColors[typedStage] }}
                  />
                </div>

                <div
                  className="font-semibold"
                  style={{
                    fontSize: "1.1rem",
                    color: darkMode ? "#e2e8f0" : "#0f172a",
                  }}
                >
                  {count}
                </div>

                <div
                  className="text-xs mt-0.5"
                  style={{ color: stageColors[typedStage] }}
                >
                  Live
                </div>
              </button>
            );
          })}
        </div>

        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl border mb-4"
          style={{
            background: darkMode ? "rgba(29,78,216,0.04)" : "#ffffff",
            borderColor: cardBase.borderColor,
          }}
        >
          <Search
            size={14}
            style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}
          />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search leads..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-4 px-6 pb-6">
        <div className="overflow-y-auto space-y-3 pr-1">
          {filtered.length === 0 && (
            <div
              className="rounded-2xl border p-6 text-sm"
              style={{
                background: cardBase.background,
                borderColor: cardBase.borderColor,
                color: darkMode ? "#94a3b8" : "#64748b",
              }}
            >
              No leads found. Add a lead from the button above.
            </div>
          )}

          {filtered.map((lead, index) => (
            <motion.button
              key={lead.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              onClick={() => setSelectedLead(lead)}
              className="w-full p-4 rounded-2xl border text-left transition-all hover:border-primary/30"
              style={{
                background:
                  selectedLead?.id === lead.id
                    ? darkMode
                      ? "rgba(29,78,216,0.12)"
                      : "rgba(29,78,216,0.06)"
                    : cardBase.background,
                borderColor:
                  selectedLead?.id === lead.id
                    ? "rgba(29,78,216,0.35)"
                    : cardBase.borderColor,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-semibold"
                  style={{ background: `${lead.color}18`, color: lead.color }}
                >
                  {lead.avatar}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}
                  >
                    {lead.name}
                  </p>
                  <p
                    className="text-xs truncate"
                    style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}
                  >
                    {lead.email || lead.phone || "Real Estate Lead"}
                  </p>
                </div>

                <ScoreRing score={lead.score} color={lead.color} />
              </div>

              <div className="flex items-center gap-2 mt-3">
                <span
                  className="text-xs px-2 py-1 rounded-full"
                  style={{
                    background: `${stageColors[lead.stage]}15`,
                    color: stageColors[lead.stage],
                  }}
                >
                  {lead.stage}
                </span>

                {lead.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      background: darkMode
                        ? "rgba(29,78,216,0.08)"
                        : "rgba(29,78,216,0.06)",
                      color: darkMode ? "#94a3b8" : "#64748b",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.button>
          ))}
        </div>

        <div
          className="rounded-2xl border p-5 overflow-y-auto"
          style={{
            background: cardBase.background,
            borderColor: cardBase.borderColor,
          }}
        >
          {selectedLead ? (
            <>
              <div className="flex items-start gap-4 mb-6">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-semibold"
                  style={{
                    background: `${selectedLead.color}18`,
                    color: selectedLead.color,
                  }}
                >
                  {selectedLead.avatar}
                </div>

                <div className="flex-1">
                  <h2
                    className="text-lg font-semibold"
                    style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}
                  >
                    {selectedLead.name}
                  </h2>
                  <p
                    className="text-sm"
                    style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}
                  >
                    {selectedLead.email ||
                      selectedLead.phone ||
                      "No contact detail"}
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: selectedLead.color }}
                  >
                    {formatLabel(selectedLead.source)}
                  </p>
                </div>

                <ScoreRing
                  score={selectedLead.score}
                  color={selectedLead.color}
                />
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { icon: Phone, label: "Call" },
                  { icon: Mail, label: "Email" },
                  { icon: MessageSquare, label: "Message" },
                ].map((action) => (
                  <button
                    key={action.label}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all hover:border-primary/30"
                    style={{
                      borderColor: cardBase.borderColor,
                      color: darkMode ? "#94a3b8" : "#64748b",
                    }}
                  >
                    <action.icon size={15} />
                    <span className="text-xs">{action.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div
                  className="rounded-xl border p-4"
                  style={{
                    borderColor: cardBase.borderColor,
                    background: darkMode
                      ? "rgba(29,78,216,0.03)"
                      : "rgba(29,78,216,0.02)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Brain size={14} style={{ color: "#1D4ED8" }} />
                    <span
                      className="text-sm font-medium"
                      style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}
                    >
                      AI Insight
                    </span>
                  </div>

                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                  >
                    {selectedLead.score >= 80
                      ? "High-priority lead. Contact within 24 hours and suggest matching properties."
                      : selectedLead.score >= 60
                        ? "Warm lead. Send property options and schedule a follow-up."
                        : "Early-stage lead. Collect budget, location and property preference details."}
                  </p>
                </div>

                <div
                  className="rounded-xl border p-4"
                  style={{
                    borderColor: cardBase.borderColor,
                    background: darkMode
                      ? "rgba(29,78,216,0.03)"
                      : "rgba(29,78,216,0.02)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={14} style={{ color: "#10b981" }} />
                    <span
                      className="text-sm font-medium"
                      style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}
                    >
                      Lead Notes
                    </span>
                  </div>

                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                  >
                    {selectedLead.notes || "No notes added yet."}
                  </p>
                </div>

                {leadViewMode === "archived" ? (
                  <button
                    onClick={() => handleRestoreLead(selectedLead)}
                    disabled={restoringLeadId === selectedLead.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-60"
                    style={{
                      background: "linear-gradient(135deg, #10b981, #06b6d4)",
                      color: "#ffffff",
                    }}
                  >
                    {restoringLeadId === selectedLead.id
                      ? "Restoring..."
                      : "Restore Lead"}
                  </button>
                ) : (
                  <button
                    onClick={() => openEditLeadModal(selectedLead)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                    style={{
                      background: "linear-gradient(135deg, #1D4ED8, #2563EB)",
                      color: "#ffffff",
                    }}
                  >
                    <Edit3 size={14} /> Edit Lead
                  </button>
                )}
              </div>
            </>
          ) : (
            <div
              className="h-full flex items-center justify-center text-sm"
              style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
            >
              Select a lead to view details.
            </div>
          )}
        </div>
      </div>

      {showLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.45)" }}
            onClick={closeLeadModal}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-2xl rounded-2xl border p-5"
            style={{
              background: darkMode ? "#0F172A" : "#ffffff",
              borderColor: cardBase.borderColor,
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2
                  className="text-lg font-semibold"
                  style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}
                >
                  {editingLeadId ? "Edit Lead" : "Add New Lead"}
                </h2>
                <p
                  className="text-xs mt-1"
                  style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}
                >
                  {editingLeadId
                    ? "Update this lead directly in backend CRM."
                    : "This lead will be saved directly in backend CRM."}
                </p>
              </div>

              <button
                onClick={closeLeadModal}
                className="p-2 rounded-xl"
                style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div
                className="rounded-xl border px-3 py-2 text-sm mb-4"
                style={{
                  background: darkMode
                    ? "rgba(239,68,68,0.08)"
                    : "rgba(239,68,68,0.06)",
                  borderColor: "rgba(239,68,68,0.25)",
                  color: "#ef4444",
                }}
              >
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  className="text-xs"
                  style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                >
                  Name *
                </label>
                <input
                  value={leadForm.name}
                  onChange={(e) =>
                    setLeadForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full mt-1 px-3 py-2 rounded-xl border bg-transparent outline-none text-sm"
                  style={{
                    borderColor: cardBase.borderColor,
                    color: darkMode ? "#e2e8f0" : "#0f172a",
                  }}
                  placeholder="Lead name"
                />
              </div>

              <div>
                <label
                  className="text-xs"
                  style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                >
                  Email
                </label>
                <input
                  value={leadForm.email}
                  onChange={(e) =>
                    setLeadForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full mt-1 px-3 py-2 rounded-xl border bg-transparent outline-none text-sm"
                  style={{
                    borderColor: cardBase.borderColor,
                    color: darkMode ? "#e2e8f0" : "#0f172a",
                  }}
                  placeholder="email@test.com"
                />
              </div>

              <div>
                <label
                  className="text-xs"
                  style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                >
                  Phone
                </label>
                <input
                  value={leadForm.phone}
                  onChange={(e) =>
                    setLeadForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full mt-1 px-3 py-2 rounded-xl border bg-transparent outline-none text-sm"
                  style={{
                    borderColor: cardBase.borderColor,
                    color: darkMode ? "#e2e8f0" : "#0f172a",
                  }}
                  placeholder="9876543210"
                />
              </div>

              <div>
                <label
                  className="text-xs"
                  style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                >
                  Score
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={leadForm.score}
                  onChange={(e) =>
                    setLeadForm((prev) => ({
                      ...prev,
                      score: Number(e.target.value),
                    }))
                  }
                  className="w-full mt-1 px-3 py-2 rounded-xl border bg-transparent outline-none text-sm"
                  style={{
                    borderColor: cardBase.borderColor,
                    color: darkMode ? "#e2e8f0" : "#0f172a",
                  }}
                />
              </div>

              <div>
                <label
                  className="text-xs"
                  style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                >
                  Source
                </label>
                <select
                  value={leadForm.source}
                  onChange={(e) =>
                    setLeadForm((prev) => ({ ...prev, source: e.target.value }))
                  }
                  className="w-full mt-1 px-3 py-2 rounded-xl border bg-transparent outline-none text-sm"
                  style={{
                    borderColor: cardBase.borderColor,
                    color: darkMode ? "#e2e8f0" : "#0f172a",
                  }}
                >
                  {leadSources.map((source) => (
                    <option key={source.value} value={source.value}>
                      {source.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className="text-xs"
                  style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                >
                  Status
                </label>
                <select
                  value={leadForm.status}
                  onChange={(e) =>
                    setLeadForm((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="w-full mt-1 px-3 py-2 rounded-xl border bg-transparent outline-none text-sm"
                  style={{
                    borderColor: cardBase.borderColor,
                    color: darkMode ? "#e2e8f0" : "#0f172a",
                  }}
                >
                  {leadStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label
                  className="text-xs"
                  style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                >
                  Notes
                </label>
                <textarea
                  value={leadForm.notes}
                  onChange={(e) =>
                    setLeadForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="w-full mt-1 px-3 py-2 rounded-xl border bg-transparent outline-none text-sm min-h-24 resize-none"
                  style={{
                    borderColor: cardBase.borderColor,
                    color: darkMode ? "#e2e8f0" : "#0f172a",
                  }}
                  placeholder="Requirement, budget, preferred location..."
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 mt-5">
              <div>
                {editingLeadId && (
                  <button
                    onClick={handleDeleteLead}
                    disabled={savingLead || deletingLead}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm border disabled:opacity-60"
                    style={{
                      borderColor: "rgba(239,68,68,0.25)",
                      color: "#ef4444",
                    }}
                  >
                    <Trash2 size={14} />
                    {deletingLead ? "Archiving..." : "Archive Lead"}
                  </button>
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={closeLeadModal}
                  disabled={savingLead || deletingLead}
                  className="px-4 py-2 rounded-xl text-sm border"
                  style={{
                    borderColor: cardBase.borderColor,
                    color: darkMode ? "#94a3b8" : "#64748b",
                  }}
                >
                  Cancel
                </button>

                <button
                  onClick={handleSaveLead}
                  disabled={savingLead || deletingLead}
                  className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{
                    background: "linear-gradient(135deg, #1D4ED8, #2563EB)",
                    color: "#ffffff",
                    opacity: savingLead ? 0.7 : 1,
                  }}
                >
                  {savingLead
                    ? "Saving..."
                    : editingLeadId
                      ? "Update Lead"
                      : "Create Lead"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
