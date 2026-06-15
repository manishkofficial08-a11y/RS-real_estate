import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Brain,
} from "lucide-react";
import { motion } from "motion/react";
import { getClientLeads, type ClientLead } from "../lib/clientApi";

type UiLead = {
  id: string;
  name: string;
  company: string;
  title: string;
  score: number;
  stage: "Prospecting" | "Discovery" | "Proposal" | "Negotiation" | "Closing";
  value: string;
  lastContact: string;
  tags: string[];
  avatar: string;
  color: string;
};

const demoLeads: UiLead[] = [
  {
    id: "demo-1",
    name: "Sarah Chen",
    company: "TechVenture Co.",
    title: "CMO",
    score: 94,
    stage: "Proposal",
    value: "$48,000",
    lastContact: "2 hr ago",
    tags: ["Hot Lead", "Enterprise"],
    avatar: "SC",
    color: "#6366f1",
  },
  {
    id: "demo-2",
    name: "Marcus Rodriguez",
    company: "GrowthLabs Inc.",
    title: "VP Marketing",
    score: 87,
    stage: "Discovery",
    value: "$32,000",
    lastContact: "1 day ago",
    tags: ["Warm", "Mid-Market"],
    avatar: "MR",
    color: "#8b5cf6",
  },
  {
    id: "demo-3",
    name: "Emily Watson",
    company: "ScaleUp Agency",
    title: "CEO",
    score: 76,
    stage: "Negotiation",
    value: "$85,000",
    lastContact: "3 hr ago",
    tags: ["Hot Lead", "Agency"],
    avatar: "EW",
    color: "#06b6d4",
  },
  {
    id: "demo-4",
    name: "David Kim",
    company: "DataSync Systems",
    title: "Director of Ops",
    score: 68,
    stage: "Prospecting",
    value: "$22,000",
    lastContact: "5 days ago",
    tags: ["Cold", "SMB"],
    avatar: "DK",
    color: "#10b981",
  },
  {
    id: "demo-5",
    name: "Priya Sharma",
    company: "MediaFlow Digital",
    title: "Head of Growth",
    score: 91,
    stage: "Closing",
    value: "$120,000",
    lastContact: "30 min ago",
    tags: ["Hot Lead", "Enterprise"],
    avatar: "PS",
    color: "#f59e0b",
  },
];

const stageColors: Record<UiLead["stage"], string> = {
  Prospecting: "#94a3b8",
  Discovery: "#6366f1",
  Proposal: "#8b5cf6",
  Negotiation: "#f59e0b",
  Closing: "#10b981",
};

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

function mapStatusToStage(status: string): UiLead["stage"] {
  const normalized = status.toLowerCase();

  const stageMap: Record<string, UiLead["stage"]> = {
    new: "Prospecting",
    contacted: "Discovery",
    qualified: "Proposal",
    proposal: "Negotiation",
    converted: "Closing",
    lost: "Prospecting",
  };

  return stageMap[normalized] || "Prospecting";
}

function mapApiLeadToUiLead(lead: ClientLead, index: number): UiLead {
  const colorList = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"];
  const stage = mapStatusToStage(lead.status || "new");

  return {
    id: lead.id,
    name: lead.name,
    company: lead.source || "Website Lead",
    title: lead.email || lead.phone || "Real Estate Lead",
    score: lead.score || 50,
    stage,
    value: "₹0",
    lastContact: "Recently",
    tags: [lead.status || "New", lead.source || "Website"],
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
          stroke="rgba(99,102,241,0.1)"
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
  const [leads, setLeads] = useState<UiLead[]>(demoLeads);
  const [selectedLead, setSelectedLead] = useState<UiLead>(demoLeads[0]);
  const [activeStage, setActiveStage] = useState<"All" | UiLead["stage"]>("All");
  const [searchQ, setSearchQ] = useState("");
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLeads() {
      try {
        setLoadingLeads(true);
        setLeadError(null);

        const apiLeads = await getClientLeads();
        const mappedLeads = apiLeads.map(mapApiLeadToUiLead);

        if (mappedLeads.length > 0) {
          setLeads(mappedLeads);
          setSelectedLead(mappedLeads[0]);
        }
      } catch (err) {
        setLeadError(err instanceof Error ? err.message : "Failed to load leads");
      } finally {
        setLoadingLeads(false);
      }
    }

    loadLeads();
  }, []);

  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      const matchStage = activeStage === "All" || lead.stage === activeStage;
      const query = searchQ.toLowerCase();

      const matchSearch =
        lead.name.toLowerCase().includes(query) ||
        lead.company.toLowerCase().includes(query) ||
        lead.title.toLowerCase().includes(query);

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
    background: darkMode ? "rgba(13,13,40,0.8)" : "#ffffff",
    borderColor: darkMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.06)",
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

            <p className="text-sm mt-0.5" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>
              {loadingLeads
                ? "Loading real leads..."
                : leadError
                  ? `Using demo leads · ${leadError}`
                  : `${leads.length} leads · Real backend data`}
            </p>
          </div>

          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#ffffff",
              boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
            }}
          >
            <Plus size={14} /> Add Lead
          </button>
        </div>

        <div className="grid grid-cols-5 gap-3 mb-5">
          {Object.entries(pipelineSummary).map(([stage, count]) => {
            const typedStage = stage as UiLead["stage"];

            return (
              <button
                key={typedStage}
                onClick={() => setActiveStage(typedStage === activeStage ? "All" : typedStage)}
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
                  <span className="text-xs" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>
                    {typedStage}
                  </span>
                  <div className="w-2 h-2 rounded-full" style={{ background: stageColors[typedStage] }} />
                </div>

                <div
                  className="font-semibold"
                  style={{ fontSize: "1.1rem", color: darkMode ? "#e2e8f0" : "#0f172a" }}
                >
                  {count}
                </div>

                <div className="text-xs mt-0.5" style={{ color: stageColors[typedStage] }}>
                  ₹0
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex gap-4 px-6 pb-6 min-h-0">
        <div className="flex flex-col w-80 flex-shrink-0 min-h-0">
          <div className="relative mb-3 flex-shrink-0">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}
            />

            <input
              value={searchQ}
              onChange={(event) => setSearchQ(event.target.value)}
              placeholder="Search leads..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm"
              style={{
                background: darkMode ? "rgba(99,102,241,0.06)" : "#f8fafc",
                borderColor: cardBase.borderColor,
                color: darkMode ? "#e2e8f0" : "#0f172a",
              }}
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filtered.length === 0 ? (
              <div
                className="rounded-xl border p-4 text-sm"
                style={{
                  ...cardBase,
                  color: darkMode ? "#64748b" : "#64748b",
                }}
              >
                No leads found.
              </div>
            ) : (
              filtered.map((lead) => (
                <motion.button
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className="w-full text-left p-3 rounded-xl border transition-all"
                  style={{
                    background:
                      selectedLead.id === lead.id
                        ? darkMode
                          ? `${lead.color}12`
                          : `${lead.color}06`
                        : cardBase.background,
                    borderColor:
                      selectedLead.id === lead.id ? `${lead.color}30` : cardBase.borderColor,
                  }}
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: `${lead.color}20`, color: lead.color }}
                    >
                      {lead.avatar}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className="text-sm font-medium truncate"
                          style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}
                        >
                          {lead.name}
                        </span>

                        <ScoreRing score={lead.score} color={lead.color} />
                      </div>

                      <p className="text-xs truncate" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>
                        {lead.company}
                      </p>

                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{
                            background: `${stageColors[lead.stage]}15`,
                            color: stageColors[lead.stage],
                          }}
                        >
                          {lead.stage}
                        </span>

                        <span className="text-xs" style={{ color: darkMode ? "#2d3748" : "#94a3b8" }}>
                          {lead.value}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl border p-5" style={cardBase}>
          <div className="flex items-start gap-4 mb-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${selectedLead.color}30, ${selectedLead.color}10)`,
                color: selectedLead.color,
                boxShadow: `0 0 24px ${selectedLead.color}20`,
              }}
            >
              {selectedLead.avatar}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                    {selectedLead.name}
                  </h2>

                  <p className="text-sm" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>
                    {selectedLead.title} · {selectedLead.company}
                  </p>

                  <div className="flex gap-2 mt-2">
                    {selectedLead.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${selectedLead.color}15`, color: selectedLead.color }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className="font-bold"
                    style={{ fontSize: "1.25rem", color: darkMode ? "#e2e8f0" : "#0f172a" }}
                  >
                    {selectedLead.value}
                  </div>
                  <p className="text-xs" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>
                    deal value
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            {[
              { icon: Phone, label: "Call" },
              { icon: Mail, label: "Email" },
              { icon: MessageSquare, label: "Message" },
              { icon: Calendar, label: "Schedule" },
            ].map((action) => (
              <button
                key={action.label}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all hover:bg-primary/5"
                style={{ borderColor: cardBase.borderColor, color: darkMode ? "#94a3b8" : "#475569" }}
              >
                <action.icon size={13} /> {action.label}
              </button>
            ))}
          </div>

          <div
            className="p-4 rounded-xl border mb-4"
            style={{
              background: darkMode ? `${selectedLead.color}08` : `${selectedLead.color}04`,
              borderColor: `${selectedLead.color}20`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Brain size={13} style={{ color: selectedLead.color }} />

              <span className="text-xs font-semibold" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                AI Lead Score Analysis
              </span>

              <span className="text-sm font-bold ml-auto" style={{ color: selectedLead.color }}>
                {selectedLead.score}/100
              </span>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: darkMode ? "#64748b" : "#64748b" }}>
              {selectedLead.name} is currently marked as {selectedLead.stage}. Follow up quickly, verify budget and requirement, then move the lead toward the next pipeline stage.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold mb-3" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>
              ACTIVITY TIMELINE
            </h4>

            <div className="space-y-3">
              {[
                { time: selectedLead.lastContact, event: "Lead imported from backend CRM data", type: "api" },
                { time: "Today", event: "AI score calculated from lead status and source", type: "ai" },
                { time: "Recently", event: "Recommended next action: call or email follow-up", type: "task" },
                { time: "Recently", event: "Pipeline stage synchronized with backend status", type: "sync" },
              ].map((item, index) => (
                <div key={`${item.type}-${index}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: selectedLead.color }} />
                    {index < 3 && (
                      <div
                        className="w-px flex-1 mt-1"
                        style={{ background: darkMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.06)" }}
                      />
                    )}
                  </div>

                  <div className="pb-3">
                    <p className="text-xs" style={{ color: darkMode ? "#94a3b8" : "#475569" }}>
                      {item.event}
                    </p>

                    <p className="text-xs mt-0.5" style={{ color: darkMode ? "#2d3748" : "#94a3b8" }}>
                      {item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
